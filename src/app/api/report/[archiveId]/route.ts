import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { unauthorized, serverError } from '@/lib/api-utils'
import { getMainReportByArchiveId } from '@/lib/services/report-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const { archiveId } = await params
    if (!archiveId) return NextResponse.json({ error: '缺少 archiveId' }, { status: 400 })
    const archive = store.archives.get(archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '档案不存在' }, { status: 404 })
    }
    const report = getMainReportByArchiveId(archiveId)
    return NextResponse.json(report ?? null)
  } catch (e) {
    console.error('[report/archiveId]', e)
    return serverError()
  }
}
