/**
 * 主报告格式验证脚本
 * 
 * 功能：
 * 1. 使用 Zod 验证 LLM 输出是否符合标准化方案
 * 2. 对比 LLM 输出与示例 JSON 的结构差异
 * 3. 生成详细的验证报告
 * 
 * 运行方式: npx tsx scripts/validate-report-format.ts
 */

import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'

// ==================== Zod Schema 定义（标准化方案） ====================

const DimensionNameSchema = z.enum(['自我', '财富', '事业', '情感', '人脉', '家庭', '健康'])
const DimensionLevelSchema = z.enum(['S级', 'A级', 'B级', 'C级', 'D级'])
const LifeStageSchema = z.enum(['少年期', '青年期', '中年期', '晚年期'])

const RadarDataItemSchema = z.object({
  name: DimensionNameSchema,
  value: z.number().min(0).max(100),
  fullMark: z.literal(100)
})

const DimensionDetailSchema = z.object({
  title: DimensionNameSchema,
  level: DimensionLevelSchema,
  description: z.string().min(50).max(200)
})

const PersonalityTraitSchema = z.object({
  label: z.string().min(1),
  value: z.number().min(0).max(100)
})

const PalaceModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(100).max(300)
})

const PalaceAnalysisSchema = z.object({
  surfacePersonality: PalaceModuleSchema,
  deepDesire: PalaceModuleSchema,
  thinkingPattern: PalaceModuleSchema,
  wealthLogic: PalaceModuleSchema,
  emotionalPattern: PalaceModuleSchema
})

const CareerDestinySchema = z.object({
  tracks: z.string().min(1),
  industries: z.string().min(1),
  position: z.string().min(1)
})

const LifeStageItemSchema = z.object({
  stage: LifeStageSchema,
  ageRange: z.string().min(1),
  description: z.string().min(50).max(200)
})

const YearlyFortuneChartItemSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  value: z.number().min(0).max(100)
})

const YearlyDetailItemSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  stem: z.string().min(1),
  level: z.string().min(1),
  description: z.string().min(1),
  details: z.string().optional(),
  strategy: z.string().optional(),
  isHighlight: z.boolean()
}).refine(
  (data) => {
    // 如果 isHighlight=true，则 details 和 strategy 必须存在
    if (data.isHighlight) {
      return data.details !== undefined && data.strategy !== undefined
    }
    return true
  },
  { message: 'isHighlight=true 时，details 和 strategy 必须存在' }
)

