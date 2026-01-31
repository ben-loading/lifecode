/**
 * API 类型：与后端约定一致，供 api-client 与 API 路由共用
 */

import type { MainReportContent } from './main-report'

export type Gender = 'male' | 'female'

/** 出生日期历制：公历 / 农历 */
export type BirthCalendar = 'solar' | 'lunar'

/** 出生时间输入方式：具体时刻（需地区校准） / 时辰选择（无需地区） */
export type BirthTimeMode = 'datetime' | 'shichen'

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
  /** 公历/农历，缺省为公历 */
  birthCalendar?: BirthCalendar
  /** 具体时刻/时辰，缺省为具体时刻 */
  birthTimeMode?: BirthTimeMode
  /** 时辰序号 0～12（仅当 birthTimeMode=shichen 时有效） */
  birthTimeBranch?: number
  /** 农历日期 YYYY-M-D（仅当 birthCalendar=lunar 时有效） */
  lunarDate?: string
  /** 是否闰月（仅当 birthCalendar=lunar 时有效） */
  isLeapMonth?: boolean
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

/** 主报告内容（完整 13 个 Section）*/
export interface ApiMainReport extends MainReportContent {
  id: string
  archiveId: string
  createdAt: string
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
  birthCalendar?: BirthCalendar
  birthTimeMode?: BirthTimeMode
  birthTimeBranch?: number
  lunarDate?: string
  isLeapMonth?: boolean
}

export interface CreateReportJobBody {
  archiveId: string
}
