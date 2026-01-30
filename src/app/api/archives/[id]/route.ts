import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const { id } = await params
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
    const archive = store.archives.get(id)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '档案不存在' }, { status: 404 })
    }
    return NextResponse.json(archive)
  } catch (e) {
    console.error('[archives/id]', e)
    return serverError()
  }
}
