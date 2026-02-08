/**
 * 报告验证器
 *
 * 使用 Zod Schema 验证 LLM 输出的报告数据格式；
 * 提供 normalizeMainReportOutput 对 LLM 常见格式偏差做兼容转换后再校验；
 * 提供 extractJsonFromResponse 从 deepseek-reasoner 等带思考块的内容中提取 JSON。
 */

import { z } from 'zod'

/**
 * 清理 JSON 字符串中的常见问题（中文标点、未转义引号等）
 */
function cleanJsonString(jsonStr: string): string {
  let cleaned = jsonStr
  // 替换中文标点符号为英文标点符号
  cleaned = cleaned.replace(/，/g, ',')  // 中文逗号
  cleaned = cleaned.replace(/：/g, ':')  // 中文冒号
  cleaned = cleaned.replace(/；/g, ';')  // 中文分号
  cleaned = cleaned.replace(/（/g, '(')  // 中文左括号
  cleaned = cleaned.replace(/）/g, ')')  // 中文右括号
  cleaned = cleaned.replace(/【/g, '[')  // 中文左方括号
  cleaned = cleaned.replace(/】/g, ']')  // 中文右方括号
  cleaned = cleaned.replace(/"/g, '"')   // 中文左引号
  cleaned = cleaned.replace(/"/g, '"')   // 中文右引号
  cleaned = cleaned.replace(/'/g, "'")   // 中文左单引号
  cleaned = cleaned.replace(/'/g, "'")   // 中文右单引号
  
  // 修复常见的 JSON 格式问题：末尾多余的逗号
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')
  
  return cleaned
}

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
    if (block.startsWith('{')) return cleanJsonString(block)
  }
  // 4. 尝试找 { ... } 的边界（从第一个 { 到最后一个 }）
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    const extracted = text.slice(first, last + 1)
    return cleanJsonString(extracted)
  }
  throw new Error(
    'No JSON object found in LLM response. Response length: ' +
      text.length +
      (text.length > 0 ? ', starts with: ' + JSON.stringify(text.slice(0, 200)) : ' (empty).')
  )
}

/**
 * 尝试修复被截断的 JSON（LLM 输出在未写完时被截断）
 * 移除末尾不完整的 key（如 "本年核心攻略 无值），补全闭合括号
 */
export function repairTruncatedJson(jsonStr: string): string {
  let s = jsonStr.trim()
  // 末尾不完整的 key：以 "," 或 "{" 后跟空白和 "xxx" 或 "xxx 结尾
  const incompleteKeyMatch = s.match(/,\s*"[^"]*"?\s*$/)
  if (incompleteKeyMatch) {
    s = s.slice(0, s.length - incompleteKeyMatch[0].length) + '}'
  }
  // 补全未闭合的 { 和 [
  let openBraces = 0
  let openBrackets = 0
  let inString = false
  let escape = false
  let quote = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (escape) {
      escape = false
      continue
    }
    if (c === '\\' && inString) {
      escape = true
      continue
    }
    if ((c === '"' || c === "'") && !inString) {
      inString = true
      quote = c
      continue
    }
    if (c === quote && inString) {
      inString = false
      continue
    }
    if (!inString) {
      if (c === '{') openBraces++
      else if (c === '}') openBraces--
      else if (c === '[') openBrackets++
      else if (c === ']') openBrackets--
    }
  }
  s += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces))
  return s
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

// === 未来运势深度报告 ===
const FutureFortuneLevelStyleSchema = z.enum(['default', 'highlight', 'warn'])
const FutureFortuneVariantSchema = z.enum(['default', 'danger', 'highlight'])

const FutureFortuneAnchorSchema = z.object({
  人生点题: z.string(),
  时间坐标: z.string(),
  当前大运: z.string(),
  当前大运简评: z.string()
})

const FutureFortuneLastYearSchema = z.object({
  年份关键词: z.string(),
  深度体感与事件验证: z.string(),
  极有可能发生: z.array(z.string())
})

const FutureFortunePracticeSchema = z.object({
  流年信号: z.string(),
  行动指南: z.string(),
  策略补充: z.string().optional()
})