// 主报告 Schema
const MainReportSchema = z.object({
  lifeScriptTitle: z.string().regex(/^.{4}·.{4}$/, '格式必须为 四字·四字'),
  lifeScriptDescription: z.string().min(30).max(200),
  coreAbility: z.string().min(50).max(200),
  coreAbilityTags: z.array(z.string().regex(/^#.+$/)).min(2).max(3),
  baziDisplay: z.string().min(1),
  radarData: z.array(RadarDataItemSchema).length(7),
  dimensionDetails: z.array(DimensionDetailSchema).length(7),
  personalityTraits: z.array(PersonalityTraitSchema).min(4).max(6),
  personalityLabels: z.array(z.string()).min(4).max(6),
  palaceAnalysis: PalaceAnalysisSchema,
  careerDestiny: CareerDestinySchema,
  lifeStages: z.array(LifeStageItemSchema).length(4),
  yearlyFortuneChart: z.array(YearlyFortuneChartItemSchema).length(3),
  yearlyDetails: z.array(YearlyDetailItemSchema).length(3),
  socialCard: z.string().min(100).max(500)
})

// ==================== 验证工具函数 ====================

interface ValidationResult {
  field: string
  status: 'pass' | 'fail' | 'warning'
  expected: string
  actual: string
  message?: string
}

function validateField(
  field: string, 
  expected: string, 
  actual: string, 
  condition: boolean,
  message?: string
): ValidationResult {
  return {
    field,
    status: condition ? 'pass' : 'fail',
    expected,
    actual,
    message
  }
}

function compareStructure(llmOutput: Record<string, unknown>, example: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = []
  
  // 检查所有必须字段
  const requiredFields = [
    'lifeScriptTitle', 'lifeScriptDescription', 'coreAbility', 'coreAbilityTags',
    'baziDisplay', 'radarData', 'dimensionDetails', 'personalityTraits',
    'personalityLabels', 'palaceAnalysis', 'careerDestiny', 'lifeStages',
    'yearlyFortuneChart', 'yearlyDetails', 'socialCard'
  ]
  
  for (const field of requiredFields) {
    const hasField = field in llmOutput
    results.push(validateField(
      `必须字段: ${field}`,
      '存在',
      hasField ? '存在' : '缺失',
      hasField
    ))
  }
  
  return results
}

function validateArrayLengths(llmOutput: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = []
  
  // 固定长度数组
  const fixedLengthArrays = [
    { field: 'radarData', expected: 7 },
    { field: 'dimensionDetails', expected: 7 },
    { field: 'lifeStages', expected: 4 },
    { field: 'yearlyFortuneChart', expected: 3 },
    { field: 'yearlyDetails', expected: 3 }
  ]
  
  for (const { field, expected } of fixedLengthArrays) {
    const arr = llmOutput[field] as unknown[]
    const actual = Array.isArray(arr) ? arr.length : 0
    results.push(validateField(
      `数组长度: ${field}`,
      `固定 ${expected} 个`,
      `${actual} 个`,
      actual === expected
    ))
  }
  
  // 范围长度数组
  const rangeLengthArrays = [
    { field: 'coreAbilityTags', min: 2, max: 3 },
    { field: 'personalityTraits', min: 4, max: 6 },
    { field: 'personalityLabels', min: 4, max: 6 }
  ]
  
  for (const { field, min, max } of rangeLengthArrays) {
    const arr = llmOutput[field] as unknown[]
    const actual = Array.isArray(arr) ? arr.length : 0
    results.push(validateField(
      `数组长度: ${field}`,
      `${min}-${max} 个`,
      `${actual} 个`,
      actual >= min && actual <= max
    ))
  }
  
  return results
}

function validateEnumValues(llmOutput: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = []
  
  // 验证 radarData 的 name 枚举
  const radarData = llmOutput.radarData as { name: string }[]
  if (Array.isArray(radarData)) {
    const validNames = ['自我', '财富', '事业', '情感', '人脉', '家庭', '健康']
    const actualNames = radarData.map(item => item.name)
    const allValid = actualNames.every(name => validNames.includes(name))
    results.push(validateField(
      'radarData[].name 枚举',
      validNames.join(', '),
      actualNames.join(', '),
      allValid
    ))
  }
  
  // 验证 dimensionDetails 的 level 枚举
  const dimensionDetails = llmOutput.dimensionDetails as { level: string }[]
  if (Array.isArray(dimensionDetails)) {
    const validLevels = ['S级', 'A级', 'B级', 'C级', 'D级']
    const actualLevels = dimensionDetails.map(item => item.level)
    const allValid = actualLevels.every(level => validLevels.includes(level))
    results.push(validateField(
      'dimensionDetails[].level 枚举',
      validLevels.join(', '),
      actualLevels.join(', '),
      allValid
    ))
  }
  
  // 验证 lifeStages 的 stage 枚举
  const lifeStages = llmOutput.lifeStages as { stage: string }[]
  if (Array.isArray(lifeStages)) {
    const validStages = ['少年期', '青年期', '中年期', '晚年期']
    const actualStages = lifeStages.map(item => item.stage)
    const allValid = actualStages.every(stage => validStages.includes(stage))
    results.push(validateField(
      'lifeStages[].stage 枚举',
      validStages.join(', '),
      actualStages.join(', '),
      allValid
    ))
  }
  
  return results
}

function validateObjectStructures(llmOutput: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = []
  
  // 验证 palaceAnalysis 结构
  const palaceAnalysis = llmOutput.palaceAnalysis as Record<string, unknown>
  if (palaceAnalysis && typeof palaceAnalysis === 'object') {
    const requiredKeys = ['surfacePersonality', 'deepDesire', 'thinkingPattern', 'wealthLogic', 'emotionalPattern']
    const actualKeys = Object.keys(palaceAnalysis)
    const hasAllKeys = requiredKeys.every(key => actualKeys.includes(key))
    results.push(validateField(
      'palaceAnalysis 对象结构',
      requiredKeys.join(', '),
      actualKeys.join(', '),
      hasAllKeys
    ))
    
    // 检查不是数组
    results.push(validateField(
      'palaceAnalysis 类型',
      '对象（非数组）',
      Array.isArray(palaceAnalysis) ? '数组' : '对象',
      !Array.isArray(palaceAnalysis)
    ))
  }
  
  // 验证 careerDestiny 结构
  const careerDestiny = llmOutput.careerDestiny as Record<string, unknown>
  if (careerDestiny && typeof careerDestiny === 'object') {
    const requiredKeys = ['tracks', 'industries', 'position']
    const actualKeys = Object.keys(careerDestiny)
    const hasAllKeys = requiredKeys.every(key => actualKeys.includes(key))
    results.push(validateField(
      'careerDestiny 对象结构',
      requiredKeys.join(', '),
      actualKeys.join(', '),
      hasAllKeys
    ))
  }
  
  return results
}

function validateStringFormats(llmOutput: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = []
  
  // 验证 lifeScriptTitle 格式
  const lifeScriptTitle = llmOutput.lifeScriptTitle as string
  if (typeof lifeScriptTitle === 'string') {
    const pattern = /^.{4}·.{4}$/
    results.push(validateField(
      'lifeScriptTitle 格式',
      '四字·四字',
      lifeScriptTitle,
      pattern.test(lifeScriptTitle)
    ))
  }
  
  // 验证 coreAbilityTags 格式
  const coreAbilityTags = llmOutput.coreAbilityTags as string[]
  if (Array.isArray(coreAbilityTags)) {
    const allStartWithHash = coreAbilityTags.every(tag => tag.startsWith('#'))
    results.push(validateField(
      'coreAbilityTags 格式',
      '全部以 # 开头',
      coreAbilityTags.join(', '),
      allStartWithHash
    ))
  }
  
  return results
}

function validateIsHighlightRule(llmOutput: Record<string, unknown>): ValidationResult[] {
  const results: ValidationResult[] = []
  
  const yearlyDetails = llmOutput.yearlyDetails as { isHighlight: boolean; details?: string; strategy?: string }[]
  if (Array.isArray(yearlyDetails)) {
    for (const item of yearlyDetails) {
      if (item.isHighlight) {
        const hasDetails = !!item.details
        const hasStrategy = !!item.strategy
        results.push(validateField(
          `yearlyDetails[${item.isHighlight ? 'highlight' : 'normal'}].isHighlight 规则`,
          'isHighlight=true 时必须有 details 和 strategy',
          `details: ${hasDetails ? '有' : '无'}, strategy: ${hasStrategy ? '有' : '无'}`,
          hasDetails && hasStrategy
        ))
      }
    }
  }
  
  return results
}

// ==================== 主流程 ====================

function main() {
  // 命令行参数：后缀名（如 -1990）
  const suffix = process.argv[2] || ''
  
  console.log('=== 主报告格式验证 ===\n')
  console.log(`验证样本: ${suffix || '默认(2000)'}\n`)
  
  const outputDir = path.join(process.cwd(), 'test-output')
  const docsDir = path.join(process.cwd(), 'docs')
  
  // 读取文件（支持后缀）
  const llmOutputPath = path.join(outputDir, `test-llm-output${suffix}.json`)
  const examplePath = path.join(docsDir, 'main-report-example.json')
  
  if (!fs.existsSync(llmOutputPath)) {
    console.error('错误: test-llm-output.json 不存在')
    process.exit(1)
  }
  
  const llmOutput = JSON.parse(fs.readFileSync(llmOutputPath, 'utf-8'))
  const example = JSON.parse(fs.readFileSync(examplePath, 'utf-8'))
  
  console.log('1. 加载文件完成')
  console.log(`   - LLM 输出: ${llmOutputPath}`)
  console.log(`   - 示例文件: ${examplePath}`)
  console.log('')
  
  // 收集所有验证结果
  const allResults: ValidationResult[] = []
  
  // 1. Zod Schema 验证
  console.log('2. 执行 Zod Schema 验证...')
  const zodResult = MainReportSchema.safeParse(llmOutput)
  if (!zodResult.success) {
    console.log('   Zod 验证失败:')
    for (const issue of zodResult.error.issues) {
      console.log(`   - ${issue.path.join('.')}: ${issue.message}`)
      allResults.push({
        field: `Zod: ${issue.path.join('.')}`,
        status: 'fail',
        expected: '符合 Schema',
        actual: issue.message
      })
    }
  } else {
    console.log('   Zod 验证通过!')
    allResults.push({
      field: 'Zod Schema 整体验证',
      status: 'pass',
      expected: '符合 Schema',
      actual: '通过'
    })
  }
  console.log('')
  
  // 2. 结构对比
  console.log('3. 执行结构对比验证...')
  allResults.push(...compareStructure(llmOutput, example))
  allResults.push(...validateArrayLengths(llmOutput))
  allResults.push(...validateEnumValues(llmOutput))
  allResults.push(...validateObjectStructures(llmOutput))
  allResults.push(...validateStringFormats(llmOutput))
  allResults.push(...validateIsHighlightRule(llmOutput))
  console.log('')
  
  // 3. 生成验证报告
  console.log('4. 生成验证报告...')
  const report = generateReport(allResults, llmOutput, example)
  const reportPath = path.join(outputDir, `validation-report${suffix}.md`)
  fs.writeFileSync(reportPath, report, 'utf-8')
  console.log(`   报告已保存到: ${reportPath}`)
  console.log('')
  
  // 4. 输出统计
  const passCount = allResults.filter(r => r.status === 'pass').length
  const failCount = allResults.filter(r => r.status === 'fail').length
  const warningCount = allResults.filter(r => r.status === 'warning').length
  
  console.log('=== 验证统计 ===')
  console.log(`✅ 通过: ${passCount}`)
  console.log(`❌ 失败: ${failCount}`)
  console.log(`⚠️ 警告: ${warningCount}`)
  console.log('')
  
  if (failCount === 0) {
    console.log('🎉 所有验证通过！LLM 输出符合标准化方案。')
  } else {
    console.log(`⚠️ 有 ${failCount} 项验证失败，请查看报告详情。`)
  }
}

function generateReport(
  results: ValidationResult[], 
  llmOutput: Record<string, unknown>, 
  example: Record<string, unknown>
): string {
  const passCount = results.filter(r => r.status === 'pass').length
  const failCount = results.filter(r => r.status === 'fail').length
  
  let report = `# 主报告格式验证报告

生成时间: ${new Date().toISOString()}

## 验证统计

- ✅ 通过: ${passCount}
- ❌ 失败: ${failCount}
- 总计: ${results.length}

---

## 详细验证结果

| 验证项 | 状态 | 期望值 | 实际值 |
|--------|------|--------|--------|
`

  for (const result of results) {
    const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    const expected = result.expected.length > 50 ? result.expected.substring(0, 50) + '...' : result.expected
    const actual = result.actual.length > 50 ? result.actual.substring(0, 50) + '...' : result.actual
    report += `| ${result.field} | ${status} | ${expected} | ${actual} |\n`
  }

  report += `
---

## 数据对比

### lifeScriptTitle

| 来源 | 值 |
|------|-----|
| LLM 输出 | ${llmOutput.lifeScriptTitle} |
| 示例 | ${example.lifeScriptTitle} |

### radarData 维度值对比

| 维度 | LLM 输出 | 示例 |
|------|---------|------|
`

  const llmRadar = llmOutput.radarData as { name: string; value: number }[]
  const exampleRadar = example.radarData as { name: string; value: number }[]
  
  if (Array.isArray(llmRadar) && Array.isArray(exampleRadar)) {
    for (let i = 0; i < 7; i++) {
      const llmItem = llmRadar[i] || { name: '-', value: '-' }
      const exItem = exampleRadar[i] || { name: '-', value: '-' }
      report += `| ${llmItem.name} | ${llmItem.value} | ${exItem.value} |\n`
    }
  }

  report += `
### yearlyDetails 对比

| 年份 | LLM level | 示例 level | LLM isHighlight | 示例 isHighlight |
|------|-----------|------------|-----------------|------------------|
`

  const llmYearly = llmOutput.yearlyDetails as { year: string; level: string; isHighlight: boolean }[]
  const exampleYearly = example.yearlyDetails as { year: string; level: string; isHighlight: boolean }[]
  
  if (Array.isArray(llmYearly) && Array.isArray(exampleYearly)) {
    for (let i = 0; i < 3; i++) {
      const llmItem = llmYearly[i] || { year: '-', level: '-', isHighlight: false }
      const exItem = exampleYearly[i] || { year: '-', level: '-', isHighlight: false }
      report += `| ${llmItem.year} | ${llmItem.level} | ${exItem.level} | ${llmItem.isHighlight} | ${exItem.isHighlight} |\n`
    }
  }

  report += `
---

## 结论

`

  if (failCount === 0) {
    report += `**✅ 验证通过**

LLM 输出完全符合标准化方案定义，可以直接用于前端渲染和数据库存储。

### 下一步建议

1. 将此 Prompt 和 JSON Schema 集成到后端 API
2. 使用 Zod 进行运行时验证
3. 实现前端报告页面的数据绑定
`
  } else {
    report += `**⚠️ 验证失败**

共有 ${failCount} 项验证未通过，请检查以下问题并修正 Prompt 或 LLM 输出：

`
    for (const result of results.filter(r => r.status === 'fail')) {
      report += `- **${result.field}**: 期望 ${result.expected}，实际 ${result.actual}\n`
    }
  }

  return report
}

// 运行主流程
main()
