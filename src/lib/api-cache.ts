/**
 * 前端本地缓存：档案列表、主报告、深度报告等
 * 使用 localStorage + TTL，先读缓存再请求，减少 loading 与重复请求
 */

import {
  listArchives,
  getArchive,
  getMainReport,
  getReportArchiveStatus,
  getDeepReport,
  getDeepReportArchiveStatus,
} from './api-client'
import type { ApiArchive, ApiMainReport, ApiDeepReport } from './types/api'

const PREFIX = 'lc_'
const TTL_ARCHIVES = 2 * 60 * 1000       // 档案列表 2 分钟
const TTL_ARCHIVE = 5 * 60 * 1000       // 单档案 5 分钟
const TTL_MAIN_REPORT = 5 * 60 * 1000   // 主报告 5 分钟
const TTL_MAIN_STATUS = 1 * 60 * 1000   // 主报告状态 1 分钟
const TTL_DEEP_REPORT = 10 * 60 * 1000  // 深度报告内容 10 分钟
const TTL_DEEP_STATUS = 1 * 60 * 1000   // 深度报告状态 1 分钟

interface CacheEntry<T> {
  data: T
  ts: number
}

function getKey(k: string): string {
  return PREFIX + k
}

function getFromCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getKey(key))
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - entry.ts > ttlMs) return null
    return entry.data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() }
    localStorage.setItem(getKey(key), JSON.stringify(entry))
  } catch {
    // ignore quota or parse errors
  }
}

function removeCache(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(getKey(key))
  } catch {
    // ignore
  }
}

/** 有缓存则先返回缓存并后台刷新；无缓存则请求并写入 */
export async function listArchivesCached(): Promise<ApiArchive[]> {
  const key = 'archives'
  const cached = getFromCache<ApiArchive[]>(key, TTL_ARCHIVES)
  if (cached != null) {
    listArchives().then((list) => setCache(key, list ?? [])).catch(() => {})
    return cached
  }
  const list = await listArchives()
  setCache(key, list ?? [])
  return list ?? []
}

export function invalidateArchivesList(): void {
  removeCache('archives')
}

export async function getArchiveCached(archiveId: string): Promise<ApiArchive> {
  const key = `archive_${archiveId}`
  const cached = getFromCache<ApiArchive>(key, TTL_ARCHIVE)
  if (cached != null) {
    getArchive(archiveId).then((a) => setCache(key, a)).catch(() => {})
    return cached
  }
  const archive = await getArchive(archiveId)
  setCache(key, archive)
  return archive
}

export function invalidateArchive(archiveId: string): void {
  removeCache(`archive_${archiveId}`)
}

export async function getMainReportCached(archiveId: string): Promise<ApiMainReport | null> {
  const key = `main_${archiveId}`
  const cached = getFromCache<ApiMainReport | null>(key, TTL_MAIN_REPORT)
  if (cached != null && typeof cached === 'object' && 'archiveId' in cached) {
    getMainReport(archiveId).then((r) => r != null && setCache(key, r)).catch(() => {})
    return cached
  }
  const report = await getMainReport(archiveId)
  if (report != null) setCache(key, report)
  return report
}

export async function getReportArchiveStatusCached(archiveId: string): Promise<{
  report: ApiMainReport | null
  runningJob: { jobId: string } | null
}> {
  const key = `main_status_${archiveId}`
  const cached = getFromCache<{ report: ApiMainReport | null; runningJob: { jobId: string } | null }>(key, TTL_MAIN_STATUS)
  if (cached != null) {
    getReportArchiveStatus(archiveId).then((r) => setCache(key, r)).catch(() => {})
    return cached
  }
  const result = await getReportArchiveStatus(archiveId)
  setCache(key, result)
  return result
}

export function invalidateMainReport(archiveId: string): void {
  removeCache(`main_${archiveId}`)
  removeCache(`main_status_${archiveId}`)
}

export async function getDeepReportCached(archiveId: string, reportType: string): Promise<ApiDeepReport | null> {
  const key = `deep_${archiveId}_${reportType}`
  const cached = getFromCache<ApiDeepReport | null>(key, TTL_DEEP_REPORT)
  if (cached != null && typeof cached === 'object' && 'content' in cached) {
    getDeepReport(archiveId, reportType).then((r) => r != null && setCache(key, r)).catch(() => {})
    return cached
  }
  const report = await getDeepReport(archiveId, reportType)
  if (report != null) setCache(key, report)
  return report
}

export async function getDeepReportArchiveStatusCached(archiveId: string): Promise<
  Record<string, { status: 'none' | 'generating' | 'completed' | 'failed'; jobId?: string }>
> {
  const key = `deep_status_${archiveId}`
  const cached = getFromCache<Record<string, { status: 'none' | 'generating' | 'completed' | 'failed'; jobId?: string }>>(key, TTL_DEEP_STATUS)
  if (cached != null) {
    getDeepReportArchiveStatus(archiveId).then((r) => setCache(key, r)).catch(() => {})
    return cached
  }
  const result = await getDeepReportArchiveStatus(archiveId)
  setCache(key, result)
  return result
}

/** 深度报告生成完成后调用，使该档案的深度状态与对应报告缓存失效以便下次拉取最新 */
export function invalidateDeepReport(archiveId: string, reportType?: string): void {
  if (reportType) {
    removeCache(`deep_${archiveId}_${reportType}`)
  }
  removeCache(`deep_status_${archiveId}`)
}
