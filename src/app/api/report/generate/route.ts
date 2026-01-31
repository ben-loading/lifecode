import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'
import { MAIN_REPORT_COST } from '@/lib/costs'
import { INVITE_REWARD, INVITE_MAX_COUNT } from '@/lib/invite'
import type { ApiReportJob } from '@/lib/types/api'
import { generateMainReport } from '@/lib/services/report-service'

function processInvitesOnMainReportComplete(inviteeUserId: string) {
  const pending = Array.from(store.invites.values()).filter(
    (i) => i.inviteeId === inviteeUserId && !i.isValid
  )
  for (const inv of pending) {
    inv.isValid = true
    const inviter = store.users.get(inv.inviterId)
    if (!inviter) continue
    const validCount = Array.from(store.invites.values()).filter(
      (i) => i.inviterId === inv.inviterId && i.isValid
    ).length
    if (validCount <= INVITE_MAX_COUNT) {
      inviter.balance += INVITE_REWARD
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

async function runReportJob(jobId: string, archiveId: string) {
  const job = store.reportJobs.get(jobId)
  if (!job || job.status !== 'running') return
  
  let step = 0
  const totalSteps = STEPS.length
  
  const tick = async () => {
    step += 1
    const j = store.reportJobs.get(jobId)
    if (!j || j.status !== 'running') return
    
    j.currentStep = step
    j.totalSteps = totalSteps
    j.stepLabel = STEPS[step - 1]
    
    // 最后一步：调用真实的 LLM 生成逻辑
    if (step >= totalSteps) {
      try {
        // 调用真实报告生成服务
        const report = await generateMainReport(archiveId)
        
        // 报告已在 report-service 中存储，这里只需标记任务完成
        j.status = 'completed'
        j.completedAt = new Date().toISOString()
        j.stepLabel = undefined
        
        // 处理邀请奖励
        const archive = store.archives.get(archiveId)
        if (archive) {
          processInvitesOnMainReportComplete(archive.userId)
        }
      } catch (error) {
        console.error('[runReportJob] Generation failed:', error)
        j.status = 'failed'
        j.stepLabel = '报告生成失败'
        j.error = error instanceof Error ? error.message : String(error)
      }
      return
    }
    
    // 非最后一步：继续模拟进度
    setTimeout(() => tick(), 1500)
  }
  
  setTimeout(() => tick(), 1500)
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()

    const body = await parseJsonBody<{ archiveId?: string }>(request)
    if (body == null) return badRequest('请求体无效')
    const archiveId = typeof body.archiveId === 'string' ? body.archiveId.trim() : ''
    if (!archiveId) return badRequest('缺少 archiveId')

    const archive = store.archives.get(archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '档案不存在' }, { status: 404 })
    }
    const user = store.users.get(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    if (user.balance < MAIN_REPORT_COST) {
      return NextResponse.json({ message: '不足能量要充值', error: 'INSUFFICIENT_BALANCE' }, { status: 402 })
    }

    user.balance -= MAIN_REPORT_COST
    const txList = store.userTransactions.get(userId) ?? []
    txList.unshift({
      id: `tx_${userId}_${Date.now()}`,
      type: 'consume',
      amount: MAIN_REPORT_COST,
      createdAt: new Date().toISOString(),
      description: '主报告生成',
    })
    store.userTransactions.set(userId, txList)
    if (user.isNewUser) user.isNewUser = false

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const job: ApiReportJob = {
      jobId,
      archiveId,
      status: 'running',
      currentStep: 0,
      totalSteps: STEPS.length,
      stepLabel: STEPS[0],
    }
    store.reportJobs.set(jobId, job)
    runReportJob(jobId, archiveId)

    return NextResponse.json({ jobId })
  } catch (e) {
    console.error('[report/generate]', e)
    return serverError('发起失败')
  }
}
