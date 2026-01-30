import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'
import { MAIN_REPORT_COST } from '@/lib/costs'
import { INVITE_REWARD, INVITE_MAX_COUNT } from '@/lib/invite'
import type { ApiReportJob, ApiMainReport } from '@/lib/types/api'

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

function runReportJob(jobId: string, archiveId: string) {
  const job = store.reportJobs.get(jobId)
  if (!job || job.status !== 'running') return
  let step = 0
  const totalSteps = STEPS.length
  const tick = () => {
    step += 1
    const j = store.reportJobs.get(jobId)
    if (!j || j.status !== 'running') return
    j.currentStep = step
    j.totalSteps = totalSteps
    j.stepLabel = STEPS[step - 1]
    if (step >= totalSteps) {
      j.status = 'completed'
      j.completedAt = new Date().toISOString()
      j.stepLabel = undefined
      const archive = store.archives.get(archiveId)
      if (archive) {
        const report: ApiMainReport = {
          archiveId,
          lifeScriptTitle: '怒海争锋·破蛋成蝶',
          lifeScriptDescription:
            '早年性格叛逆，多才多艺但学而不精（文曲忌）。中年（32-41岁）经历重大的人生转折与压力洗礼，在动荡中确立地位。晚年掌握实权，财富丰厚。',
          coreAbility:
            '越是危机时刻，越是规则崩坏的地方，你的直觉和执行力越强。你是天生的"战时CEO"或"救火队长"。',
          baziDisplay: '己已 辛未 乙未 癸未',
          radarData: [
            { name: '自我', value: 95, fullMark: 100 },
            { name: '财富', value: 82, fullMark: 100 },
            { name: '事业', value: 85, fullMark: 100 },
            { name: '情感', value: 45, fullMark: 100 },
            { name: '人脉', value: 68, fullMark: 100 },
            { name: '家庭', value: 65, fullMark: 100 },
            { name: '健康', value: 60, fullMark: 100 },
          ],
          dimensionDetails: [
            { title: '自我', level: 'S级', description: '八字身极强，比劫重重。自信心爆棚，主观意识过强，甚至有点自恋和独断专行。' },
            { title: '财富', level: 'A级', description: '命带财库但被冲，紫微七杀掌财。具备爆发式致富的能量，但缺乏守财的能量。' },
            { title: '事业', level: 'A级', description: '官禄宫武曲贪狼，配合八字杀印相生。越到中年（35岁后）能量越强，是典型的晚发型选手。' },
            { title: '情感', level: 'C级', description: '夫妻宫状态极差，不仅空宫还带"劫"。感情是你最大的软肋，也是最耗损你能量的地方。' },
            { title: '人脉', level: 'B级', description: '迁移宫天机天梁，善于交际但容易与权威产生摩擦。' },
            { title: '家庭', level: 'B级', description: '父母宫有吉星，家庭关系尚可，但自身主观强，需注意沟通。' },
            { title: '健康', level: 'B级', description: '疾厄宫需注意肝胆与神经系统，避免过度劳累。' },
          ],
        }
        store.mainReports.set(archiveId, report)
        processInvitesOnMainReportComplete(archive.userId)
      }
      return
    }
    setTimeout(tick, 1500)
  }
  setTimeout(tick, 1500)
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
