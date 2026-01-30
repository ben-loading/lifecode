import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { parseJsonBody, unauthorized, serverError } from '@/lib/api-utils'
import type { InviteRecord } from '@/lib/store'

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return unauthorized()

    const body = await parseJsonBody<{ inviteRef?: string }>(request)
    const inviteRef = body && typeof body.inviteRef === 'string' ? body.inviteRef.trim() : ''
    if (!inviteRef) return NextResponse.json({ ok: true })

    const inviterId = store.refToUserId.get(inviteRef)
    if (!inviterId || inviterId === userId) return NextResponse.json({ ok: true })

    const existing = Array.from(store.invites.values()).find(
      (i) => i.inviteeId === userId && i.inviterId === inviterId
    )
    if (existing) return NextResponse.json({ ok: true })

    const id = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const record: InviteRecord = {
      id,
      inviterId,
      inviteeId: userId,
      isValid: false,
      createdAt: new Date().toISOString(),
    }
    store.invites.set(id, record)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[invite/record]', e)
    return serverError()
  }
}
