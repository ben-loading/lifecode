/**
 * 报告验证器
 *
 * 使用 Zod Schema 验证 LLM 输出的报告数据格式；
 * 提供 normalizeMainReportOutput 对 LLM 常见格式偏差做兼容转换后再校验；
 * 提供 extractJsonFromResponse 从 deepseek-reasoner 等带思考块的内容中提取 JSON。
 */

import { z } from 'zod'

/**
 * 从 LLM 返回文本中提取 JSON 字符串（用于 deepseek-reasoner 等带 <think>...</think> 或 ```json 的模型）
 */
export function extractJsonFromResponse(raw: string): string {
  let text = raw.trim()
  // 1. 去掉 <think>...</think> 块（含多行，标签可能大小写混合）
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '')
  // 2. 若存在 </think>，取最后一块 </think> 之后的内容作为“最终答案”（reasoner 常把 JSON 放在最后）
  const lastThinkEnd = text.toLowerCase().lastIndexOf('</think>')
  if (lastThinkEnd !== -1) text = text.slice(lastThinkEnd + 7).trim()
  // 3. 提取 ```json ... ``` 或 ``` ... ``` 代码块（取第一个含 { 的块）
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    const block = codeBlockMatch[1].trim()
    if (block.startsWith('{')) return block
  }
  // 4. 尝试找 { ... } 的边界（从第一个 { 到最后一个 }）
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) return text.slice(first, last + 1)
  return text
}

// 七维顺序（与 radarData / dimensionDetails 一致）
const DIMENSION_NAMES = ['自我', '财富', '事业', '情感', '人脉', '家庭', '健康'] as const
const LIFE_STAGE_VALUES = ['少年期', '青年期', '中年期', '晚年期'] as const
const LEVELS = ['S级', 'A级', 'B级', 'C级', 'D级'] as const

function valueToLevel(value: number): (typeof LEVELS)[number] {
  if (value >= 90) return 'S级'
  if (value >= 75) return 'A级'
  if (value >= 60) return 'B级'
  if (value >= 40) return 'C级'
  return 'D级'
}

const DEFAULT_DIMENSION_DESCRIPTION =
  '本维度由系统根据能量值补全简要说明，完整解析请以重新生成报告为准。'

/**
 * 从 stage 字符串中提取标准枚举值（少年期|青年期|中年期|晚年期）
 */
function extractLifeStage(stage: unknown): (typeof LIFE_STAGE_VALUES)[number] {
  const s = typeof stage === 'string' ? stage : ''
  const found = LIFE_STAGE_VALUES.find((v) => s.includes(v) || s.startsWith(v))
  return found ?? '青年期'
}

/**
 * 对 LLM 原始输出做兼容转换，再交给 Zod 校验。
 * - radarData 纯数字数组 → 转为 { name, value, fullMark }[]
 * - year 数字 → 字符串
 * - lifeStages[].stage 带后缀 → 只保留枚举值
 */
