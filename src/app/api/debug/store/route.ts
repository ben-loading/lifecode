/**
 * 开发环境专用：调出内存中的档案与主报告，便于按档案名（如 2222333）查找并检查内容。
 * 仅当 NODE_ENV=development 时可用。
 *
 * GET /api/debug/store           — 返回所有档案与主报告
 * GET /api/debug/store?name=2222333 — 只返回档案名为 2222333 的主报告内容
 */

import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: '仅开发环境可用' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const filterName = searchParams.get('name')?.trim()

  const archives = Array.from(store.archives.entries()).map(([id, a]) => ({
    id,
    name: a.name,
    userId: a.userId,
    gender: a.gender,
    birthDate: a.birthDate,
    birthLocation: a.birthLocation,
    createdAt: a.createdAt,
  }))

  const archiveToReport = Object.fromEntries(store.archiveToReport)

  const reportsWithArchive: Array<{
    archiveId: string
    archiveName: string
    userId: string
    report: unknown
  }> = []

  for (const [archiveId, reportId] of store.archiveToReport) {
    const archive = store.archives.get(archiveId)
    const report = store.mainReports.get(reportId)
    if (archive && report) {
      if (filterName && archive.name !== filterName) continue
      reportsWithArchive.push({
        archiveId,
        archiveName: archive.name,
        userId: archive.userId,
        report,
      })
    }
  }

  if (filterName && reportsWithArchive.length === 0) {
    return NextResponse.json({
      message: `未找到档案名为「${filterName}」的主报告（可能尚未生成或服务已重启清空内存）`,
      archives: archives.filter((a) => a.name === filterName),
    })
  }

  return NextResponse.json({
    archives: filterName ? archives.filter((a) => a.name === filterName) : archives,
    archiveToReport,
    reportsByArchive: reportsWithArchive,
  })
}
