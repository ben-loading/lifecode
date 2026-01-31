import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getTransactionsByUserId } from '@/lib/db'
import { unauthorized, serverError } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const list = await getTransactionsByUserId(userId)
    return NextResponse.json({ list })
  } catch (e) {
    console.error('[transactions]', e)
    return serverError()
  }
}
