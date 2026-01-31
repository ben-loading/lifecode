/**
 * Supabase 数据访问层
 * 替代 store 的内存存储，实现持久化
 */

import { createClient } from '@supabase/supabase-js'
import type { ApiUser, ApiArchive, ApiReportJob, ApiMainReport } from '@/lib/types/api'
import type { CreateArchiveBody } from '@/lib/types/api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少 SUPABASE 环境变量')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

// ==================== Auth ====================

export async function setVerificationCode(email: string, code: string, expiresAt: number): Promise<void> {
  const client = getClient()
  await client.from('VerificationCode').upsert({ email: email.toLowerCase(), code, expiresAt }, { onConflict: 'email' })
}

export async function getAndDeleteVerificationCode(email: string): Promise<{ code: string; expiresAt: number } | null> {
  const client = getClient()
  const { data, error } = await client.from('VerificationCode').select('code, expiresAt').eq('email', email.toLowerCase()).single()
  if (error || !data) return null
  await client.from('VerificationCode').delete().eq('email', email.toLowerCase())
  return { code: data.code, expiresAt: Number(data.expiresAt) }
}

export async function createSession(token: string, userId: string): Promise<void> {
  const client = getClient()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 天
  await client.from('Session').insert({ token, userId, expiresAt })
}

export async function getUserIdByToken(token: string): Promise<string | null> {
  const client = getClient()
  const { data, error } = await client.from('Session').select('userId, expiresAt').eq('token', token).single()
  if (error || !data) return null
  if (new Date(data.expiresAt) < new Date()) return null
  return data.userId
}

// ==================== User ====================

function rowToUser(row: Record<string, unknown>): ApiUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? undefined,
    balance: (row.balance as number) ?? 0,
    inviteRef: (row.inviteRef as string) ?? undefined,
  }
}

export async function getUserById(id: string): Promise<ApiUser | null> {
  const client = getClient()
  const { data, error } = await client.from('User').select('*').eq('id', id).single()
  if (error || !data) return null
  return rowToUser(data)
}

export async function getUserByEmail(email: string): Promise<ApiUser | null> {
  const client = getClient()
  const { data, error } = await client.from('User').select('*').eq('email', email.toLowerCase()).single()
  if (error || !data) return null
  return rowToUser(data)
}

export async function createUser(params: { id?: string; email: string; name?: string; balance: number; inviteRef: string }): Promise<ApiUser> {
  const client = getClient()
  const insert: Record<string, unknown> = {
    email: params.email.toLowerCase(),
    name: params.name ?? params.email.split('@')[0],
    balance: params.balance,
    inviteRef: params.inviteRef,
  }
  if (params.id) insert.id = params.id
  const { data, error } = await client.from('User').insert(insert).select().single()
  if (error) throw new Error(`创建用户失败: ${error.message}`)
  return rowToUser(data)
}

export async function updateUserBalance(id: string, delta: number): Promise<void> {
  const client = getClient()
  const { data } = await client.from('User').select('balance').eq('id', id).single()
  if (!data) throw new Error('用户不存在')
  await client.from('User').update({ balance: (data.balance as number) + delta, updatedAt: new Date().toISOString() }).eq('id', id)
}

export async function updateUserInviteRef(id: string, inviteRef: string): Promise<void> {
  const client = getClient()
  await client.from('User').update({ inviteRef, updatedAt: new Date().toISOString() }).eq('id', id)
}

export async function getUserIdByInviteRef(inviteRef: string): Promise<string | null> {
  const client = getClient()
  const { data, error } = await client.from('User').select('id').eq('inviteRef', inviteRef).single()
  if (error || !data) return null
  return data.id as string
}

// ==================== Archive ====================

