import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const { jobId } = await params
    if (!jobId) return NextResponse.json({ error: '缺少 jobId' }, { status: 400 })
    const job = store.reportJobs.get(jobId)
    if (!job) return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    const archive = store.archives.get(job.archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '无权查看' }, { status: 403 })
    }
    return NextResponse.json({
      jobId: job.jobId,
      archiveId: job.archiveId,
      status: job.status,
      currentStep: job.currentStep,
      totalSteps: job.totalSteps,
      stepLabel: job.stepLabel,
      completedAt: job.completedAt,
      error: job.error,
    })
  } catch (e) {
    console.error('[report/status]', e)
    return serverError()
  }
}
