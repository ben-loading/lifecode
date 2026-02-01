import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserById, createUser, createTransaction } from '@/lib/db'
import { serverError } from '@/lib/api-utils'

const NEW_USER_BALANCE = 20

function genInviteRef(): string {
  return Math.random().toString(36).slice(2, 10)
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ user: null })
    }

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
      appUser = { ...appUser, isNewUser: true }
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
