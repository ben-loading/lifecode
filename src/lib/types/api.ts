/**
 * API 类型：与后端约定一致，供 api-client 与 API 路由共用
 */

export type Gender = 'male' | 'female'

/** 当前登录用户（从 session/me 获取） */
export interface ApiUser {
  id: string
  email: string
  name?: string
  balance: number
  isNewUser?: boolean
  inviteRef?: string
}

/** 档案：归属用户，用于主报告/深度报告 */
export interface ApiArchive {
  id: string
  userId: string
  name: string
  gender: Gender
  birthDate: string
  birthLocation: string
  createdAt: string
}

/** 主报告任务状态 */
export type ReportJobStatus = 'pending' | 'running' | 'completed' | 'failed'

/** 主报告任务（轮询 status 时返回） */
export interface ApiReportJob {
  jobId: string
  archiveId: string
  status: ReportJobStatus
  currentStep?: number
  totalSteps?: number
  stepLabel?: string
  completedAt?: string
  error?: string
}

/** 主报告内容 */
export interface ApiMainReport {
  archiveId: string
  lifeScriptTitle: string
  lifeScriptDescription: string
  coreAbility: string
  baziDisplay?: string
  radarData: { name: string; value: number; fullMark: number }[]
  dimensionDetails: { title: string; level: string; description: string }[]
}

export interface LoginBody {
  email: string
  code: string
}

export interface SendCodeBody {
  email: string
}

export interface CreateArchiveBody {
  name: string
  gender: Gender
  birthDate: string
  birthLocation: string
}

export interface CreateReportJobBody {
  archiveId: string
}