const FutureFortuneThisYearSchema = z.object({
  副标题: z.string(),
  年度总象标题: z.string(),
  警报文案: z.string(),
  财富实战: FutureFortunePracticeSchema,
  情感实战: FutureFortunePracticeSchema,
  事业实战: FutureFortunePracticeSchema
})

const FutureFortuneYearItemSchema = z.object({
  年份标题: z.string(),
  级别: z.string(),
  级别样式: FutureFortuneLevelStyleSchema,
  描述: z.string()
})

const FutureFortuneMonthItemSchema = z.object({
  season: z.string(),
  stems: z.string(),
  stars: z.string(),
  summary: z.string(),
  description: z.string(),
  variant: FutureFortuneVariantSchema
})

export const FutureFortuneReportSchema = z.object({
  命格锚点: FutureFortuneAnchorSchema,
  去年运势复盘: FutureFortuneLastYearSchema,
  本年核心攻略: FutureFortuneThisYearSchema,
  未来三年大势: z.array(FutureFortuneYearItemSchema).length(3, '必须包含 3 年'),
  流月战术节奏: z.array(FutureFortuneMonthItemSchema).length(4, '必须包含 4 季')
})

export type ValidatedFutureFortuneReport = z.infer<typeof FutureFortuneReportSchema>

const defaultAnchor = { 人生点题: '', 时间坐标: '', 当前大运: '', 当前大运简评: '' }
const defaultLastYear = { 年份关键词: '', 深度体感与事件验证: '', 极有可能发生: [] as string[] }
const defaultPractice = { 流年信号: '', 行动指南: '', 策略补充: '' }
const defaultThisYear = {
  副标题: '',
  年度总象标题: '',
  警报文案: '',
  财富实战: defaultPractice,
  情感实战: defaultPractice,
  事业实战: defaultPractice,
}
const defaultYearItem = { 年份标题: '', 级别: '', 级别样式: 'default' as const, 描述: '' }
const defaultMonthItem = {
  season: '',
  stems: '',
  stars: '',
  summary: '',
  description: '',
  variant: 'default' as const,
}

/** 兼容 LLM 可能输出的中文级别样式等，并补全缺失必填字段避免校验失败 */
export function normalizeFutureFortuneOutput(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  const lastYearRaw = typeof o.去年运势复盘 === 'object' && o.去年运势复盘 !== null ? (o.去年运势复盘 as Record<string, unknown>) : {}
  const lastYearArr = Array.isArray(lastYearRaw.极有可能发生)
    ? (lastYearRaw.极有可能发生 as string[])
    : []
  const out: Record<string, unknown> = {
    命格锚点: { ...defaultAnchor, ...(typeof o.命格锚点 === 'object' && o.命格锚点 !== null ? o.命格锚点 : {}) },
    去年运势复盘: { ...defaultLastYear, ...lastYearRaw, 极有可能发生: lastYearArr },
    本年核心攻略: { ...defaultThisYear, ...(typeof o.本年核心攻略 === 'object' && o.本年核心攻略 !== null ? o.本年核心攻略 : {}) },
    未来三年大势: Array.isArray(o.未来三年大势) ? o.未来三年大势 : [],
    流月战术节奏: Array.isArray(o.流月战术节奏) ? o.流月战术节奏 : [],
  }

  const levelStyleMap: Record<string, 'default' | 'highlight' | 'warn'> = {
    default: 'default',
    highlight: 'highlight',
    warn: 'warn',
    默认: 'default',
    高亮: 'highlight',
    警示: 'warn'
  }
  const variantMap: Record<string, 'default' | 'danger' | 'highlight'> = {
    default: 'default',
    danger: 'danger',
    highlight: 'highlight',
    默认: 'default',
    危险: 'danger',
    高亮: 'highlight'
  }

  const threeYears = Array.isArray(out.未来三年大势) ? (out.未来三年大势 as Array<Record<string, unknown>>) : []
  const threeMapped = threeYears.slice(0, 3).map((item) => ({
    ...defaultYearItem,
    ...(typeof item === 'object' && item !== null ? item : {}),
    级别样式: levelStyleMap[String((item as Record<string, unknown>)?.级别样式 ?? '')] ?? 'default',
  }))
  while (threeMapped.length < 3) threeMapped.push({ ...defaultYearItem })
  out.未来三年大势 = threeMapped

  const fourSeasons = Array.isArray(out.流月战术节奏) ? (out.流月战术节奏 as Array<Record<string, unknown>>) : []
  const fourMapped = fourSeasons.slice(0, 4).map((item) => ({
    ...defaultMonthItem,
    ...(typeof item === 'object' && item !== null ? item : {}),
    variant: variantMap[String((item as Record<string, unknown>)?.variant ?? '')] ?? 'default',
  }))
  while (fourMapped.length < 4) fourMapped.push({ ...defaultMonthItem })
  out.流月战术节奏 = fourMapped

  return out
}

