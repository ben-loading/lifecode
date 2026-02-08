import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import {
  getArchiveById,
  getUserById,
  updateUserBalance,
  createTransaction,
  createDeepReportJob,
  updateDeepReportJob,
  getRunningDeepReportJobForArchive,
  getDeepReportByArchiveAndType,
  getLastDeepReportJobForArchive,
} from '@/lib/db'
import { parseJsonBody, badRequest, unauthorized } from '@/lib/api-utils'
import { DEEP_REPORT_COST, DEEP_REPORT_TYPES } from '@/lib/costs'
import type { DeepReportType } from '@/lib/costs'
import { ensureLLMConfigured } from '@/lib/services/llm-service'
import { generateDeepReport } from '@/lib/services/deep-report-service'

/** 深度报告 LLM 同请求内完成，需 maxDuration 足够 */
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()

    const body = await parseJsonBody<{ archiveId?: string; reportType?: string; retry?: boolean }>(request)
    if (body == null) return badRequest('請求體無效')
    const archiveId = typeof body.archiveId === 'string' ? body.archiveId.trim() : ''
    const reportType = typeof body.reportType === 'string' ? body.reportType.trim() : ''
    const isRetry = body.retry === true
    if (!archiveId || !reportType) return badRequest('缺少 archiveId 或 reportType')
    if (!DEEP_REPORT_TYPES.includes(reportType as DeepReportType)) return badRequest('無效的 reportType')

    const archive = await getArchiveById(archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '檔案不存在' }, { status: 404 })
    }
    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 })

    const existingReport = await getDeepReportByArchiveAndType(archiveId, reportType)
    if (existingReport) {
      return NextResponse.json({ error: '該深度報告已生成', code: 'REPORT_ALREADY_EXISTS' }, { status: 400 })
    }

    const runningJob = await getRunningDeepReportJobForArchive(archiveId, reportType)
    if (runningJob) {
      return NextResponse.json(
        { error: '該深度報告已有任務進行中，請稍後再試', code: 'JOB_ALREADY_RUNNING' },
        { status: 409 }
      )
    }

    const lastJob = await getLastDeepReportJobForArchive(archiveId, reportType)
    // 免费重试：上次任务失败，或上次任务显示完成但报告不存在（数据不一致）
    const canRetryWithoutCharge =
      isRetry && (lastJob?.status === 'failed' || (lastJob?.status === 'completed' && !existingReport))
    if (isRetry && !canRetryWithoutCharge) {
      return NextResponse.json({ error: '無需重試或無可重試任務', code: 'NO_RETRY_NEEDED' }, { status: 400 })
    }

    if (!canRetryWithoutCharge && user.balance < DEEP_REPORT_COST) {
      return NextResponse.json(
        { message: '不足能量要充值', error: 'INSUFFICIENT_BALANCE' },
        { status: 402 }
      )
    }

    try {
      ensureLLMConfigured()
    } catch (llmErr) {
      const msg = llmErr instanceof Error ? llmErr.message : String(llmErr)
      console.error('[report/deep/generate] LLM not configured:', msg)
      return NextResponse.json({ error: msg }, { status: 503 })
    }

    // 扣费前再查一次：防止并发或前一步误判导致重复扣费、重复生成
    const existingReportAgain = await getDeepReportByArchiveAndType(archiveId, reportType)
    if (existingReportAgain) {
      return NextResponse.json({ error: '該深度報告已生成', code: 'REPORT_ALREADY_EXISTS' }, { status: 400 })
    }

    if (!canRetryWithoutCharge) {
      await updateUserBalance(userId, -DEEP_REPORT_COST)
      await createTransaction(userId, {
        type: 'consume',
        amount: DEEP_REPORT_COST,
        description: `深度報告：${reportType}`,
      })
    }

    let finalStatus: 'completed' | 'failed' = 'failed'
    const jobId = await createDeepReportJob(archiveId, reportType, 'running', '准备输入')
    try {
      await generateDeepReport(archiveId, reportType as DeepReportType)
      const reportWritten = await getDeepReportByArchiveAndType(archiveId, reportType)
      if (!reportWritten) {
        console.error('[report/deep/generate] DeepReport not found after generateDeepReport')
        await updateDeepReportJob(jobId, {
          status: 'failed',
          stepLabel: '報告生成失敗',
          error: '報告未正確寫入數據庫',
        })
      } else {
        await updateDeepReportJob(jobId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          stepLabel: undefined,
        })
        finalStatus = 'completed'
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[report/deep/generate] Generation failed:', msg)
      await updateDeepReportJob(jobId, {
        status: 'failed',
        stepLabel: '報告生成失敗',
        error: msg,
      })
    }
    return NextResponse.json({ jobId, status: finalStatus })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[report/deep/generate]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