function rowToArchive(row: Record<string, unknown>): ApiArchive {
  const a: ApiArchive = {
    id: row.id as string,
    userId: row.userId as string,
    name: row.name as string,
    gender: row.gender as 'male' | 'female',
    birthDate: (row.birthDate as string).replace('Z', '').slice(0, 19),
    birthLocation: ((row.birthLocation as string) ?? '') || '',
    createdAt: (row.createdAt as string).replace('Z', '').slice(0, 19),
  }
  if (row.birthCalendar) a.birthCalendar = row.birthCalendar as 'solar' | 'lunar'
  if (row.birthTimeMode) a.birthTimeMode = row.birthTimeMode as 'datetime' | 'shichen'
  if (row.birthTimeBranch != null) a.birthTimeBranch = row.birthTimeBranch as number
  if (row.lunarDate) a.lunarDate = row.lunarDate as string
  if (row.isLeapMonth != null) a.isLeapMonth = row.isLeapMonth as boolean
  return a
}

export async function getArchivesByUserId(userId: string): Promise<ApiArchive[]> {
  const client = getClient()
  const { data, error } = await client.from('Archive').select('*').eq('userId', userId).order('createdAt', { ascending: false })
  if (error) throw new Error(`查询档案失败: ${error.message}`)
  return (data ?? []).map(rowToArchive)
}

export async function getArchiveById(id: string): Promise<ApiArchive | null> {
  const client = getClient()
  const { data, error } = await client.from('Archive').select('*').eq('id', id).single()
  if (error || !data) return null
  return rowToArchive(data)
}

export async function createArchive(userId: string, body: CreateArchiveBody): Promise<ApiArchive> {
  const client = getClient()
  const insert: Record<string, unknown> = {
    userId,
    name: body.name.trim().slice(0, 12),
    gender: body.gender,
    birthDate: body.birthDate,
    birthLocation: body.birthLocation?.trim() ?? null,
    birthCalendar: body.birthCalendar ?? null,
    birthTimeMode: body.birthTimeMode ?? null,
    birthTimeBranch: body.birthTimeBranch ?? null,
    lunarDate: body.lunarDate ?? null,
    isLeapMonth: body.isLeapMonth ?? null,
  }
  const { data, error } = await client.from('Archive').insert(insert).select().single()
  if (error) throw new Error(`创建档案失败: ${error.message}`)
  return rowToArchive(data)
}

// ==================== MainReport ====================

export async function getMainReportByArchiveId(archiveId: string): Promise<ApiMainReport | null> {
  const client = getClient()
  const { data, error } = await client.from('MainReport').select('*').eq('archiveId', archiveId).single()
  if (error || !data) return null
  const content = data.content as Record<string, unknown>
  return {
    id: data.id as string,
    archiveId: data.archiveId as string,
    createdAt: (data.createdAt as string).replace('Z', '').slice(0, 19),
    ...content,
  } as ApiMainReport
}

export async function createMainReport(report: ApiMainReport): Promise<void> {
  const client = getClient()
  const { id, archiveId, createdAt, ...content } = report
  const c = content as Record<string, unknown>
  const lifeScript = c.lifeScript as { title?: string } | undefined
  const foundationData = c.foundationData as Record<string, unknown> | undefined
  await client.from('MainReport').upsert({
    id,
    archiveId,
    content,
    lifeScriptTitle: lifeScript?.title,
    baziDisplay: foundationData?.['八字'] as string | undefined,
  }, { onConflict: 'archiveId' })
}

// ==================== ReportJob ====================

function rowToReportJob(row: Record<string, unknown>): ApiReportJob {
  return {
    jobId: row.id as string,
    archiveId: row.archiveId as string,
    status: row.status as ApiReportJob['status'],
    currentStep: row.currentStep as number | undefined,
    totalSteps: row.totalSteps as number | undefined,
    stepLabel: row.stepLabel as string | undefined,
    completedAt: row.completedAt ? (row.completedAt as string).replace('Z', '').slice(0, 19) : undefined,
    error: row.error as string | undefined,
  }
}

export async function getReportJobById(jobId: string): Promise<ApiReportJob | null> {
  const client = getClient()
  const { data, error } = await client.from('ReportJob').select('*').eq('id', jobId).single()
  if (error || !data) return null
  return rowToReportJob(data)
}