// === 仕途探索深度报告 ===
const CareerPathTrackASchema = z.object({
  标签: z.string(),
  行业领域: z.string(),
  上限高度: z.string(),
  发展路径: z.string(),
  理由: z.string(),
})
const CareerPathTrackBSchema = z.object({
  标签: z.string(),
  行业领域: z.string(),
  简评: z.string(),
})
const CareerPathModeSchema = z.object({
  打工胜率: z.number(),
  创业胜率: z.number(),
  角色定位: z.string(),
  深度解析: z.string(),
})
const CareerPathStrategySchema = z.object({
  副标题: z.string().optional(),
  最强赛道A: CareerPathTrackASchema,
  次选赛道B: CareerPathTrackBSchema,
  模式选择: CareerPathModeSchema,
})
const CareerPathLuckItemSchema = z.object({
  区间: z.string(),
  岁数: z.string(),
  干支: z.string(),
  宫位: z.string(),
  事业总评分: z.number(),
  趋势波动指数: z.array(z.number()).length(10, '必须 10 个数字'),
  核心策略: z.string(),
  关键解读: z.string(),
})
const CareerPathYearFocusSchema = z.object({
  副标题: z.string().optional(),
  年度关键词: z.string(),
  核心战略: z.string(),
  行动指南: z.array(z.string()),
})
const CareerPathMonthlySchema = z.object({
  事业能量流: z.array(z.number()).length(12, '必须 12 个月'),
  挑战关键流月: z.array(z.string()),
  高能关键流月: z.array(z.string()),
})
const CareerPathWarningSchema = z.object({
  可能出现的动荡事件: z.array(z.string()),
  回避与止损方案: z.string(),
})
const CareerPathHelpSchema = z.object({
  核心助力来源: z.string(),
  增运建议: z.array(z.string()),
})
const CareerPathSummarySchema = z.object({
  正文: z.string(),
  评分: z.number(),
})

export const CareerPathReportSchema = z.object({
  长期战略: CareerPathStrategySchema,
  大运列表: z.array(CareerPathLuckItemSchema).length(3, '必须包含 3 个大运'),
  年度事业重心: CareerPathYearFocusSchema,
  流月走势: CareerPathMonthlySchema,
  动荡预警: CareerPathWarningSchema,
  助力分析: CareerPathHelpSchema,
  事业年度总结: CareerPathSummarySchema,
})

export type ValidatedCareerPathReport = z.infer<typeof CareerPathReportSchema>

const defaultTrackA = { 标签: '', 行业领域: '', 上限高度: '', 发展路径: '', 理由: '' }
const defaultTrackB = { 标签: '', 行业领域: '', 简评: '' }
const defaultMode = { 打工胜率: 50, 创业胜率: 50, 角色定位: '', 深度解析: '' }
const defaultLuckItem = {
  区间: '',
  岁数: '',
  干支: '',
  宫位: '',
  事业总评分: 0,
  趋势波动指数: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  核心策略: '',
  关键解读: '',
}
const defaultYearFocus = { 年度关键词: '', 核心战略: '', 行动指南: [] as string[] }
const defaultMonthly = {
  事业能量流: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  挑战关键流月: [] as string[],
  高能关键流月: [] as string[],
}
const defaultWarning = { 可能出现的动荡事件: [] as string[], 回避与止损方案: '' }
const defaultHelp = { 核心助力来源: '', 增运建议: [] as string[] }
const defaultSummary = { 正文: '', 评分: 0 }

