import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { parseJsonBody, badRequest, serverError } from '@/lib/api-utils'

const NEW_USER_BALANCE = 20

function genInviteRef(): string {
  return Math.random().toString(36).slice(2, 10)
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<{ email?: string; code?: string }>(request)
    if (body == null) return badRequest('请求体无效')
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    if (!email || !code) return badRequest('缺少 email 或 code')

    const key = email.toLowerCase()
    const record = store.codes.get(key)
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 401 })
    }
    store.codes.delete(key)

    let user = Array.from(store.users.values()).find((u) => u.email.toLowerCase() === key)
    if (!user) {
      const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      const inviteRef = genInviteRef()
      user = {
        id,
        email: key,
        name: email.split('@')[0],
        balance: NEW_USER_BALANCE,
        isNewUser: true,
        inviteRef,
      }
      store.users.set(id, user)
      store.refToUserId.set(inviteRef, user.id)
      store.userTransactions.set(id, [
        {
          id: `tx_${id}_0`,
          type: 'topup',
          amount: NEW_USER_BALANCE,
          createdAt: new Date().toISOString(),
          description: '初始体验能量',
        },
      ])
    } else if (!user.inviteRef) {
      const inviteRef = genInviteRef()
      user.inviteRef = inviteRef
      store.refToUserId.set(inviteRef, user.id)
    }

    const token = `tk_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`
    store.tokens.set(token, user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        isNewUser: user.isNewUser,
        inviteRef: user.inviteRef,
      },
      token,
    })
  } catch (e) {
    console.error('[auth/login]', e)
    return serverError('登录失败')
  }
}
