import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const user = store.users.get(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      balance: user.balance,
      isNewUser: user.isNewUser,
      inviteRef: user.inviteRef,
    })
  } catch (e) {
    console.error('[users/me]', e)
    return serverError()
  }
}
