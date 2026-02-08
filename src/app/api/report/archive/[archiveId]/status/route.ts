import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getArchiveById, getMainReportByArchiveId, getRunningReportJobForArchive } from '@/lib/db'
import { unauthorized, serverError } from '@/lib/api-utils'
import type { ApiMainReport, ApiReportJob } from '@/lib/types/api'

/**
 * 按档案查询：是否有主报告、是否有进行中任务
 * 用于进入报告页时先查：有结果直接展示，有任务则走分析动画并轮询
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(_request)
    if (!userId) return unauthorized()
    const { archiveId } = await params
    const archive = await getArchiveById(archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '檔案不存在' }, { status: 404 })
    }
    const [report, runningJob] = await Promise.all([
      getMainReportByArchiveId(archiveId),
      getRunningReportJobForArchive(archiveId),
    ])
    const body: { report: ApiMainReport | null; runningJob: ApiReportJob | null } = {
      report: report ?? null,
      runningJob: runningJob ?? null,
    }
    return NextResponse.json(body)
  } catch (e) {
    console.error('[report/archive/status]', e)
    return serverError()
  }
}
