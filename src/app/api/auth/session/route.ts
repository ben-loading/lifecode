import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('Authorization')
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return unauthorized()
    const userId = store.tokens.get(token)
    if (!userId) return unauthorized('登录已过期')
    const user = store.users.get(userId)
    if (!user) return unauthorized('用户不存在')
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        isNewUser: user.isNewUser,
        inviteRef: user.inviteRef,
      },
    })
  } catch (e) {
    console.error('[auth/session]', e)
    return serverError()
  }
}
