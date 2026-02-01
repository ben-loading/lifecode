import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import {
  getArchiveById,
  getUserById,
  updateUserBalance,
  createTransaction,
  createReportJob,
  updateReportJob,
  getReportJobById,
  getInvitesByInvitee,
  setInviteValid,
  getValidInviteCount,
} from '@/lib/db'
import { parseJsonBody, badRequest, unauthorized } from '@/lib/api-utils'
import { MAIN_REPORT_COST } from '@/lib/costs'
import { INVITE_REWARD, INVITE_MAX_COUNT } from '@/lib/invite'
import { generateMainReport } from '@/lib/services/report-service'
import { ensureLLMConfigured } from '@/lib/services/llm-service'

async function processInvitesOnMainReportComplete(inviteeUserId: string) {
  const pending = await getInvitesByInvitee(inviteeUserId)
  for (const inv of pending) {
    await setInviteValid(inv.id)
    const validCount = await getValidInviteCount(inv.inviterId)
    if (validCount <= INVITE_MAX_COUNT) {
      await updateUserBalance(inv.inviterId, INVITE_REWARD)
    }
  }
}

const STEPS = [
  '编码解析',
  '采用紫微斗数进行命理排盘',
  '先天命盘解析',
  '全域能量解析',
  '大限走势解析',
  '输出解码结果',
]

/** 诊断：Vercel Logs 里搜 [report-dbg] 可判断后台是否被终止 */
const DBG = (msg: string, data?: Record<string, unknown>) => {
  console.log('[report-dbg]', msg, data ?? '')
}

async function runReportJob(jobId: string, archiveId: string) {
  DBG('后台任务已启动', { jobId, archiveId })
  let step = 0
  const totalSteps = STEPS.length

  const tick = async () => {
    step += 1
    DBG(`tick step=${step}/${totalSteps}`, { step, totalSteps })
    const j = await getReportJobById(jobId)
    if (!j || j.status !== 'running') {
      DBG('任务已停止，不再继续', { status: j?.status })
      return
    }

    if (step >= totalSteps) {
      DBG('开始调用 LLM 生成报告')
      try {
        const report = await generateMainReport(archiveId)
        DBG('报告生成成功')
        await updateReportJob(jobId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          stepLabel: undefined,
        })
        const archive = await getArchiveById(archiveId)
        if (archive) await processInvitesOnMainReportComplete(archive.userId)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('[report-dbg] Generation failed:', msg)
        await updateReportJob(jobId, {
          status: 'failed',
          stepLabel: '报告生成失败',
          error: msg,
        })
      }
      return
    }

    await updateReportJob(jobId, {
      currentStep: step,
      totalSteps,
      stepLabel: STEPS[step - 1],
    })
    setTimeout(() => tick(), 1500)
  }

  setTimeout(() => tick(), 1500)
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()

    const body = await parseJsonBody<{ archiveId?: string }>(request)
    if (body == null) return badRequest('请求体无效')
    const archiveId = typeof body.archiveId === 'string' ? body.archiveId.trim() : ''
    if (!archiveId) return badRequest('缺少 archiveId')

    const archive = await getArchiveById(archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '档案不存在' }, { status: 404 })
    }
    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    if (user.balance < MAIN_REPORT_COST) {
      return NextResponse.json({ message: '不足能量要充值', error: 'INSUFFICIENT_BALANCE' }, { status: 402 })
    }

    // 发起前校验 LLM 配置，避免扣费后后台任务失败
    try {
      ensureLLMConfigured()
    } catch (llmErr) {
      const msg = llmErr instanceof Error ? llmErr.message : String(llmErr)
      console.error('[report/generate] LLM not configured:', msg)
      return NextResponse.json({ error: msg }, { status: 503 })
    }

    await updateUserBalance(userId, -MAIN_REPORT_COST)
    await createTransaction(userId, {
      type: 'consume',
      amount: MAIN_REPORT_COST,
      description: '主报告生成',
    })

    const jobId = await createReportJob(archiveId, 'running', STEPS[0])
    runReportJob(jobId, archiveId)

    return NextResponse.json({ jobId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[report/generate]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
