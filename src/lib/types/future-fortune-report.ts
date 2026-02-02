/**
 * 未来运势深度报告内容类型（与页面 5 大块一致）
 */

export type FutureFortuneLevelStyle = 'default' | 'highlight' | 'warn'
export type FutureFortuneVariant = 'default' | 'danger' | 'highlight'

/** 命格锚点 */
export interface FutureFortuneAnchor {
  人生点题: string
  时间坐标: string
  当前大运: string
  当前大运简评: string
}

/** 去年运势复盘 */
export interface FutureFortuneLastYear {
  年份关键词: string
  深度体感与事件验证: string
  极有可能发生: string[]
}

/** 财富/情感/事业实战 */
export interface FutureFortunePractice {
  流年信号: string
  行动指南: string
  策略补充?: string
}

/** 本年核心攻略 */
export interface FutureFortuneThisYear {
  副标题: string
  年度总象标题: string
  警报文案: string
  财富实战: FutureFortunePractice
  情感实战: FutureFortunePractice
  事业实战: FutureFortunePractice
}

/** 未来三年大势项 */
export interface FutureFortuneYearItem {
  年份标题: string
  级别: string
  级别样式: FutureFortuneLevelStyle
  描述: string
}

/** 流月战术节奏项 */
export interface FutureFortuneMonthItem {
  season: string
  stems: string
  stars: string
  summary: string
  description: string
  variant: FutureFortuneVariant
}

/** 未来运势完整内容（5 大块） */
export interface FutureFortuneContent {
  命格锚点: FutureFortuneAnchor
  去年运势复盘: FutureFortuneLastYear
  本年核心攻略: FutureFortuneThisYear
  未来三年大势: [FutureFortuneYearItem, FutureFortuneYearItem, FutureFortuneYearItem]
  流月战术节奏: [FutureFortuneMonthItem, FutureFortuneMonthItem, FutureFortuneMonthItem, FutureFortuneMonthItem]
}