export function normalizeMainReportOutput(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  const out: Record<string, unknown> = { ...o }

  // radarData: [n1,n2,...] → [{ name, value, fullMark }, ...]，value 裁剪到 0-100 供前端图表
  if (Array.isArray(o.radarData) && o.radarData.length === 7) {
    const first = o.radarData[0]
    if (typeof first === 'number') {
      out.radarData = (o.radarData as number[]).map((value, i) => ({
        name: DIMENSION_NAMES[i] ?? '自我',
        value: Math.min(100, Math.max(0, Number(value) || 0)),
        fullMark: 100
      }))
    }
  }

  // yearlyFortuneChart: year 数字 → 字符串
  if (Array.isArray(o.yearlyFortuneChart)) {
    out.yearlyFortuneChart = (o.yearlyFortuneChart as Array<{ year?: unknown; value?: unknown }>).map(
      (item) => ({
        ...item,
        year: typeof item.year === 'number' ? String(item.year) : item.year ?? ''
      })
    )
  }

  // yearlyDetails: year 数字 → 字符串
  if (Array.isArray(o.yearlyDetails)) {
    out.yearlyDetails = (o.yearlyDetails as Array<Record<string, unknown>>).map((item) => ({
      ...item,
      year: typeof item.year === 'number' ? String(item.year) : item.year ?? ''
    }))
  }

  // lifeStages: stage 只保留枚举值，缺 ageRange 时用原 stage 或空串
  if (Array.isArray(o.lifeStages) && o.lifeStages.length === 4) {
    out.lifeStages = (o.lifeStages as Array<{ stage?: unknown; ageRange?: unknown; description?: unknown }>).map(
      (item) => {
        const stage = extractLifeStage(item.stage)
        const rawStage = typeof item.stage === 'string' ? item.stage : ''
        const ageRange = typeof item.ageRange === 'string' && item.ageRange ? item.ageRange : rawStage || ''
        return {
          stage,
          ageRange,
          description: item.description ?? ''
        }
      }
    )
  }

  // dimensionDetails: 缺 title/level/description 时用 radarData 与占位补全
  const radarArr = out.radarData as Array<{ name?: string; value?: number }> | undefined
  if (Array.isArray(o.dimensionDetails) && o.dimensionDetails.length === 7 && Array.isArray(radarArr) && radarArr.length === 7) {
    out.dimensionDetails = (o.dimensionDetails as Array<Record<string, unknown>>).map((item, i) => {
      const name = DIMENSION_NAMES[i] ?? '自我'
      const value = radarArr[i]?.value ?? 60
      return {
        title: item.title ?? name,
        level: item.level ?? valueToLevel(value),
        description: typeof item.description === 'string' ? item.description : DEFAULT_DIMENSION_DESCRIPTION
      }
    })
  }

  // lifeScriptTitle: 缺失时占位；有内容但非「四字·四字」时格式化为四字·四字；·两侧先去尾标点再取前四字
  const stripPunctuation = (s: string) => s.replace(/[，。、；：！？\s]+$/g, '').trim()
  if (typeof out.lifeScriptTitle !== 'string' || !out.lifeScriptTitle.trim()) {
    out.lifeScriptTitle = '命盘解析·运势解析'
  } else {
    const t = out.lifeScriptTitle.trim()
    if (!/^.{4}·.{4}$/.test(t)) {
      const dot = t.indexOf('·')
      if (dot !== -1) {
        const leftRaw = stripPunctuation(t.slice(0, dot))
        const rightRaw = stripPunctuation(t.slice(dot + 1))
        const left = leftRaw.slice(0, 4).padEnd(4, '命')
        const right = rightRaw.slice(0, 4).padEnd(4, '运')
        out.lifeScriptTitle = left + '·' + right
      } else {
        const cleaned = stripPunctuation(t)
        out.lifeScriptTitle = cleaned.slice(0, 4).padEnd(4, '命') + '·' + (cleaned.slice(4, 8) || '运势').padEnd(4, '运')
      }
    }
  }

  // lifeScriptDescription: 缺失时占位
  if (typeof out.lifeScriptDescription !== 'string' || !out.lifeScriptDescription.trim()) {
    out.lifeScriptDescription = DEFAULT_DIMENSION_DESCRIPTION
  }

  // coreAbilityTags: 确保每项以 # 开头，保证至少 1 项
  if (Array.isArray(o.coreAbilityTags) && o.coreAbilityTags.length > 0) {
    out.coreAbilityTags = (o.coreAbilityTags as unknown[]).map((x) =>
      typeof x === 'string' && x.trim() ? (x.startsWith('#') ? x : '#' + x) : '#未命名'
    )
  } else {
    out.coreAbilityTags = ['#未命名']
  }

  // personalityTraits: 字符串 → 数组；缺失或空时至少 1 项
  if (typeof o.personalityTraits === 'string') {
    const s = (o.personalityTraits as string).trim()
    out.personalityTraits = [
      { label: s.length > 0 ? s.slice(0, 12) : '综合性格', value: 70 },
      { label: '行动力', value: 65 },
      { label: '社交倾向', value: 60 },
      { label: '情绪模式', value: 65 }
    ]
  } else if (!Array.isArray(o.personalityTraits) || o.personalityTraits.length === 0) {
    out.personalityTraits = [{ label: '综合性格', value: 70 }]
  } else {
    // 兜底：数组项 label 超长时截断为前 10 字 + …，避免半句话
    const arr = out.personalityTraits as Array<{ label?: string; value?: number }>
    out.personalityTraits = arr.map((item) => {
      const label = typeof item.label === 'string' ? item.label.trim() : '综合性格'
      const value = typeof item.value === 'number' ? item.value : 70
      if (label.length > 12) {
        return { label: label.slice(0, 10) + '…', value }
      }
      return { label: label || '综合性格', value }
    })
  }

  // personalityLabels: 缺失或空时至少 1 项
  if (!Array.isArray(o.personalityLabels) || o.personalityLabels.length === 0) {
    out.personalityLabels = ['综合']
  }

  // palaceAnalysis: 字符串 → 五模块对象；或对象缺键时补全五模块（仅保证字段存在，不限制字数）
  const palaceModules = [
    { key: 'surfacePersonality' as const, title: '表层性格' },
    { key: 'deepDesire' as const, title: '深层欲望' },
    { key: 'thinkingPattern' as const, title: '思维模式' },
    { key: 'wealthLogic' as const, title: '财富逻辑' },
    { key: 'emotionalPattern' as const, title: '情感模式' }
  ]
  const shortPlaceholder = '根据命盘解析。'
  if (typeof o.palaceAnalysis === 'string') {
    const s = (o.palaceAnalysis as string).trim() || shortPlaceholder
    out.palaceAnalysis = palaceModules.reduce(
      (acc, { key, title }) => {
        acc[key] = { title, description: s }
        return acc
      },
      {} as Record<string, { title: string; description: string }>
    )
  } else if (o.palaceAnalysis && typeof o.palaceAnalysis === 'object') {
    const pa = o.palaceAnalysis as Record<string, unknown>
    out.palaceAnalysis = palaceModules.reduce(
      (acc, { key, title }) => {
        const mod = pa[key]
        const desc =
          mod && typeof mod === 'object' && typeof (mod as Record<string, unknown>).description === 'string'
            ? ((mod as Record<string, unknown>).description as string)
            : shortPlaceholder
        acc[key] = {
          title: (mod && typeof mod === 'object' && typeof (mod as Record<string, unknown>).title === 'string' ? (mod as Record<string, unknown>).title : title) as string,
          description: desc
        }
        return acc
      },
      {} as Record<string, { title: string; description: string }>
    )
  } else {
    out.palaceAnalysis = palaceModules.reduce(
      (acc, { key, title }) => {
        acc[key] = { title, description: shortPlaceholder }
        return acc
      },
      {} as Record<string, { title: string; description: string }>
    )
  }

  // coreAbility: 缺失时补占位，有内容则原样保留（不限制字数）
  if (typeof out.coreAbility !== 'string' || !out.coreAbility.trim()) {
    out.coreAbility = shortPlaceholder
  }

  // careerDestiny: 字符串 → { tracks, industries, position }
  if (typeof o.careerDestiny === 'string') {
    const s = (o.careerDestiny as string).trim()
    out.careerDestiny = { tracks: s, industries: s, position: s }
  }

  // lifeStages[].description: 不足 50 字时用占位补足
  if (Array.isArray(out.lifeStages)) {
    out.lifeStages = (out.lifeStages as Array<{ stage?: string; ageRange?: string; description?: string }>).map(
      (item) => ({
        ...item,
        description:
          typeof item.description === 'string' && item.description.length >= 50
            ? item.description
            : (item.description || '') + DEFAULT_DIMENSION_DESCRIPTION.slice(0, 50)
      })
    )
  }

  // yearlyFortuneChart: 非数组或结构不对时，用 yearlyDetails 或默认补全
  if (!Array.isArray(out.yearlyFortuneChart) || out.yearlyFortuneChart.length !== 3) {
    const years = ['2024', '2025', '2026']
    if (Array.isArray(o.yearlyDetails) && o.yearlyDetails.length >= 3) {
      out.yearlyFortuneChart = (o.yearlyDetails as Array<{ value?: number; year?: string }>).slice(0, 3).map((d, i) => ({
        year: years[i],
        value: typeof d.value === 'number' ? d.value : 60
      }))
    } else {
      out.yearlyFortuneChart = years.map((year) => ({ year, value: 60 }))
    }
  } else {
    const arr = out.yearlyFortuneChart as Array<{ year?: string; value?: number }>
    out.yearlyFortuneChart = arr.map((item, i) => ({
      year: typeof item.year === 'string' ? item.year : String(item.year ?? ['2024', '2025', '2026'][i]),
      value: typeof item.value === 'number' ? item.value : 60
    }))
  }

  // socialCard: 缺失时补占位（不限制字数）
  if (typeof out.socialCard !== 'string' || !out.socialCard.trim()) {
    out.socialCard = DEFAULT_DIMENSION_DESCRIPTION
  }

  return out
}

