import { NextResponse } from 'next/server'
import { createClient, type User } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getUserById, createUser, createTransaction } from '@/lib/db'

const NEW_USER_BALANCE = 20

function genInviteRef(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** 从请求头取 Bearer token */
function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7).trim() || null
}

function sessionError(message: string, status = 500) {
  return NextResponse.json({ error: message, user: null }, { status })
}

export async function GET(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !anonKey) {
      console.error('[auth/session] Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY')
      return sessionError('服务端未配置 Supabase URL 或 Anon Key，请在 Vercel 环境变量中配置')
    }
    if (!serviceKey) {
      console.error('[auth/session] Missing SUPABASE_SERVICE_ROLE_KEY')
      return sessionError(
        '服务端未配置 SUPABASE_SERVICE_ROLE_KEY，请在 Vercel → Settings → Environment Variables 中添加并重新部署'
      )
    }

    let authUser: User | null = null

    const bearerToken = getBearerToken(request)
    if (bearerToken) {
      const supabase = createClient(url, anonKey)
      const { data: { user } } = await supabase.auth.getUser(bearerToken)
      authUser = user
    }

    if (!authUser) {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      authUser = user
    }

    if (!authUser) {
      return NextResponse.json({ user: null })
    }

    let appUser = await getUserById(authUser.id)
    if (!appUser) {
      try {
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
          description: '初始體驗能量',
        })
        appUser = { ...appUser, isNewUser: true }
      } catch (createErr) {
        // 可能触发器已创建用户（唯一约束冲突等），再查一次
        appUser = await getUserById(authUser.id)
        if (!appUser) throw createErr
      }
    }

    return NextResponse.json({
      user: {
        id: appUser.id,
        email: appUser.email,
        name: appUser.name,
        balance: appUser.balance,
        inviteRef: appUser.inviteRef,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[auth/session]', e)
    // 数据库错误，返回更详细的错误信息
    if (e instanceof Error && (msg.includes('relation') || msg.includes('不存在') || msg.includes('does not exist'))) {
      console.error('[auth/session] 数据库表不存在错误:', msg)
      return sessionError(
        `数据库结构错误: ${msg}。请检查 Session 和 VerificationCode 表是否存在。`,
        500
      )
    }
    return sessionError(msg)
  }
}
