import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getArchiveById } from '@/lib/db'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(_request)
    if (!userId) return unauthorized()
    const { id } = await params
    const archive = await getArchiveById(id)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '档案不存在' }, { status: 404 })
    }
    return NextResponse.json(archive)
  } catch (e) {
    console.error('[archives/id GET]', e)
    return serverError()
  }
}
