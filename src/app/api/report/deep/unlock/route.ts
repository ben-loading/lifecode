import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getUserById, getArchiveById, updateUserBalance, createTransaction } from '@/lib/db'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'
import { DEEP_REPORT_COST, DEEP_REPORT_TYPES } from '@/lib/costs'
import type { DeepReportType } from '@/lib/costs'

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 })

    const body = await parseJsonBody<{ archiveId?: string; reportType?: string }>(request)
    if (body == null) return badRequest('請求體無效')
    const archiveId = typeof body.archiveId === 'string' ? body.archiveId.trim() : ''
    const reportType = typeof body.reportType === 'string' ? body.reportType.trim() : ''
    if (!archiveId || !reportType) return badRequest('缺少 archiveId 或 reportType')
    if (!DEEP_REPORT_TYPES.includes(reportType as DeepReportType)) return badRequest('無效的 reportType')

    const archive = await getArchiveById(archiveId)
    if (!archive || archive.userId !== userId) {
      return NextResponse.json({ error: '檔案不存在' }, { status: 404 })
    }
    if (user.balance < DEEP_REPORT_COST) {
      return NextResponse.json(
        { message: '不足能量要充值', error: 'INSUFFICIENT_BALANCE' },
        { status: 402 }
      )
    }

    await updateUserBalance(userId, -DEEP_REPORT_COST)
    await createTransaction(userId, {
      type: 'consume',
      amount: DEEP_REPORT_COST,
      description: `深度報告：${reportType}`,
    })

    const updated = await getUserById(userId)
    return NextResponse.json({ balance: updated!.balance })
  } catch (e) {
    console.error('[report/deep/unlock]', e)
    return serverError()
  }
}
