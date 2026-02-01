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
import { ensureLLMConfigured } from '@/lib/services/llm-service'
import { generateMainReport } from '@/lib/services/report-service'

/** 主报告 LLM 约 100s；Vercel 开启 Fluid Compute（默认）或 Pro 可设 300s，同请求内完成，无需 Worker */
export const maxDuration = 300

const STEPS = [
  '编码解析',
  '采用紫微斗数进行命理排盘',
  '先天命盘解析',
  '全域能量解析',
  '大限走势解析',
  '输出解码结果',
]

const STEP_DELAY_MS = 1500
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

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

/** 同请求内完成步骤 + LLM 生成（需 maxDuration 足够，如 300s） */
async function runReportJobInRequest(jobId: string, archiveId: string): Promise<void> {
  const totalSteps = STEPS.length
  for (let step = 1; step <= totalSteps; step++) {
    const j = await getReportJobById(jobId)
    if (!j || (j.status !== 'running' && j.status !== 'processing')) return
    if (step < totalSteps) {
      await updateReportJob(jobId, { currentStep: step, totalSteps, stepLabel: STEPS[step - 1] })
      await delay(STEP_DELAY_MS)
      continue
    }
    try {
      await generateMainReport(archiveId)
      await updateReportJob(jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        stepLabel: undefined,
      })
      const archive = await getArchiveById(archiveId)
      if (archive) await processInvitesOnMainReportComplete(archive.userId)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[report/generate] Generation failed:', msg)
      await updateReportJob(jobId, {
        status: 'failed',
        stepLabel: '报告生成失败',
        error: msg,
      })
    }
  }
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
    await runReportJobInRequest(jobId, archiveId)
    return NextResponse.json({ jobId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[report/generate]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
