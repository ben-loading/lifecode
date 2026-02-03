/**
 * 财富之路深度报告内容类型（与页面 6 大块一致）
 */

export interface WealthRoadSummary {
  财富能量级: string
  财富能量级简评: string
  核心驱动引擎: string
}

export interface WealthRoadAssetItem {
  名称: string
  推荐指数: number
  建议: string
  逻辑支撑: string
  操作策略?: string
}

export interface WealthRoadInvest {
  投资风格评级: string
  投资风格说明: string
  适合的资产种类: WealthRoadAssetItem[]
  避坑指南: string
}

export interface WealthRoadLuckItem {
  区间: string
  岁数: string
  干支: string
  宫位: string
  财富总评分: number
  趋势波动指数: number[]
  核心策略: string
  关键解读: string
}

export interface WealthRoadYear {
  求财重心: string
  财运能量流: number[]
  总体趋势: string
  进财爆发月: [string, string]
  破财高危月: [string, string]
}

export interface WealthRoadRisk {
  最大的耗财黑洞: string
  二零二六特定风险: string
  止损方案: string[]
}

export interface WealthRoadFinal {
  正文: string
  现金流评分: number
  资产置换机遇评分: number
  最终建议: string
}

export interface WealthRoadContent {
  财富格局总定调: WealthRoadSummary
  投资理财: WealthRoadInvest
  大运财富列表: WealthRoadLuckItem[]
  年度财运推演: WealthRoadYear
  财富漏洞与动荡: WealthRoadRisk
  财富年度总结: WealthRoadFinal
}
