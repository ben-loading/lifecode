import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getUserById, createUser, createTransaction } from '@/lib/db'
import { serverError } from '@/lib/api-utils'

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

export async function GET(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      console.error('[auth/session] Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY')
      return serverError()
    }

    let authUser: { id: string; email: string | null; user_metadata?: { name?: string } } | null = null

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
          description: '初始体验能量',
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
    console.error('[auth/session]', e)
    return serverError()
  }
}
