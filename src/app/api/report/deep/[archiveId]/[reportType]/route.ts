import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getDeepReportByArchiveAndType, getArchiveById } from '@/lib/db'
import { unauthorized } from '@/lib/api-utils'
import { DEEP_REPORT_TYPES } from '@/lib/costs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ archiveId: string; reportType: string }> }
) {
  const userId = await getUserIdFromRequest(_request)
  if (!userId) return unauthorized()

  const { archiveId, reportType } = await params
  if (!archiveId || !reportType)     return NextResponse.json({ error: '缺少 archiveId 或 reportType' }, { status: 400 })
  if (!(DEEP_REPORT_TYPES as readonly string[]).includes(reportType))
    return NextResponse.json({ error: '無效的 reportType' }, { status: 400 })

  const archive = await getArchiveById(archiveId)
  if (!archive || archive.userId !== userId) {
    return NextResponse.json({ error: '檔案不存在' }, { status: 404 })
  }

  const report = await getDeepReportByArchiveAndType(archiveId, reportType)
  if (!report) return NextResponse.json({ error: '報告不存在' }, { status: 404 })

  return NextResponse.json({
    archiveId: report.archiveId,
    reportType: report.reportType,
    content: report.content,
    createdAt: report.createdAt,
  })
}