/** 补全仕途探索缺失字段与数组长度，避免校验失败 */
export function normalizeCareerPathOutput(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  const strategyRaw = typeof o.长期战略 === 'object' && o.长期战略 !== null ? (o.长期战略 as Record<string, unknown>) : {}
  const trackARaw = typeof strategyRaw.最强赛道A === 'object' && strategyRaw.最强赛道A !== null ? strategyRaw.最强赛道A as Record<string, unknown> : {}
  const trackBRaw = typeof strategyRaw.次选赛道B === 'object' && strategyRaw.次选赛道B !== null ? strategyRaw.次选赛道B as Record<string, unknown> : {}
  const modeRaw = typeof strategyRaw.模式选择 === 'object' && strategyRaw.模式选择 !== null ? strategyRaw.模式选择 as Record<string, unknown> : {}
  const out: Record<string, unknown> = {
    长期战略: {
      副标题: strategyRaw.副标题 ?? '',
      最强赛道A: { ...defaultTrackA, ...trackARaw },
      次选赛道B: { ...defaultTrackB, ...trackBRaw },
      模式选择: {
        打工胜率: typeof modeRaw.打工胜率 === 'number' ? modeRaw.打工胜率 : 50,
        创业胜率: typeof modeRaw.创业胜率 === 'number' ? modeRaw.创业胜率 : 50,
        角色定位: modeRaw.角色定位 ?? '',
        深度解析: modeRaw.深度解析 ?? '',
      },
    },
    大运列表: Array.isArray(o.大运列表) ? o.大运列表 : [],
    年度事业重心: { ...defaultYearFocus, ...(typeof o.年度事业重心 === 'object' && o.年度事业重心 !== null ? o.年度事业重心 : {}) },
    流月走势: { ...defaultMonthly, ...(typeof o.流月走势 === 'object' && o.流月走势 !== null ? o.流月走势 : {}) },
    动荡预警: { ...defaultWarning, ...(typeof o.动荡预警 === 'object' && o.动荡预警 !== null ? o.动荡预警 : {}) },
    助力分析: { ...defaultHelp, ...(typeof o.助力分析 === 'object' && o.助力分析 !== null ? o.助力分析 : {}) },
    事业年度总结: { ...defaultSummary, ...(typeof o.事业年度总结 === 'object' && o.事业年度总结 !== null ? o.事业年度总结 : {}) },
  }

  const yearFocusOut = out.年度事业重心 as Record<string, unknown>
  if (!Array.isArray(yearFocusOut.行动指南)) yearFocusOut.行动指南 = []

  const monthlyOut = out.流月走势 as Record<string, unknown>
  if (!Array.isArray(monthlyOut.事业能量流) || monthlyOut.事业能量流.length !== 12) {
    const arr = Array.isArray(monthlyOut.事业能量流) ? (monthlyOut.事业能量流 as number[]).slice(0, 12) : []
    while (arr.length < 12) arr.push(5)
    monthlyOut.事业能量流 = arr
  }
  if (!Array.isArray(monthlyOut.挑战关键流月)) monthlyOut.挑战关键流月 = []
  if (!Array.isArray(monthlyOut.高能关键流月)) monthlyOut.高能关键流月 = []

  const warningOut = out.动荡预警 as Record<string, unknown>
  if (!Array.isArray(warningOut.可能出现的动荡事件)) warningOut.可能出现的动荡事件 = []

  const helpOut = out.助力分析 as Record<string, unknown>
  if (!Array.isArray(helpOut.增运建议)) helpOut.增运建议 = []

  const luckList = Array.isArray(out.大运列表) ? (out.大运列表 as Array<Record<string, unknown>>) : []
  const luckMapped = luckList.slice(0, 3).map((item) => {
    const arr = Array.isArray(item.趋势波动指数) ? (item.趋势波动指数 as number[]).slice(0, 10) : []
    while (arr.length < 10) arr.push(5)
    return {
      ...defaultLuckItem,
      ...(typeof item === 'object' && item !== null ? item : {}),
      趋势波动指数: arr,
    }
  })
  while (luckMapped.length < 3) luckMapped.push({ ...defaultLuckItem })
  out.大运列表 = luckMapped

  return out
}

