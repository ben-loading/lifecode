/**
 * 开发环境专用：查询 Supabase 中的档案与主报告。
 * 仅当 NODE_ENV=development 时可用。
 *
 * GET /api/debug/store           — 返回所有档案与主报告
 * GET /api/debug/store?name=2222333 — 只返回档案名为 2222333 的主报告内容
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: '仅开发环境可用' }, { status: 404 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })
  }

  const client = createClient(supabaseUrl, supabaseKey)
  const { searchParams } = new URL(request.url)
  const filterName = searchParams.get('name')?.trim()

  const { data: archives, error: archivesError } = await client
    .from('Archive')
    .select('id, name, userId, gender, birthDate, birthLocation, createdAt')
    .order('createdAt', { ascending: false })

  if (archivesError) {
    return NextResponse.json({ error: archivesError.message }, { status: 500 })
  }

  const reportsWithArchive: Array<{
    archiveId: string
    archiveName: string
    userId: string
    report: unknown
  }> = []

  for (const archive of archives ?? []) {
    if (filterName && archive.name !== filterName) continue
    const { data: report } = await client
      .from('MainReport')
      .select('*')
      .eq('archiveId', archive.id)
      .single()
    if (report) {
      reportsWithArchive.push({
        archiveId: archive.id,
        archiveName: archive.name,
        userId: archive.userId,
        report,
      })
    }
  }

  const filteredArchives = filterName ? (archives ?? []).filter((a) => a.name === filterName) : archives ?? []

  if (filterName && reportsWithArchive.length === 0) {
    return NextResponse.json({
      message: `未找到档案名为「${filterName}」的主报告`,
      archives: filteredArchives,
    })
  }

  return NextResponse.json({
    archives: filteredArchives,
    reportsByArchive: reportsWithArchive,
  })
}
