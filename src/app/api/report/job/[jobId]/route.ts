import { NextResponse } from 'next/server'
import {
  getReportJobById,
  updateReportJob,
  getArchiveById,
  getInvitesByInvitee,
  setInviteValid,
  getValidInviteCount,
  updateUserBalance,
} from '@/lib/db'
import { parseJsonBody } from '@/lib/api-utils'
import { INVITE_REWARD, INVITE_MAX_COUNT } from '@/lib/invite'

const WORKER_SECRET = process.env.REPORT_WORKER_SECRET

function requireWorkerAuth(request: Request): boolean {
  if (!WORKER_SECRET?.length) return false
  const auth = request.headers.get('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : request.headers.get('X-Worker-Secret')
  return token === WORKER_SECRET
}

/** Worker 更新任务状态：仅允许 processing -> completed | failed */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  if (!requireWorkerAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { jobId } = await params
    const job = await getReportJobById(jobId)
    if (!job) return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    if (job.status !== 'processing') {
      return NextResponse.json({ error: '仅可更新 processing 状态的任务' }, { status: 400 })
    }
    const body = await parseJsonBody<{ status: 'completed' | 'failed'; error?: string }>(request)
    if (!body?.status || !['completed', 'failed'].includes(body.status)) {
      return NextResponse.json({ error: 'body.status 须为 completed 或 failed' }, { status: 400 })
    }
    const updates: Parameters<typeof updateReportJob>[1] = {
      status: body.status,
      stepLabel: body.status === 'failed' ? '报告生成失败' : undefined,
      error: body.error ?? undefined,
    }
    if (body.status === 'completed') {
      updates.completedAt = new Date().toISOString()
    }
    await updateReportJob(jobId, updates)
    if (body.status === 'completed') {
      const archive = await getArchiveById(job.archiveId)
      if (archive) {
        const pending = await getInvitesByInvitee(archive.userId)
        for (const inv of pending) {
          await setInviteValid(inv.id)
          const validCount = await getValidInviteCount(inv.inviterId)
          if (validCount <= INVITE_MAX_COUNT) {
            await updateUserBalance(inv.inviterId, INVITE_REWARD)
          }
        }
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[report/job]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
