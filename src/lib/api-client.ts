/**
 * API 客户端：统一请求、token 携带、401 清 token、错误处理
 */

import type {
  ApiUser,
  ApiArchive,
  ApiReportJob,
  ApiMainReport,
  LoginBody,
  SendCodeBody,
  CreateArchiveBody,
  CreateReportJobBody,
} from './types/api'

const API_BASE = ''
const TOKEN_KEY = 'lifecode_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

/** 401 时调用，可由 context 注册以清空登录态 */
let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options
  const url = params
    ? `${API_BASE}/api${path}?${new URLSearchParams(params).toString()}`
    : `${API_BASE}/api${path}`
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    onUnauthorized?.()
  }
  if (!res.ok) {
    const text = await res.text()
    let message = text
    try {
      const j = JSON.parse(text)
      message = j.message ?? j.error ?? text
    } catch {
      // use text as message
    }
    throw new Error(message || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function sendCode(body: SendCodeBody): Promise<{ ok: boolean }> {
  return request('/auth/send-code', { method: 'POST', body: JSON.stringify(body) })
}

export async function login(body: LoginBody): Promise<{ user: ApiUser; token: string }> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(body) })
}

export async function getSession(): Promise<{ user: ApiUser } | null> {
  return request<{ user: ApiUser }>('/auth/session', { method: 'GET' }).catch(() => null)
}

export async function getMe(): Promise<ApiUser> {
  return request<ApiUser>('/users/me')
}

export async function listArchives(): Promise<ApiArchive[]> {
  return request<ApiArchive[]>('/archives')
}

export async function createArchive(body: CreateArchiveBody): Promise<ApiArchive> {
  return request<ApiArchive>('/archives', { method: 'POST', body: JSON.stringify(body) })
}

export async function getArchive(archiveId: string): Promise<ApiArchive> {
  return request<ApiArchive>(`/archives/${archiveId}`)
}

export async function createReportJob(body: CreateReportJobBody): Promise<{ jobId: string }> {
  return request<{ jobId: string }>('/report/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** 重新生成主报告（不扣能量，仅当该档案已有过生成任务时可用） */
export async function createReportJobRetry(archiveId: string): Promise<{ jobId: string }> {
  return request<{ jobId: string }>('/report/generate', {
    method: 'POST',
    body: JSON.stringify({ archiveId, retry: true }),
  })
}

export async function getReportJobStatus(jobId: string): Promise<ApiReportJob> {
  return request<ApiReportJob>(`/report/status/${jobId}`)
}

export async function getMainReport(archiveId: string): Promise<ApiMainReport | null> {
  return request<ApiMainReport | null>(`/report/${archiveId}`).catch(() => null)
}

export async function getBalance(): Promise<{ balance: number }> {
  return request<{ balance: number }>('/energy/balance')
}

export async function getTransactions(): Promise<{
  transactions: Array<{ id: string; type: 'topup' | 'consume'; amount: number; createdAt: string; description: string }>
}> {
  const res = await request<{ list: Array<{ id: string; type: string; amount: number; createdAt: string; description: string }> }>('/transactions')
  return { transactions: (res.list ?? []) as Array<{ id: string; type: 'topup' | 'consume'; amount: number; createdAt: string; description: string }> }
}

export async function topup(amount: number): Promise<{ balance: number }> {
  return request<{ balance: number }>('/energy/topup', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
}

export async function redeemCode(code: string): Promise<{ balance: number; amount: number }> {
  return request('/energy/redeem', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim() }),
  })
}

export async function unlockDeepReport(
  archiveId: string,
  reportType: string
): Promise<{ balance: number }> {
  return request<{ balance: number }>('/report/deep/unlock', {
    method: 'POST',
    body: JSON.stringify({ archiveId, reportType }),
  })
}

const PENDING_INVITE_KEY = 'lifecode_pending_invite'

export async function recordInvite(inviteRef: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/invite/record', {
    method: 'POST',
    body: JSON.stringify({ inviteRef: inviteRef.trim() }),
  })
}

export function savePendingInviteRefFromUrl(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const ref = params.get('invite')
  if (ref && ref.trim()) {
    localStorage.setItem(PENDING_INVITE_KEY, ref.trim())
    const url = new URL(window.location.href)
    url.searchParams.delete('invite')
    window.history.replaceState({}, '', url.pathname + url.search)
  }
}

export async function flushPendingInviteRef(): Promise<void> {
  if (typeof window === 'undefined' || !getToken()) return
  const ref = localStorage.getItem(PENDING_INVITE_KEY)
  if (!ref) return
  try {
    await recordInvite(ref)
  } finally {
    localStorage.removeItem(PENDING_INVITE_KEY)
  }
}