// === 财富之路深度报告 ===
const WealthRoadSummarySchema = z.object({
  财富能量级: z.string(),
  财富能量级简评: z.string(),
  核心驱动引擎: z.string(),
})
const WealthRoadAssetItemSchema = z.object({
  名称: z.string(),
  推荐指数: z.number(),
  建议: z.string(),
  逻辑支撑: z.string(),
  操作策略: z.string().optional(),
})
const WealthRoadInvestSchema = z.object({
  投资风格评级: z.string(),
  投资风格说明: z.string(),
  适合的资产种类: z.array(WealthRoadAssetItemSchema),
  避坑指南: z.string(),
})
const WealthRoadLuckItemSchema = z.object({
  区间: z.string(),
  岁数: z.string(),
  干支: z.string(),
  宫位: z.string(),
  财富总评分: z.number(),
  趋势波动指数: z.array(z.number()).min(5, '至少 5 个数字').max(10, '最多 10 个数字'),
  核心策略: z.string(),
  关键解读: z.string(),
})
const WealthRoadYearSchema = z.object({
  求财重心: z.string(),
  财运能量流: z.array(z.number()).length(12, '必须 12 个月'),
  总体趋势: z.string(),
  进财爆发月: z.array(z.string()).length(2, '必须 2 项'),
  破财高危月: z.array(z.string()).length(2, '必须 2 项'),
})
const WealthRoadRiskSchema = z.object({
  最大的耗财黑洞: z.string(),
  二零二六特定风险: z.string(),
  止损方案: z.array(z.string()),
})
const WealthRoadFinalSchema = z.object({
  正文: z.string(),
  现金流评分: z.number(),
  资产置换机遇评分: z.number(),
  最终建议: z.string(),
})

export const WealthRoadReportSchema = z.object({
  财富格局总定调: WealthRoadSummarySchema,
  投资理财: WealthRoadInvestSchema,
  大运财富列表: z.array(WealthRoadLuckItemSchema).length(3, '必须包含 3 个大运'),
  年度财运推演: WealthRoadYearSchema,
  财富漏洞与动荡: WealthRoadRiskSchema,
  财富年度总结: WealthRoadFinalSchema,
})

export type ValidatedWealthRoadReport = z.infer<typeof WealthRoadReportSchema>

const defaultWealthSummary = { 财富能量级: '', 财富能量级简评: '', 核心驱动引擎: '' }
const defaultWealthAsset = { 名称: '', 推荐指数: 0, 建议: '', 逻辑支撑: '', 操作策略: '' }
const defaultWealthLuck = {
  区间: '',
  岁数: '',
  干支: '',
  宫位: '',
  财富总评分: 0,
  趋势波动指数: [5, 5, 5, 5, 5],
  核心策略: '',
  关键解读: '',
}
const defaultWealthYear = {
  求财重心: '',
  财运能量流: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  总体趋势: '',
  进财爆发月: ['', ''],
  破财高危月: ['', ''],
}
const defaultWealthRisk = { 最大的耗财黑洞: '', 二零二六特定风险: '', 止损方案: [] as string[] }
const defaultWealthFinal = { 正文: '', 现金流评分: 0, 资产置换机遇评分: 0, 最终建议: '' }

