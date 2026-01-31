import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getReportJobById, getArchiveById } from '@/lib/db'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(_request)
    if (!userId) return unauthorized()
    const { jobId } = await params
    const job = await getReportJobById(jobId)
    if (!job) return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    const archive = await getArchiveById(job.archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }
    return NextResponse.json(job)
  } catch (e) {
    console.error('[report status]', e)
    return serverError()
  }
}
