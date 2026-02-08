import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getArchiveById, getMainReportByArchiveId } from '@/lib/db'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const { archiveId } = await params
    const archive = await getArchiveById(archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '檔案不存在' }, { status: 404 })
    }
    const report = await getMainReportByArchiveId(archiveId)
    if (!report) {
      return NextResponse.json({ error: '報告未生成' }, { status: 404 })
    }
    return NextResponse.json(report)
  } catch (e) {
    console.error('[report archiveId]', e)
    return serverError()
  }
}