export async function createReportJob(archiveId: string, status: string, stepLabel?: string): Promise<string> {
  const client = getClient()
  const { data, error } = await client.from('ReportJob').insert({
    archiveId,
    status,
    currentStep: 0,
    totalSteps: 6,
    stepLabel: stepLabel ?? '编码解析',
  }).select('id').single()
  if (error) throw new Error(`创建任务失败: ${error.message}`)
  return data.id as string
}

export async function updateReportJob(jobId: string, updates: Partial<{ status: string; currentStep: number; totalSteps: number; stepLabel: string | null; error: string; completedAt: string }>): Promise<void> {
  const client = getClient()
  await client.from('ReportJob').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', jobId)
}

// ==================== Transaction ====================

export interface ServerTransaction {
  id: string
  type: string
  amount: number
  createdAt: string
  description: string
}

export async function getTransactionsByUserId(userId: string): Promise<ServerTransaction[]> {
  const client = getClient()
  const { data, error } = await client.from('Transaction').select('*').eq('userId', userId).order('createdAt', { ascending: false })
  if (error) throw new Error(`查询交易失败: ${error.message}`)
  return (data ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    createdAt: (r.createdAt as string).replace('Z', '').slice(0, 19),
    description: r.description,
  }))
}

export async function createTransaction(userId: string, tx: { type: string; amount: number; description: string }): Promise<void> {
  const client = getClient()
  await client.from('Transaction').insert({
    userId,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
  })
}

// ==================== Invite ====================

export interface InviteRecord {
  id: string
  inviterId: string
  inviteeId: string
  isValid: boolean
  createdAt: string
}

export async function getInvitesByInvitee(inviteeId: string): Promise<InviteRecord[]> {
  const client = getClient()
  const { data, error } = await client.from('Invite').select('*').eq('inviteeId', inviteeId).eq('isValid', false)
  if (error) return []
  return (data ?? []).map((r) => ({
    id: r.id,
    inviterId: r.inviterId,
    inviteeId: r.inviteeId,
    isValid: r.isValid,
    createdAt: r.createdAt,
  }))
}

export async function getValidInviteCount(inviterId: string): Promise<number> {
  const client = getClient()
  const { count, error } = await client.from('Invite').select('*', { count: 'exact', head: true }).eq('inviterId', inviterId).eq('isValid', true)
  if (error) return 0
  return count ?? 0
}

export async function setInviteValid(id: string): Promise<void> {
  const client = getClient()
  await client.from('Invite').update({ isValid: true }).eq('id', id)
}

export async function createInvite(inviterId: string, inviteeId: string): Promise<string> {
  const client = getClient()
  const { data, error } = await client.from('Invite').insert({ inviterId, inviteeId, isValid: false }).select('id').single()
  if (error) throw new Error(`创建邀请失败: ${error.message}`)
  return data.id as string
}

export async function getInviteByInviterInvitee(inviterId: string, inviteeId: string): Promise<InviteRecord | null> {
  const client = getClient()
  const { data, error } = await client.from('Invite').select('*').eq('inviterId', inviterId).eq('inviteeId', inviteeId).single()
  if (error || !data) return null
  return { id: data.id, inviterId: data.inviterId, inviteeId: data.inviteeId, isValid: data.isValid, createdAt: data.createdAt }
}

// ==================== RedemptionCode ====================

export interface RedemptionCodeRecord {
  amount: number
  usedBy?: string
  usedAt?: string
}

export async function getRedemptionCode(code: string): Promise<RedemptionCodeRecord | null> {
  const client = getClient()
  const { data, error } = await client.from('RedemptionCode').select('amount, usedBy, usedAt').eq('code', code.toUpperCase()).single()
  if (error || !data) return null
  return {
    amount: data.amount,
    usedBy: data.usedBy ?? undefined,
    usedAt: data.usedAt ? new Date(data.usedAt).toISOString() : undefined,
  }
}

export async function redeemCode(code: string, userId: string): Promise<void> {
  const client = getClient()
  await client.from('RedemptionCode').update({ usedBy: userId, usedAt: new Date().toISOString() }).eq('code', code.toUpperCase())
}
