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

    const body = await parseJsonBody<{ code?: string }>(request)
    const code = body && typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (!code) return badRequest('请输入兑换码')

    const record = store.redemptionCodes.get(code)
    if (!record) return badRequest('兑换码无效')
    if (record.usedBy) return badRequest('该兑换码已被使用')

    record.usedBy = userId
    record.usedAt = new Date().toISOString()
    user.balance += record.amount
    return NextResponse.json({ balance: user.balance, amount: record.amount })
  } catch (e) {
    console.error('[energy/redeem]', e)
    return serverError()
  }
}