/** 补全财富之路缺失字段与数组长度，避免校验失败 */
export function normalizeWealthRoadOutput(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  const investRaw = typeof o.投资理财 === 'object' && o.投资理财 !== null ? (o.投资理财 as Record<string, unknown>) : {}
  const assets = Array.isArray(investRaw.适合的资产种类) ? investRaw.适合的资产种类 as Array<Record<string, unknown>> : []
  const out: Record<string, unknown> = {
    财富格局总定调: { ...defaultWealthSummary, ...(typeof o.财富格局总定调 === 'object' && o.财富格局总定调 !== null ? o.财富格局总定调 : {}) },
    投资理财: {
      投资风格评级: investRaw.投资风格评级 ?? '',
      投资风格说明: investRaw.投资风格说明 ?? '',
      适合的资产种类: assets.map((a) => ({
        名称: a.名称 ?? '',
        推荐指数: typeof a.推荐指数 === 'number' ? a.推荐指数 : 0,
        建议: a.建议 ?? '',
        逻辑支撑: a.逻辑支撑 ?? '',
        操作策略: a.操作策略 ?? '',
      })),
      避坑指南: investRaw.避坑指南 ?? '',
    },
    大运财富列表: Array.isArray(o.大运财富列表) ? o.大运财富列表 : [],
    年度财运推演: { ...defaultWealthYear, ...(typeof o.年度财运推演 === 'object' && o.年度财运推演 !== null ? o.年度财运推演 : {}) },
    财富漏洞与动荡: { ...defaultWealthRisk, ...(typeof o.财富漏洞与动荡 === 'object' && o.财富漏洞与动荡 !== null ? o.财富漏洞与动荡 : {}) },
    财富年度总结: { ...defaultWealthFinal, ...(typeof o.财富年度总结 === 'object' && o.财富年度总结 !== null ? o.财富年度总结 : {}) },
  }

  const yearOut = out.年度财运推演 as Record<string, unknown>
  if (!Array.isArray(yearOut.财运能量流) || (yearOut.财运能量流 as number[]).length !== 12) {
    const arr = Array.isArray(yearOut.财运能量流) ? (yearOut.财运能量流 as number[]).slice(0, 12) : []
    while (arr.length < 12) arr.push(5)
    yearOut.财运能量流 = arr
  }
  if (!Array.isArray(yearOut.进财爆发月) || (yearOut.进财爆发月 as string[]).length < 2) {
    const a = Array.isArray(yearOut.进财爆发月) ? (yearOut.进财爆发月 as string[]).slice(0, 2) : []
    while (a.length < 2) a.push('')
    yearOut.进财爆发月 = a
  }
  if (!Array.isArray(yearOut.破财高危月) || (yearOut.破财高危月 as string[]).length < 2) {
    const b = Array.isArray(yearOut.破财高危月) ? (yearOut.破财高危月 as string[]).slice(0, 2) : []
    while (b.length < 2) b.push('')
    yearOut.破财高危月 = b
  }

  const riskOut = out.财富漏洞与动荡 as Record<string, unknown>
  if (!Array.isArray(riskOut.止损方案)) riskOut.止损方案 = []

  const luckList = Array.isArray(out.大运财富列表) ? (out.大运财富列表 as Array<Record<string, unknown>>) : []
  const luckMapped = luckList.slice(0, 3).map((item) => {
    const arr = Array.isArray(item.趋势波动指数) ? (item.趋势波动指数 as number[]).slice(0, 10) : []
    while (arr.length < 5) arr.push(5)
    const trimmed = arr.slice(0, 10)
    return {
      ...defaultWealthLuck,
      ...(typeof item === 'object' && item !== null ? item : {}),
      趋势波动指数: trimmed,
    }
  })
  while (luckMapped.length < 3) luckMapped.push({ ...defaultWealthLuck })
  out.大运财富列表 = luckMapped

  return out
}

