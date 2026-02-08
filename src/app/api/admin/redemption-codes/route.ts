import { NextResponse } from 'next/server'
import { getAdminUserIdFromRequest } from '@/lib/auth-server'
import { createRedemptionCode, listRedemptionCodes } from '@/lib/db'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'

/**
 * POST /api/admin/redemption-codes
 * 創建兌換碼
 */
export async function POST(request: Request) {
  try {
    const userId = await getAdminUserIdFromRequest(request).catch(() => null)
    if (!userId) return unauthorized()

    const body = await parseJsonBody<{ amount?: number; note?: string }>(request)
    const amount = body?.amount
    const note = body?.note

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return badRequest('能量值必須為正整數')
    }

    const result = await createRedemptionCode({
      amount: Math.floor(amount),
      // createdBy: userId, // 暂未使用，数据库表中无此字段
      note: note?.trim() || undefined,
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error('[admin/redemption-codes POST]', e)
    if (e instanceof Error && e.message.includes('管理员')) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return serverError()
  }
}

/**
 * GET /api/admin/redemption-codes
 * 查詢兌換碼列表
 */
export async function GET(request: Request) {
  try {
    const userId = await getAdminUserIdFromRequest(request).catch(() => null)
    if (!userId) return unauthorized()

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const includeUsed = url.searchParams.get('includeUsed') !== 'false'

    const result = await listRedemptionCodes({
      limit: Math.min(Math.max(limit, 1), 100), // 限制在 1-100 之间
      offset: Math.max(offset, 0),
      includeUsed,
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error('[admin/redemption-codes GET]', e)
    if (e instanceof Error && e.message.includes('管理员')) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return serverError()
  }
}
