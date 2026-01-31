import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getUserById, updateUserBalance, createTransaction } from '@/lib/db'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const body = await parseJsonBody<{ amount?: number }>(request)
    if (body == null) return badRequest('请求体无效')
    const amount = typeof body.amount === 'number' ? Math.max(0, Math.floor(body.amount)) : 0
    if (amount <= 0) return badRequest('充值金额无效')

    await updateUserBalance(userId, amount)
    await createTransaction(userId, {
      type: 'topup',
      amount,
      description: '充值能量',
    })

    const updated = await getUserById(userId)
    return NextResponse.json({ balance: updated!.balance })
  } catch (e) {
    console.error('[topup]', e)
    return serverError()
  }
}