// === 爱情姻缘深度报告 ===
const LoveMarriageCoreSchema = z.object({
  命理解析: z.string(),
  博弈地位: z.string(),
  博弈地位简评: z.string(),
  情感死穴: z.array(z.string()),
})
const LoveMarriageLandmarkSchema = z.object({
  名称: z.string(),
  五行标签: z.string(),
  简注: z.string(),
})
const LoveMarriageSoulmateSchema = z.object({
  外貌气质: z.string(),
  职业圈层: z.string(),
  相遇高频地标: z.array(LoveMarriageLandmarkSchema),
  地标前言: z.string().optional(),
  互动剧本: z.string(),
  互动剧本说明: z.string(),
})
const LoveMarriageLuckItemSchema = z.object({
  区间: z.string(),
  岁数: z.string(),
  干支: z.string(),
  幸福指数: z.number(),
  情感状态关键词: z.string(),
  关键解读: z.string(),
})
const LoveMarriageSingleSchema = z.object({
  脱单概率: z.string(),
  命理依据: z.string(),
  艳遇坐标: z.string(),
  避坑警示: z.string(),
})
const LoveMarriagePartnerSchema = z.object({
  第三者入侵指数: z.number(),
  命理依据: z.string(),
  潜在危险来源: z.string(),
  维稳手段: z.array(z.string()),
})
const LoveMarriageYearSchema = z.object({
  流年天干: z.string(),
  流年地支: z.string(),
  核心象义: z.string(),
  单身: LoveMarriageSingleSchema,
  有伴侣: LoveMarriagePartnerSchema,
})
const LoveMarriageMonthSchema = z.object({
  激情燃烧月: z.object({ 月份: z.string(), 说明: z.string() }),
  信任危机月: z.object({ 月份: z.string(), 说明: z.string() }),
})
const LoveMarriageTimeSchema = z.object({
  容易结婚年份: z.array(z.object({ 年份: z.string(), 说明: z.string() })),
  容易分手年份: z.array(z.object({ 年份: z.string(), 说明: z.string() })),
})
const LoveMarriageSummarySchema = z.object({
  正文: z.string(),
  说明: z.string(),
  军师建议: z.string(),
})

export const LoveMarriageReportSchema = z.object({
  核心情感模式: LoveMarriageCoreSchema,
  正缘画像: LoveMarriageSoulmateSchema,
  大运情感列表: z.array(LoveMarriageLuckItemSchema).length(3, '必须包含 3 个大运'),
  年度情感推演: LoveMarriageYearSchema,
  流月情感: LoveMarriageMonthSchema,
  关键时间点: LoveMarriageTimeSchema,
  情感年度总结: LoveMarriageSummarySchema,
})

export type ValidatedLoveMarriageReport = z.infer<typeof LoveMarriageReportSchema>

const defaultLoveCore = { 命理解析: '', 博弈地位: '', 博弈地位简评: '', 情感死穴: [] as string[] }
const defaultLoveLandmark = { 名称: '', 五行标签: '', 简注: '' }
const defaultLoveSoulmate = {
  外貌气质: '',
  职业圈层: '',
  相遇高频地标: [] as Array<{ 名称: string; 五行标签: string; 简注: string }>,
  地标前言: '',
  互动剧本: '',
  互动剧本说明: '',
}
const defaultLoveLuck = {
  区间: '',
  岁数: '',
  干支: '',
  幸福指数: 0,
  情感状态关键词: '',
  关键解读: '',
}
const defaultLoveSingle = { 脱单概率: '', 命理依据: '', 艳遇坐标: '', 避坑警示: '' }
const defaultLovePartner = { 第三者入侵指数: 0, 命理依据: '', 潜在危险来源: '', 维稳手段: [] as string[] }
const defaultLoveYear = {
  流年天干: '',
  流年地支: '',
  核心象义: '',
  单身: defaultLoveSingle,
  有伴侣: defaultLovePartner,
}
const defaultLoveMonth = {
  激情燃烧月: { 月份: '', 说明: '' },
  信任危机月: { 月份: '', 说明: '' },
}
const defaultLoveTime = { 容易结婚年份: [] as Array<{ 年份: string; 说明: string }>, 容易分手年份: [] as Array<{ 年份: string; 说明: string }> }
const defaultLoveSummary = { 正文: '', 说明: '', 军师建议: '' }

