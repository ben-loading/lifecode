/** 主报告生成扣费（能量） */
export const MAIN_REPORT_COST = 20

/** 单类深度报告解锁扣费（能量） */
export const DEEP_REPORT_COST = 200

/** 4 类深度报告类型（用于校验） */
export const DEEP_REPORT_TYPES = [
  'future-fortune',
  'career-path',
  'wealth-road',
  'love-marriage',
] as const

export type DeepReportType = (typeof DEEP_REPORT_TYPES)[number]