// === 基础类型 ===
const DimensionNameSchema = z.enum(['自我', '财富', '事业', '情感', '人脉', '家庭', '健康'])
const LevelSchema = z.enum(['S级', 'A级', 'B级', 'C级', 'D级'])
const LifeStageSchema = z.enum(['少年期', '青年期', '中年期', '晚年期'])

// === 子结构（只校验字段存在与类型，不限制字数/数值范围）===
const RadarDataItemSchema = z.object({
  name: DimensionNameSchema,
  value: z.number(),
  fullMark: z.number()
})

const DimensionDetailSchema = z.object({
  title: DimensionNameSchema,
  level: LevelSchema,
  description: z.string()
})

const PersonalityTraitSchema = z.object({
  label: z.string(),
  value: z.number()
})

const PalaceModuleSchema = z.object({
  title: z.string(),
  description: z.string()
})

const PalaceAnalysisSchema = z.object({
  surfacePersonality: PalaceModuleSchema,
  deepDesire: PalaceModuleSchema,
  thinkingPattern: PalaceModuleSchema,
  wealthLogic: PalaceModuleSchema,
  emotionalPattern: PalaceModuleSchema
})

const CareerDestinySchema = z.object({
  tracks: z.string(),
  industries: z.string(),
  position: z.string()
})