/** 补全爱情姻缘缺失字段与数组长度，避免校验失败 */
export function normalizeLoveMarriageOutput(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  const coreRaw = typeof o.核心情感模式 === 'object' && o.核心情感模式 !== null ? (o.核心情感模式 as Record<string, unknown>) : {}
  const soulRaw = typeof o.正缘画像 === 'object' && o.正缘画像 !== null ? (o.正缘画像 as Record<string, unknown>) : {}
  const landmarks = Array.isArray(soulRaw.相遇高频地标) ? soulRaw.相遇高频地标 as Array<Record<string, unknown>> : []
  const yearRaw = typeof o.年度情感推演 === 'object' && o.年度情感推演 !== null ? (o.年度情感推演 as Record<string, unknown>) : {}
  const singleRaw = typeof yearRaw.单身 === 'object' && yearRaw.单身 !== null ? (yearRaw.单身 as Record<string, unknown>) : {}
  const partnerRaw = typeof yearRaw.有伴侣 === 'object' && yearRaw.有伴侣 !== null ? (yearRaw.有伴侣 as Record<string, unknown>) : {}
  const out: Record<string, unknown> = {
    核心情感模式: {
      ...defaultLoveCore,
      ...coreRaw,
      情感死穴: Array.isArray(coreRaw.情感死穴) ? coreRaw.情感死穴 : [],
    },
    正缘画像: {
      外貌气质: soulRaw.外貌气质 ?? '',
      职业圈层: soulRaw.职业圈层 ?? '',
      相遇高频地标: landmarks.map((l) => ({ 名称: l.名称 ?? '', 五行标签: l.五行标签 ?? '', 简注: l.简注 ?? '' })),
      地标前言: soulRaw.地标前言 ?? '',
      互动剧本: soulRaw.互动剧本 ?? '',
      互动剧本说明: soulRaw.互动剧本说明 ?? '',
    },
    大运情感列表: Array.isArray(o.大运情感列表) ? o.大运情感列表 : [],
    年度情感推演: {
      流年天干: yearRaw.流年天干 ?? '',
      流年地支: yearRaw.流年地支 ?? '',
      核心象义: yearRaw.核心象义 ?? '',
      单身: { ...defaultLoveSingle, ...singleRaw },
      有伴侣: {
        ...defaultLovePartner,
        ...partnerRaw,
        维稳手段: Array.isArray(partnerRaw.维稳手段) ? partnerRaw.维稳手段 : [],
      },
    },
    流月情感: { ...defaultLoveMonth, ...(typeof o.流月情感 === 'object' && o.流月情感 !== null ? o.流月情感 : {}) },
    关键时间点: { ...defaultLoveTime, ...(typeof o.关键时间点 === 'object' && o.关键时间点 !== null ? o.关键时间点 : {}) },
    情感年度总结: { ...defaultLoveSummary, ...(typeof o.情感年度总结 === 'object' && o.情感年度总结 !== null ? o.情感年度总结 : {}) },
  }

  const timeOut = out.关键时间点 as Record<string, unknown>
  if (!Array.isArray(timeOut.容易结婚年份)) timeOut.容易结婚年份 = []
  if (!Array.isArray(timeOut.容易分手年份)) timeOut.容易分手年份 = []

  const luckList = Array.isArray(out.大运情感列表) ? (out.大运情感列表 as Array<Record<string, unknown>>) : []
  const luckMapped = luckList.slice(0, 3).map((item) => ({
    ...defaultLoveLuck,
    ...(typeof item === 'object' && item !== null ? item : {}),
  }))
  while (luckMapped.length < 3) luckMapped.push({ ...defaultLoveLuck })
  out.大运情感列表 = luckMapped

  const monthOut = out.流月情感 as Record<string, unknown>
  const burn = monthOut.激情燃烧月 as Record<string, unknown> | undefined
  const crisis = monthOut.信任危机月 as Record<string, unknown> | undefined
  if (!burn || typeof burn !== 'object') monthOut.激情燃烧月 = { 月份: '', 说明: '' }
  else {
    if (typeof burn.月份 !== 'string') (monthOut.激情燃烧月 as Record<string, unknown>).月份 = ''
    if (typeof (monthOut.激情燃烧月 as Record<string, unknown>).说明 !== 'string') (monthOut.激情燃烧月 as Record<string, unknown>).说明 = ''
  }
  if (!crisis || typeof crisis !== 'object') monthOut.信任危机月 = { 月份: '', 说明: '' }
  else {
    if (typeof crisis.月份 !== 'string') (monthOut.信任危机月 as Record<string, unknown>).月份 = ''
    if (typeof (monthOut.信任危机月 as Record<string, unknown>).说明 !== 'string') (monthOut.信任危机月 as Record<string, unknown>).说明 = ''
  }

  return out
}
