import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { parseJsonBody, badRequest, serverError } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<{ email?: string }>(request)
    if (body == null) return badRequest('请求体无效')
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email) return badRequest('缺少 email')
    const code = String(Math.floor(100000 + Math.random() * 900000))
    store.codes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    })
    if (process.env.NODE_ENV === 'development') {
      console.log('[mock] send-code', email, code)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[auth/send-code]', e)
    return serverError()
  }
}
