/**
 * 主报告完整类型定义（13 个 Section）
 * 基于标准化方案 v2
 */

// === 工具类型 ===
export type DimensionName = '自我' | '财富' | '事业' | '情感' | '人脉' | '家庭' | '健康'
export type DimensionLevel = 'S级' | 'A级' | 'B级' | 'C级' | 'D级'
export type LifeStage = '少年期' | '青年期' | '中年期' | '晚年期'

export interface RadarDataItem {
  name: DimensionName
  value: number                 // 0-100
  fullMark: 100                 // 固定值
}

export interface DimensionDetail {
  title: DimensionName
  level: DimensionLevel
  description: string           // 50-200 字
}

export interface PersonalityTrait {
  label: string                 // 如："领子工作"
  value: number                 // 0-100
}

export interface PalaceAnalysis {
  surfacePersonality: {
    title: string
    description: string
  }
  deepDesire: {
    title: string
    description: string
  }
  thinkingPattern: {
    title: string
    description: string
  }
  wealthLogic: {
    title: string
    description: string
  }
  emotionalPattern: {
    title: string
    description: string
  }
}

export interface CareerDestiny {
  tracks: string                // 五行赛道
  industries: string            // 具体行业
  position: string              // 职能定位
}

export interface LifeStageItem {
  stage: LifeStage
  ageRange: string              // 如："5～24"
  description: string
}

export interface YearlyFortuneChartItem {
  year: string                  // "2024" / "2025" / "2026"
  value: number                 // 安全指数 0-100
}

export interface YearlyDetailItem {
  year: string
  stem: string                  // 干支
  level: string                 // "平/吉" / "凶" / "大凶（预警）"
  description: string
  details?: string              // 重点年份详细说明
  strategy?: string             // 策略建议
  isHighlight: boolean
}

// === 主报告接口（完整 13 个 Section）===
export interface MainReportContent {
  // 1. 人生剧本
  lifeScriptTitle: string
  lifeScriptDescription: string
  
  // 2. 核心能力
  coreAbility: string
  coreAbilityTags: string[]             // 长度 2-3，如：["#破壁者", "#拓荒领袖"]
  
  // 3. 命理基础
  baziDisplay: string                   // 如："己已 辛未 乙未 癸未"
  
  // 4. 雷达图能量分析（固定 7 维）
  radarData: [RadarDataItem, RadarDataItem, RadarDataItem, RadarDataItem, RadarDataItem, RadarDataItem, RadarDataItem]
  
  // 5. 多维解析详情（固定 7 维）
  dimensionDetails: [DimensionDetail, DimensionDetail, DimensionDetail, DimensionDetail, DimensionDetail, DimensionDetail, DimensionDetail]
  
  // 6. 性格特质构成（4-6 个）
  personalityTraits: PersonalityTrait[] // 长度 4-6
  
  // 7. 性格标签（4-6 个）
  personalityLabels: string[]           // 长度 4-6
  
  // 8. 宫位解析（5 个子模块，全部必填）
  palaceAnalysis: PalaceAnalysis
  
  // 9. 专业天命（3 个字段必填）
  careerDestiny: CareerDestiny
  
  // 10. 人生四阶（固定 4 个阶段）
  lifeStages: [LifeStageItem, LifeStageItem, LifeStageItem, LifeStageItem]
  
  // 11. 流年运势图表（固定 3 年）
  yearlyFortuneChart: [YearlyFortuneChartItem, YearlyFortuneChartItem, YearlyFortuneChartItem]
  
  // 12. 流年详细描述（固定 3 年）
  yearlyDetails: [YearlyDetailItem, YearlyDetailItem, YearlyDetailItem]
  
  // 13. 社交名片（1-3 段，用 \n\n 分隔）
  socialCard: string
}

// 注意：ApiMainReport 已在 api.ts 中定义，从 MainReportContent 扩展
