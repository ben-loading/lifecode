import { NextResponse } from 'next/server'
import { getAdminUserIdFromRequest } from '@/lib/auth-server'
import { deleteRedemptionCode } from '@/lib/db'
import { unauthorized, serverError, badRequest } from '@/lib/api-utils'

/**
 * DELETE /api/admin/redemption-codes/[code]
 * 刪除未使用的兌換碼
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const userId = await getAdminUserIdFromRequest(request).catch(() => null)
    if (!userId) return unauthorized()

    const { code } = await params
    if (!code) return badRequest('兌換碼不能為空')

    await deleteRedemptionCode(code)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin/redemption-codes DELETE]', e)
    if (e instanceof Error) {
      if (e.message.includes('管理员')) {
        return NextResponse.json({ error: e.message }, { status: 403 })
      }
      if (e.message.includes('不存在') || e.message.includes('已使用')) {
        return badRequest(e.message)
      }
    }
    return serverError()
  }
}
