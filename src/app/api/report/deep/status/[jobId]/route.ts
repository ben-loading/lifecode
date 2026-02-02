import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getDeepReportJobById, getArchiveById } from '@/lib/db'
import { unauthorized } from '@/lib/api-utils'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = await getUserIdFromRequest(_request)
  if (!userId) return unauthorized()

  const { jobId } = await params
  if (!jobId) return NextResponse.json({ error: '缺少 jobId' }, { status: 400 })

  const job = await getDeepReportJobById(jobId)
  if (!job) return NextResponse.json({ error: '任务不存在' }, { status: 404 })

  const archive = await getArchiveById(job.archiveId)
  if (!archive || archive.userId !== userId) {
    return NextResponse.json({ error: '无权查看' }, { status: 403 })
  }

  return NextResponse.json({
    jobId: job.jobId,
    archiveId: job.archiveId,
    reportType: job.reportType,
    status: job.status,
    currentStep: job.currentStep,
    totalSteps: job.totalSteps,
    stepLabel: job.stepLabel,
    completedAt: job.completedAt,
    error: job.error,
  })
}