const LifeStageItemSchema = z.object({
  stage: LifeStageSchema,
  ageRange: z.string(),
  description: z.string()
})

const YearlyFortuneChartItemSchema = z.object({
  year: z.string(),
  value: z.number()
})

const YearlyDetailItemSchema = z.object({
  year: z.string(),
  stem: z.string(),
  level: z.string(),
  description: z.string(),
  details: z.string().optional(),
  strategy: z.string().optional(),
  isHighlight: z.boolean()
})

// === 主报告完整 Schema（仅校验字段映射与类型，不限制字数/数值范围）===
export const MainReportSchema = z.object({
  lifeScriptTitle: z.string(),
  lifeScriptDescription: z.string(),
  coreAbility: z.string(),
  coreAbilityTags: z.array(z.string()).min(1),
  baziDisplay: z.string(),
  radarData: z.array(RadarDataItemSchema).length(7, '必须包含 7 个维度'),
  dimensionDetails: z.array(DimensionDetailSchema).length(7, '必须包含 7 个维度'),
  personalityTraits: z.array(PersonalityTraitSchema).min(1),
  personalityLabels: z.array(z.string()).min(1),
  palaceAnalysis: PalaceAnalysisSchema,
  careerDestiny: CareerDestinySchema,
  lifeStages: z.array(LifeStageItemSchema).length(4, '必须包含 4 个阶段'),
  yearlyFortuneChart: z.array(YearlyFortuneChartItemSchema).length(3, '必须包含 3 年数据'),
  yearlyDetails: z.array(YearlyDetailItemSchema).length(3, '必须包含 3 年数据'),
  socialCard: z.string()
})

export type ValidatedMainReport = z.infer<typeof MainReportSchema>
