/**
 * Supabase Auth 服务端：从请求中获取当前用户
 * 支持 Authorization Bearer token 或 Cookie session
 */

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getUserById, createUser, createTransaction } from '@/lib/db'

const NEW_USER_BALANCE = 20

function genInviteRef(): string {
  return Math.random().toString(36).slice(2, 10)
}

async function getAuthUserFromRequest(request: Request): Promise<{ id: string; email: string; user_metadata?: { name?: string } } | null> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  let user: { id: string; email?: string; user_metadata?: { name?: string } } | null = null

  if (token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.auth.getUser(token)
    user = data.user
  } else {
    const supabase = await createServerClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  return user?.email ? { id: user.id, email: user.email, user_metadata: user.user_metadata } : null
}

/**
 * 从 Supabase Auth 获取当前用户 ID（支持 Bearer token 或 Cookie）
 * 若 User 记录不存在则自动创建
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const authUser = await getAuthUserFromRequest(request)
  if (!authUser) return null

  let appUser = await getUserById(authUser.id)
  if (!appUser) {
    appUser = await createUser({
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name ?? authUser.email!.split('@')[0],
      balance: NEW_USER_BALANCE,
      inviteRef: genInviteRef(),
    })
    await createTransaction(appUser.id, {
      type: 'topup',
      amount: NEW_USER_BALANCE,
      description: '初始体验能量',
    })
  }

  return appUser.id
}
