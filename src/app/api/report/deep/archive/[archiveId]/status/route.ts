import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getArchiveById, getDeepReportByArchiveAndType, getRunningDeepReportJobForArchive, getLastDeepReportJobForArchive } from '@/lib/db'
import { unauthorized } from '@/lib/api-utils'
import { DEEP_REPORT_TYPES } from '@/lib/costs'
import type { DeepReportType } from '@/lib/costs'

export type DeepReportItemStatus = 'none' | 'generating' | 'completed' | 'failed'

/** 按档案返回 4 类深度报告状态：未生成、生成中、已生成、失败（已扣款无报告） */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  const userId = await getUserIdFromRequest(_request)
  if (!userId) return unauthorized()

  const { archiveId } = await params
  if (!archiveId) return NextResponse.json({ error: '缺少 archiveId' }, { status: 400 })

  const archive = await getArchiveById(archiveId)
  if (!archive || archive.userId !== userId) {
    return NextResponse.json({ error: '档案不存在' }, { status: 404 })
  }

  const result: Record<string, { status: DeepReportItemStatus; jobId?: string }> = {}

  for (const reportType of DEEP_REPORT_TYPES as readonly string[]) {
    let report = await getDeepReportByArchiveAndType(archiveId, reportType)
    if (report) {
      result[reportType] = { status: 'completed' }
      continue
    }
    const runningJob = await getRunningDeepReportJobForArchive(archiveId, reportType)
    if (runningJob) {
      result[reportType] = { status: 'generating', jobId: runningJob.jobId }
      continue
    }
    const lastJob = await getLastDeepReportJobForArchive(archiveId, reportType)
    if (lastJob?.status === 'failed') {
      result[reportType] = { status: 'failed', jobId: lastJob.jobId }
      continue
    }
    // job 显示完成但 DeepReport 查不到：可能是瞬时读失败（单行无误时也会偶现「查看报告」变「重新生成」）。重试一次再判失败。
    if (lastJob?.status === 'completed') {
      report = await getDeepReportByArchiveAndType(archiveId, reportType)
      if (report) {
        result[reportType] = { status: 'completed' }
        continue
      }
      result[reportType] = { status: 'failed', jobId: lastJob.jobId }
      continue
    }
    result[reportType] = { status: 'none' }
  }

  return NextResponse.json(result)
}
