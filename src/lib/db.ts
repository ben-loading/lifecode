/**
 * Supabase 数据访问层
 * 替代 store 的内存存储，实现持久化
 */

import { createClient } from '@supabase/supabase-js'
import type { ApiUser, ApiArchive, ApiReportJob, ApiMainReport, ApiDeepReportJob, ApiDeepReport } from '@/lib/types/api'
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
  const now = new Date().toISOString()
  const insert: Record<string, unknown> = {
    email: params.email.toLowerCase(),
    name: params.name ?? params.email.split('@')[0],
    balance: params.balance,
    inviteRef: params.inviteRef,
    createdAt: now,
    updatedAt: now,
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
  const now = new Date().toISOString()
  const insert: Record<string, unknown> = {
    id: crypto.randomUUID(),
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
    createdAt: now,
    updatedAt: now,
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
  const now = new Date().toISOString()
  await client.from('MainReport').upsert({
    id,
    archiveId,
    content,
    lifeScriptTitle: lifeScript?.title,
    baziDisplay: foundationData?.['八字'] as string | undefined,
    createdAt: createdAt ?? now,
    updatedAt: now,
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

/** 该档案是否已有过生成任务（用于允许免费重新生成） */
export async function hasReportJobForArchive(archiveId: string): Promise<boolean> {
  const client = getClient()
  const { count, error } = await client
    .from('ReportJob')
    .select('*', { count: 'exact', head: true })
    .eq('archiveId', archiveId)
    .limit(1)
  if (error) return false
  return (count ?? 0) > 0
}

/** 该档案是否已有 running 或 processing 任务（禁止重复发起） */
export async function getRunningReportJobForArchive(archiveId: string): Promise<ApiReportJob | null> {
  const client = getClient()
  const { data, error } = await client
    .from('ReportJob')
    .select('*')
    .eq('archiveId', archiveId)
    .in('status', ['running', 'processing'])
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return rowToReportJob(data)
}

export async function createReportJob(archiveId: string, status: string, stepLabel?: string): Promise<string> {
  const client = getClient()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const { data, error } = await client.from('ReportJob').insert({
    id,
    archiveId,
    status,
    currentStep: 0,
    totalSteps: 6,
    stepLabel: stepLabel ?? '编码解析',
    createdAt: now,
    updatedAt: now,
  }).select('id').single()
  if (error) throw new Error(`创建任务失败: ${error.message}`)
  return (data?.id as string) ?? id
}

export async function updateReportJob(jobId: string, updates: Partial<{ status: string; currentStep: number; totalSteps: number; stepLabel: string | null; error: string; completedAt: string }>): Promise<void> {
  const client = getClient()
  await client.from('ReportJob').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', jobId)
}

/**
 * 原子领取下一个 status='running' 的任务，并改为 'processing'。
 * 供外部 Worker 轮询调用，保证多 Worker 下不重复领取。
 */
export async function getNextRunningReportJobAndClaim(): Promise<ApiReportJob | null> {
  const client = getClient()
  const { data: jobs, error: listErr } = await client
    .from('ReportJob')
    .select('*')
    .eq('status', 'running')
    .order('createdAt', { ascending: true })
    .limit(1)
  if (listErr || !jobs?.length) return null
  const row = jobs[0] as Record<string, unknown>
  const jobId = row.id as string
  const now = new Date().toISOString()
  const { data: updated, error: updateErr } = await client
    .from('ReportJob')
    .update({ status: 'processing', updatedAt: now })
    .eq('id', jobId)
    .eq('status', 'running')
    .select()
    .single()
  if (updateErr || !updated) return null
  return rowToReportJob(updated)
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
  const now = new Date().toISOString()
  await client.from('Transaction').insert({
    id: crypto.randomUUID(),
    userId,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    createdAt: now,
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
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const { data, error } = await client.from('Invite').insert({ id, inviterId, inviteeId, isValid: false, createdAt: now }).select('id').single()
  if (error) throw new Error(`创建邀请失败: ${error.message}`)
  return (data?.id as string) ?? id
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

// ==================== DeepReport ====================

export async function getDeepReportByArchiveAndType(archiveId: string, reportType: string): Promise<ApiDeepReport | null> {
  const client = getClient()
  const { data, error } = await client
    .from('DeepReport')
    .select('*')
    .eq('archiveId', archiveId)
    .eq('reportType', reportType)
    .single()
  if (error || !data) return null
  return {
    archiveId: data.archiveId as string,
    reportType: data.reportType as string,
    content: (data.content ?? {}) as Record<string, unknown>,
    createdAt: (data.createdAt as string).replace('Z', '').slice(0, 19),
  }
}

export async function createDeepReport(archiveId: string, reportType: string, content: Record<string, unknown>): Promise<void> {
  const client = getClient()
  const now = new Date().toISOString()
  const { error } = await client.from('DeepReport').upsert(
    {
      id: crypto.randomUUID(),
      archiveId,
      reportType,
      content,
      updatedAt: now,
    },
    { onConflict: 'archiveId,reportType' }
  )
  if (error) {
    console.error('[db] createDeepReport failed:', error.message, 'code:', error.code, 'archiveId:', archiveId, 'reportType:', reportType)
    throw new Error(`写入深度报告失败: ${error.message}`)
  }
}

// ==================== DeepReportJob ====================

function rowToDeepReportJob(row: Record<string, unknown>): ApiDeepReportJob {
  return {
    jobId: row.id as string,
    archiveId: row.archiveId as string,
    reportType: row.reportType as string,
    status: row.status as ApiDeepReportJob['status'],
    currentStep: row.currentStep as number | undefined,
    totalSteps: row.totalSteps as number | undefined,
    stepLabel: row.stepLabel as string | undefined,
    completedAt: row.completedAt ? (row.completedAt as string).replace('Z', '').slice(0, 19) : undefined,
    error: row.error as string | undefined,
  }
}

export async function getDeepReportJobById(jobId: string): Promise<ApiDeepReportJob | null> {
  const client = getClient()
  const { data, error } = await client.from('DeepReportJob').select('*').eq('id', jobId).single()
  if (error || !data) return null
  return rowToDeepReportJob(data)
}

export async function getRunningDeepReportJobForArchive(archiveId: string, reportType: string): Promise<ApiDeepReportJob | null> {
  const client = getClient()
  const { data, error } = await client
    .from('DeepReportJob')
    .select('*')
    .eq('archiveId', archiveId)
    .eq('reportType', reportType)
    .in('status', ['running', 'processing'])
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return rowToDeepReportJob(data)
}

/** 该档案+类型下最新一条深度报告任务（任意状态），用于判断是否可免费重试 */
export async function getLastDeepReportJobForArchive(archiveId: string, reportType: string): Promise<ApiDeepReportJob | null> {
  const client = getClient()
  const { data, error } = await client
    .from('DeepReportJob')
    .select('*')
    .eq('archiveId', archiveId)
    .eq('reportType', reportType)
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return rowToDeepReportJob(data)
}

export async function createDeepReportJob(archiveId: string, reportType: string, status: string, stepLabel?: string): Promise<string> {
  const client = getClient()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const { data, error } = await client
    .from('DeepReportJob')
    .insert({
      id,
      archiveId,
      reportType,
      status,
      currentStep: 0,
      totalSteps: 4,
      stepLabel: stepLabel ?? '准备输入',
      createdAt: now,
      updatedAt: now,
    })
    .select('id')
    .single()
  if (error) throw new Error(`创建深度报告任务失败: ${error.message}`)
  return (data?.id as string) ?? id
}

export async function updateDeepReportJob(
  jobId: string,
  updates: Partial<{ status: string; currentStep: number; totalSteps: number; stepLabel: string | null; error: string; completedAt: string }>
): Promise<void> {
  const client = getClient()
  await client.from('DeepReportJob').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', jobId)
}
