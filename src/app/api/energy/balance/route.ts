import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getUserById } from '@/lib/db'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 })
    return NextResponse.json({ balance: user.balance })
  } catch (e) {
    console.error('[energy/balance]', e)
    return serverError()
  }
}
