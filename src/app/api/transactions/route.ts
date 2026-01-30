import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { store } from '@/lib/store'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const list = store.userTransactions.get(userId) ?? []
    return NextResponse.json({ transactions: list })
  } catch (e) {
    console.error('[transactions]', e)
    return serverError()
  }
}
