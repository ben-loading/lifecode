import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getUserIdByInviteRef, getInviteByInviterInvitee, createInvite } from '@/lib/db'
import { parseJsonBody, unauthorized, serverError } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()

    const body = await parseJsonBody<{ inviteRef?: string }>(request)
    const inviteRef = body && typeof body.inviteRef === 'string' ? body.inviteRef.trim() : ''
    if (!inviteRef) return NextResponse.json({ ok: true })

    const inviterId = await getUserIdByInviteRef(inviteRef)
    if (!inviterId || inviterId === userId) return NextResponse.json({ ok: true })

    const existing = await getInviteByInviterInvitee(inviterId, userId)
    if (existing) return NextResponse.json({ ok: true })

    await createInvite(inviterId, userId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[invite/record]', e)
    return serverError()
  }
}
