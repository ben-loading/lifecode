import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getUserById, getRedemptionCode, redeemCode, updateUserBalance } from '@/lib/db'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const body = await parseJsonBody<{ code?: string }>(request)
    const code = body && typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (!code) return badRequest('请输入兑换码')

    const record = await getRedemptionCode(code)
    if (!record) return badRequest('兑换码无效')
    if (record.usedBy) return badRequest('该兑换码已被使用')

    await redeemCode(code, userId)
    await updateUserBalance(userId, record.amount)

    const updated = await getUserById(userId)
    return NextResponse.json({ balance: updated!.balance, amount: record.amount })
  } catch (e) {
    console.error('[energy/redeem]', e)
    return serverError()
  }
}
