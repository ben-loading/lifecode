import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getUserById } from '@/lib/db'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const user = await getUserById(userId)
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
    console.error('[users/me]', e)
    return serverError()
  }
}
