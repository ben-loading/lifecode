/**
 * 爱情姻缘深度报告内容类型（与页面 7 大块一致）
 */

export interface LoveMarriageCore {
  命理解析: string
  博弈地位: string
  博弈地位简评: string
  情感死穴: string[]
}

export interface LoveMarriageLandmark {
  名称: string
  五行标签: string
  简注: string
}

export interface LoveMarriageSoulmate {
  外貌气质: string
  职业圈层: string
  相遇高频地标: LoveMarriageLandmark[]
  地标前言?: string
  互动剧本: string
  互动剧本说明: string
}

export interface LoveMarriageLuckItem {
  区间: string
  岁数: string
  干支: string
  幸福指数: number
  情感状态关键词: string
  关键解读: string
}

export interface LoveMarriageSingle {
  脱单概率: string
  命理依据: string
  艳遇坐标: string
  避坑警示: string
}

export interface LoveMarriagePartner {
  第三者入侵指数: number
  命理依据: string
  潜在危险来源: string
  维稳手段: string[]
}

export interface LoveMarriageYear {
  流年天干: string
  流年地支: string
  核心象义: string
  单身: LoveMarriageSingle
  有伴侣: LoveMarriagePartner
}

export interface LoveMarriageMonth {
  激情燃烧月: { 月份: string; 说明: string }
  信任危机月: { 月份: string; 说明: string }
}

export interface LoveMarriageTimeItem {
  年份: string
  说明: string
}

export interface LoveMarriageTime {
  容易结婚年份: LoveMarriageTimeItem[]
  容易分手年份: LoveMarriageTimeItem[]
}

export interface LoveMarriageSummary {
  正文: string
  说明: string
  军师建议: string
}

export interface LoveMarriageContent {
  核心情感模式: LoveMarriageCore
  正缘画像: LoveMarriageSoulmate
  大运情感列表: LoveMarriageLuckItem[]
  年度情感推演: LoveMarriageYear
  流月情感: LoveMarriageMonth
  关键时间点: LoveMarriageTime
  情感年度总结: LoveMarriageSummary
}
