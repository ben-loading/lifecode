/**
 * 模拟主报告生成流程
 * 
 * 1. 接收用户输入（性别、生日、时间、地区）
 * 2. 调用 iztro 库生成八字和紫微命盘
 * 3. 输出符合 LLM Prompt 定义的 IztroInput 格式
 * 
 * 运行方式: 
 *   npx tsx scripts/simulate-report-generation.ts [后缀]
 *   例如: npx tsx scripts/simulate-report-generation.ts -1990
 */

import { astro } from 'iztro'
import * as fs from 'fs'
import * as path from 'path'

// ==================== 用户输入配置 ====================

// 命令行参数：后缀名（如 -1990）
const suffix = process.argv[2] || ''

// 根据后缀选择不同的测试样本
const testSamples: Record<string, {
  solarDate: string
  birthHour: number
  gender: 'male' | 'female'
  location: string
}> = {
  '': {
    solarDate: '2000-8-16',
    birthHour: 4,
    gender: 'male',
    location: '北京'
  },
  '-1990': {
    solarDate: '1990-9-14',
    birthHour: 12,
    gender: 'male',
    location: '台湾'
  }
}

const userInput = testSamples[suffix] || testSamples['']

// ==================== 工具函数 ====================

/** 阳历小时(0-23) 转 iztro 时辰序号 0~12 */
function hourToTimeIndex(hour: number): number {
  if (hour === 23) return 0 // 晚子时 归为 子时0
  return Math.floor((hour + 1) / 2) % 12
}

// ==================== 主流程 ====================

function main() {
  console.log('=== 主报告生成模拟 ===\n')
  console.log(`使用测试样本: ${suffix || '默认(2000)'}\n`)
  console.log('1. 用户输入:')
  console.log(JSON.stringify(userInput, null, 2))
  console.log('')

  // 调用 iztro 生成命盘
  const timeIndex = hourToTimeIndex(userInput.birthHour)
  const genderStr = userInput.gender === 'male' ? '男' : '女'
  
  // 使用节气四柱：年按立春、月按节气（详用惯例）
  astro.config({ yearDivide: 'exact', horoscopeDivide: 'exact' })
  console.log(`2. 调用 iztro.bySolar("${userInput.solarDate}", ${timeIndex}, "${genderStr}", true, "zh-CN") [节气四柱]`)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAstrolabe = astro.bySolar(userInput.solarDate, timeIndex, genderStr, true, 'zh-CN') as any
  
  // 保存 iztro 原始输出（用于调试）
  const outputDir = path.join(process.cwd(), 'test-output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  fs.writeFileSync(
    path.join(outputDir, `test-input-iztro-raw${suffix}.json`),
    JSON.stringify(rawAstrolabe, null, 2),
    'utf-8'
  )
  console.log(`\n3. iztro 原始输出已保存到 test-output/test-input-iztro-raw${suffix}.json`)

  // 转换为 LLM 输入格式（符合 Prompt 定义的 IztroInput）
  const iztroInput = transformToIztroInput(rawAstrolabe, userInput.gender, userInput.location)
  
  fs.writeFileSync(
    path.join(outputDir, `test-llm-input${suffix}.json`),
    JSON.stringify(iztroInput, null, 2),
    'utf-8'
  )
  console.log(`4. LLM 输入数据已保存到 test-output/test-llm-input${suffix}.json`)
  
  console.log('\n=== 输出预览 ===')
  console.log('基础信息:')
  console.log(`  阳历: ${iztroInput.solarDate}`)
  console.log(`  农历: ${iztroInput.lunarDate}`)
  console.log(`  四柱: ${iztroInput.chineseDate}`)
  console.log(`  时辰: ${iztroInput.time} (${iztroInput.timeRange})`)
  console.log(`  星座: ${iztroInput.sign}`)
  console.log(`  生肖: ${iztroInput.zodiac}`)
  console.log('')
  console.log('命盘核心:')
  console.log(`  命宫地支: ${iztroInput.earthlyBranchOfSoulPalace}`)
  console.log(`  身宫地支: ${iztroInput.earthlyBranchOfBodyPalace}`)
  console.log(`  命主: ${iztroInput.soul}`)
  console.log(`  身主: ${iztroInput.body}`)
  console.log(`  五行局: ${iztroInput.fiveElementsClass}`)
  console.log('')
  console.log(`十二宫位数量: ${iztroInput.palaces.length}`)
  console.log('')
  console.log('=== 完成 ===')
}

/**
 * 将 iztro 原始输出转换为 LLM Prompt 定义的 IztroInput 格式
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformToIztroInput(raw: any, gender: 'male' | 'female', birthLocation: string) {
  // 提取十二宫位数据
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const palaces = (raw.palaces || []).map((palace: any) => ({
    name: palace.name || '',
    isBodyPalace: palace.isBodyPalace || false,
    heavenlyStem: palace.heavenlyStem || '',
    earthlyBranch: palace.earthlyBranch || '',
    majorStars: (palace.majorStars || []).map((star: { name: string; type?: string; brightness?: string }) => ({
      name: star.name || '',
      type: star.type || 'major',
      brightness: star.brightness || ''
    })),
    minorStars: (palace.minorStars || []).map((star: { name: string; type?: string; brightness?: string }) => ({
      name: star.name || '',
      type: star.type || 'soft',
      brightness: star.brightness || ''
    })),
    adjectiveStars: (palace.adjectiveStars || []).map((star: { name: string; type?: string }) => ({
      name: star.name || '',
      type: star.type || 'adjective'
    })),
    changsheng12: palace.changsheng12 || '',
    stage: {
      range: palace.decadal?.range || [0, 0],
      heavenlyStem: palace.decadal?.heavenlyStem || ''
    },
    ages: palace.ages || []
  }))

  return {
    // 基础信息
    solarDate: raw.solarDate || '',
    lunarDate: raw.lunarDate || '',
    chineseDate: raw.chineseDate || '',
    time: raw.time || '',
    timeRange: raw.timeRange || '',
    sign: raw.sign || '',
    zodiac: raw.zodiac || '',
    
    // 命盘核心
    earthlyBranchOfSoulPalace: raw.earthlyBranchOfSoulPalace || '',
    earthlyBranchOfBodyPalace: raw.earthlyBranchOfBodyPalace || '',
    soul: raw.soul || '',
    body: raw.body || '',
    fiveElementsClass: raw.fiveElementsClass || '',
    
    // 十二宫位
    palaces,
    
    // 用户信息
    gender,
    birthLocation
  }
}

// 运行主流程
main()
