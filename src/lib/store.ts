/**
 * 服务端内存存储（开发用），使用 globalThis 跨请求共享
 */

import type { ApiUser, ApiArchive, ApiReportJob, ApiMainReport } from './types/api'

export interface RedemptionCodeRecord {
  amount: number
  usedBy?: string
  usedAt?: string
}

export interface InviteRecord {
  id: string
  inviterId: string
  inviteeId: string
  isValid: boolean
  createdAt: string
}

export interface ServerTransaction {
  id: string
  type: 'topup' | 'consume'
  amount: number
  createdAt: string
  description: string
}

declare global {
  // eslint-disable-next-line no-var
  var __lifecode_store: {
    users: Map<string, ApiUser>
    tokens: Map<string, string>
    archives: Map<string, ApiArchive>
    reportJobs: Map<string, ApiReportJob>
    mainReports: Map<string, ApiMainReport>
    archiveToReport: Map<string, string>  // archiveId -> reportId
    codes: Map<string, { code: string; expiresAt: number }>
    redemptionCodes: Map<string, RedemptionCodeRecord>
    invites: Map<string, InviteRecord>
    refToUserId: Map<string, string>
    userTransactions: Map<string, ServerTransaction[]>
  } | undefined
}

function getStore() {
  if (typeof globalThis.__lifecode_store === 'undefined') {
    const st = {
      users: new Map(),
      tokens: new Map(),
      archives: new Map(),
      reportJobs: new Map(),
      mainReports: new Map(),
      archiveToReport: new Map(),
      codes: new Map(),
      redemptionCodes: new Map(),
      invites: new Map(),
      refToUserId: new Map(),
      userTransactions: new Map(),
    }
    st.redemptionCodes.set('DEMO50', { amount: 50 })
    globalThis.__lifecode_store = st
  }
  const st = globalThis.__lifecode_store
  if (!st.userTransactions) {
    ;(st as Record<string, unknown>).userTransactions = new Map()
  }
  if (!st.archiveToReport) {
    ;(st as Record<string, unknown>).archiveToReport = new Map()
  }
  return st
}

export const store = {
  get users() {
    return getStore().users
  },
  get tokens() {
    return getStore().tokens
  },
  get archives() {
    return getStore().archives
  },
  get reportJobs() {
    return getStore().reportJobs
  },
  get mainReports() {
    return getStore().mainReports
  },
  get archiveToReport() {
    return getStore().archiveToReport
  },
  get codes() {
    return getStore().codes
  },
  get redemptionCodes() {
    return getStore().redemptionCodes
  },
  get invites() {
    return getStore().invites
  },
  get refToUserId() {
    return getStore().refToUserId
  },
  get userTransactions() {
    return getStore().userTransactions
  },
}
