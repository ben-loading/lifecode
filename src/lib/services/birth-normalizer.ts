/**
 * 出生信息标准化服务
 * 
 * 将各种输入方式（公历/农历、具体时刻/时辰）统一转换为标准化的日期和时辰序号
 * 用于同命盘报告复用的匹配查询
 */

import type { ApiArchive } from '@/lib/types/api'
import { getLongitudeByRegion, getSolarTimeOffsetMinutes } from '@/lib/birth-constants'
import { astro } from 'iztro'

/** 阳历小时(0-23) 转 iztro 时辰序号 0~12（0=早子 00-01, 12=晚子 23-00） */
function hourToTimeIndex(hour: number): number {
  if (hour === 23) return 12 // 晚子时
  return Math.floor((hour + 1) / 2) % 12
}

/**
 * 将农历日期转换为公历日期
 * 使用 iztro 库进行转换（复用 iztro-service.ts 的逻辑）
 */
function convertLunarToSolar(lunarDate: string, isLeapMonth: boolean): string {
  try {
    const [year, month, day] = lunarDate.split('-').map(Number)
    const lunarDateStr = `${year}-${month}-${day}`
    
    // 使用 iztro 获取公历日期（使用任意时辰和性别，我们只需要日期）
    astro.config({ yearDivide: 'exact', horoscopeDivide: 'exact' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawAstrolabe = astro.byLunar(lunarDateStr, 6, '男', isLeapMonth, true, 'zh-CN') as any
    const solarDate = rawAstrolabe?.solarDate
    
    // iztro 返回的 solarDate 格式为 "YYYY-M-D"，需要标准化为 "YYYY-MM-DD"
    if (solarDate && solarDate.includes('-')) {
      const [y, m, d] = solarDate.split('-').map(Number)
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
    
    // 如果转换失败，返回原日期（这种情况应该很少）
    return lunarDate
  } catch {
    // 转换失败时返回原日期
    return lunarDate
  }
}

/**
 * 标准化出生信息
 * 将各种输入方式统一转换为：公历日期（YYYY-MM-DD）+ 时辰序号（0-12）
 * 
 * @param archive 档案信息
 * @returns 标准化后的日期和时辰序号
 */
export function normalizeBirthInfo(archive: ApiArchive): {
  normalizedBirthDate: string  // "YYYY-MM-DD"
  normalizedTimeIndex: number  // 0-12
} {
  const useLunar = archive.birthCalendar === 'lunar'
  const useShichen = archive.birthTimeMode === 'shichen'
  
  let normalizedBirthDate: string
  let normalizedTimeIndex: number
  
  // 1. 处理日期：统一转换为公历日期
  if (useLunar && archive.lunarDate) {
    // 农历转公历
    const solarDate = convertLunarToSolar(archive.lunarDate, archive.isLeapMonth ?? false)
    normalizedBirthDate = solarDate
  } else {
    // 公历：提取日期部分
    const birthDate = new Date(archive.birthDate)
    const year = birthDate.getFullYear()
    const month = birthDate.getMonth() + 1
    const day = birthDate.getDate()
    normalizedBirthDate = `${year}-${month}-${day}`
  }
  
  // 2. 处理时辰：统一转换为时辰序号（0-12）
  if (useShichen && archive.birthTimeBranch != null) {
    // 时辰模式：直接使用
    normalizedTimeIndex = Math.max(0, Math.min(12, archive.birthTimeBranch))
  } else {
    // 具体时刻模式：应用真太阳时校准后转换为时辰序号
    const birthDate = new Date(archive.birthDate)
    let hour = birthDate.getHours()
    const minute = birthDate.getMinutes()
    
    // 应用真太阳时校准（如果有地点）
    if (archive.birthLocation?.trim()) {
      const longitude = getLongitudeByRegion(archive.birthLocation)
      const offsetMin = getSolarTimeOffsetMinutes(longitude, normalizedBirthDate)
      const totalMinutes = hour * 60 + minute + offsetMin
      const adjusted = ((totalMinutes % 1440) + 1440) % 1440
      hour = Math.floor(adjusted / 60) % 24
    }
    
    // 转换为时辰序号
    normalizedTimeIndex = hourToTimeIndex(hour)
  }
  
  return {
    normalizedBirthDate,
    normalizedTimeIndex
  }
}
