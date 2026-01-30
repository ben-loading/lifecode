import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'
import { DEEP_REPORT_COST, DEEP_REPORT_TYPES } from '@/lib/costs'
import type { DeepReportType } from '@/lib/costs'

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const user = store.users.get(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const body = await parseJsonBody<{ archiveId?: string; reportType?: string }>(request)
    if (body == null) return badRequest('请求体无效')
    const archiveId = typeof body.archiveId === 'string' ? body.archiveId.trim() : ''
    const reportType = typeof body.reportType === 'string' ? body.reportType.trim() : ''
    if (!archiveId || !reportType) return badRequest('缺少 archiveId 或 reportType')
    if (!DEEP_REPORT_TYPES.includes(reportType as DeepReportType)) return badRequest('无效的 reportType')

    const archive = store.archives.get(archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '档案不存在' }, { status: 404 })
    }
    if (user.balance < DEEP_REPORT_COST) {
      return NextResponse.json(
        { message: '不足能量要充值', error: 'INSUFFICIENT_BALANCE' },
        { status: 402 }
      )
    }

    user.balance -= DEEP_REPORT_COST
    const txList = store.userTransactions.get(userId) ?? []
    txList.unshift({
      id: `tx_${userId}_${Date.now()}`,
      type: 'consume',
      amount: DEEP_REPORT_COST,
      createdAt: new Date().toISOString(),
      description: `深度报告：${reportType}`,
    })
    store.userTransactions.set(userId, txList)
    return NextResponse.json({ balance: user.balance })
  } catch (e) {
    console.error('[report/deep/unlock]', e)
    return serverError()
  }
}
