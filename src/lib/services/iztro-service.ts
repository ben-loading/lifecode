/**
 * iztro 命盘计算服务
 *
 * 将用户档案信息转换为 iztro 输入，支持公历/农历、时辰/具体时间，并按出生地区做真太阳时校准
 */

import { astro } from 'iztro'
import type { IztroInput } from '@/lib/types/iztro-input'
import type { ApiArchive } from '@/lib/types/api'
import { getLongitudeByRegion, getSolarTimeOffsetMinutes } from '@/lib/birth-constants'

/** 使用节气四柱：年按立春分界，月按节气分界（详用惯例） */
const USE_SOLAR_TERM_PILLARS = true

/** 阳历小时(0-23) 转 iztro 时辰序号 0~12（0=早子 00-01, 12=晚子 23-00） */
function hourToTimeIndex(hour: number): number {
  if (hour === 23) return 12 // 晚子时
  return Math.floor((hour + 1) / 2) % 12
}

/**
 * 根据档案信息计算命盘
 * 支持：公历/农历（bySolar / byLunar）、时辰选择/具体时刻、真太阳时校准（经度）
 */
export async function calculateAstrolabe(archive: ApiArchive): Promise<IztroInput> {
  try {
    const genderStr = archive.gender === 'male' ? '男' : '女'
    const useLunar = archive.birthCalendar === 'lunar'
    const useShichen = archive.birthTimeMode === 'shichen'

    let timeIndex: number
    let solarDateStr: string
    let lunarDateStr: string | undefined
    const isLeapMonth = archive.isLeapMonth ?? false

    if (useShichen && archive.birthTimeBranch != null) {
      timeIndex = Math.max(0, Math.min(12, archive.birthTimeBranch))
    } else {
      const birthDate = new Date(archive.birthDate)
      let hour = birthDate.getHours()
      const minute = birthDate.getMinutes()
      const year = birthDate.getFullYear()
      const month = birthDate.getMonth() + 1
      const day = birthDate.getDate()
      solarDateStr = `${year}-${month}-${day}`

      if (archive.birthLocation?.trim()) {
        const longitude = getLongitudeByRegion(archive.birthLocation)
        const offsetMin = getSolarTimeOffsetMinutes(longitude, solarDateStr)
        const totalMinutes = hour * 60 + minute + offsetMin
        const adjusted = ((totalMinutes % 1440) + 1440) % 1440
        hour = Math.floor(adjusted / 60) % 24
      }
      timeIndex = hourToTimeIndex(hour)
    }

    if (USE_SOLAR_TERM_PILLARS) {
      astro.config({ yearDivide: 'exact', horoscopeDivide: 'exact' })
    }

    if (useLunar && archive.lunarDate?.trim()) {
      lunarDateStr = archive.lunarDate.trim()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawAstrolabe = astro.byLunar(lunarDateStr, timeIndex, genderStr, isLeapMonth, true, 'zh-CN') as any
      return transformToIztroInput(rawAstrolabe, archive.gender, archive.birthLocation ?? '')
    }

    if (!useLunar) {
      if (useShichen && archive.birthDate) {
        const [y, m, d] = archive.birthDate.slice(0, 10).split('-').map(Number)
        solarDateStr = `${y}-${m}-${d}`
      } else {
        const d = new Date(archive.birthDate)
        solarDateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawAstrolabe = astro.bySolar(solarDateStr, timeIndex, genderStr, true, 'zh-CN') as any
      return transformToIztroInput(rawAstrolabe, archive.gender, archive.birthLocation ?? '')
    }

    throw new Error('Invalid archive: lunar calendar requires lunarDate')
  } catch (error) {
    throw new Error(`Failed to calculate astrolabe: ${error}`)
  }
}

/**
 * 将 iztro 原始输出转换为 LLM Prompt 定义的 IztroInput 格式
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformToIztroInput(raw: any, gender: 'male' | 'female', birthLocation: string): IztroInput {
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
