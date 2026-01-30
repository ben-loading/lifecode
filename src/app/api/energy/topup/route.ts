import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const user = store.users.get(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const body = await parseJsonBody<{ amount?: number }>(request)
    if (body == null) return badRequest('请求体无效')
    const amount = typeof body.amount === 'number' ? Math.max(0, Math.floor(body.amount)) : 0
    if (amount <= 0) return badRequest('充值金额无效')

    user.balance += amount
    const list = store.userTransactions.get(userId) ?? []
    list.unshift({
      id: `tx_${userId}_${Date.now()}`,
      type: 'topup',
      amount,
      createdAt: new Date().toISOString(),
      description: '充值能量',
    })
    store.userTransactions.set(userId, list)

    return NextResponse.json({ balance: user.balance })
  } catch (e) {
    console.error('[topup]', e)
    return serverError()
  }
}
