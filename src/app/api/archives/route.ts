import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { getArchivesByUserId, createArchive as dbCreateArchive } from '@/lib/db'
import { parseJsonBody, badRequest, unauthorized, serverError } from '@/lib/api-utils'
import type { ApiArchive, CreateArchiveBody } from '@/lib/types/api'

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()
    const list = await getArchivesByUserId(userId)
    return NextResponse.json(list)
  } catch (e) {
    console.error('[archives GET]', e)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()

    const body = await parseJsonBody<CreateArchiveBody>(request)
    if (body == null) return badRequest('请求体无效')
    const { name, gender, birthDate, birthLocation, birthCalendar, birthTimeMode, birthTimeBranch, lunarDate, isLeapMonth } = body
    if (!name?.trim() || !gender || !birthDate) {
      return badRequest('缺少 name / gender / birthDate')
    }
    const useShichen = birthTimeMode === 'shichen'
    if (!useShichen && !(birthLocation ?? '').trim()) {
      return badRequest('选择具体时间时需提供出生地区 birthLocation')
    }
    if (birthCalendar === 'lunar' && !lunarDate?.trim()) {
      return badRequest('农历需提供 lunarDate')
    }
    const archive = await dbCreateArchive(userId, {
      name: name.trim(),
      gender,
      birthDate,
      birthLocation: (birthLocation ?? '').trim(),
      ...(birthCalendar && { birthCalendar }),
      ...(birthTimeMode && { birthTimeMode }),
      ...(birthTimeBranch != null && { birthTimeBranch }),
      ...(lunarDate && { lunarDate }),
      ...(isLeapMonth != null && { isLeapMonth }),
    })
    return NextResponse.json(archive)
  } catch (e) {
    console.error('[archives POST]', e)
    return serverError('创建失败')
  }
}
