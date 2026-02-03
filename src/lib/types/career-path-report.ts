/**
 * 仕途探索深度报告内容类型（与页面 7 大块一致）
 */

export interface CareerPathTrackA {
  标签: string
  行业领域: string
  上限高度: string
  发展路径: string
  理由: string
}

export interface CareerPathTrackB {
  标签: string
  行业领域: string
  简评: string
}

export interface CareerPathMode {
  打工胜率: number
  创业胜率: number
  角色定位: string
  深度解析: string
}

export interface CareerPathStrategy {
  副标题?: string
  最强赛道A: CareerPathTrackA
  次选赛道B: CareerPathTrackB
  模式选择: CareerPathMode
}

export interface CareerPathLuckItem {
  区间: string
  岁数: string
  干支: string
  宫位: string
  事业总评分: number
  趋势波动指数: number[]
  核心策略: string
  关键解读: string
}

export interface CareerPathYearFocus {
  副标题?: string
  年度关键词: string
  核心战略: string
  行动指南: string[]
}

export interface CareerPathMonthly {
  事业能量流: number[]
  挑战关键流月: string[]
  高能关键流月: string[]
}

export interface CareerPathWarning {
  可能出现的动荡事件: string[]
  回避与止损方案: string
}

export interface CareerPathHelp {
  核心助力来源: string
  增运建议: string[]
}

export interface CareerPathSummary {
  正文: string
  评分: number
}

export interface CareerPathContent {
  长期战略: CareerPathStrategy
  大运列表: CareerPathLuckItem[]
  年度事业重心: CareerPathYearFocus
  流月走势: CareerPathMonthly
  动荡预警: CareerPathWarning
  助力分析: CareerPathHelp
  事业年度总结: CareerPathSummary
}
