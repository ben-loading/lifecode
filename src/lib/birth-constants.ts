/**
 * 出生时间相关常量：时辰选项（与 iztro timeIndex 0～12 对应）、真太阳时校准用经度
 */

/** 时辰选项：iztro 序号 0=早子 00:00～01:00, 1=丑 01:00～03:00, …, 11=亥 21:00～23:00, 12=晚子 23:00～00:00，均为 UTC+8 */
export const SHICHEN_OPTIONS: { value: number; label: string; range: string }[] = [
  { value: 0, label: '早子时', range: '00:00～01:00' },
  { value: 1, label: '丑时', range: '01:00～03:00' },
  { value: 2, label: '寅时', range: '03:00～05:00' },
  { value: 3, label: '卯时', range: '05:00～07:00' },
  { value: 4, label: '辰时', range: '07:00～09:00' },
  { value: 5, label: '巳时', range: '09:00～11:00' },
  { value: 6, label: '午时', range: '11:00～13:00' },
  { value: 7, label: '未时', range: '13:00～15:00' },
  { value: 8, label: '申时', range: '15:00～17:00' },
  { value: 9, label: '酉时', range: '17:00～19:00' },
  { value: 10, label: '戌时', range: '19:00～21:00' },
  { value: 11, label: '亥时', range: '21:00～23:00' },
  { value: 12, label: '晚子时', range: '23:00～00:00' },
]

/** 东八区中央经度（北京时间） */
const UTC8_CENTRAL_LONGITUDE = 120

/** 部分出生地区 value 对应经度（东经为正），用于真太阳时校准；未列出的地区默认 120 */
const REGION_LONGITUDE: Record<string, number> = {
  '中国,北京市': 116.4,
  '中国,上海市': 121.5,
  '中国,天津市': 117.2,
  '中国,重庆市': 106.5,
  '中国,广东省,广州市': 113.3,
  '中国,广东省,深圳市': 114.1,
  '中国,江苏省,南京市': 118.8,
  '中国,江苏省,苏州市': 120.6,
  '中国,浙江省,杭州市': 120.2,
  '中国,四川省,成都市': 104.1,
  '中国,湖北省,武汉市': 114.3,
  '中国,陕西省,西安市': 108.9,
  '中国,香港': 114.2,
  '中国,澳门': 113.5,
  '台湾,台北市': 121.6,
  '台湾,高雄市': 120.3,
}

/**
 * 根据出生地区 value 获取经度（东经），用于真太阳时校准
 * @param regionValue 地区 value（如 中国,广东省,广州市）
 * @returns 经度度数，缺省 120（东八区中央）
 */
export function getLongitudeByRegion(regionValue: string): number {
  if (!regionValue?.trim()) return UTC8_CENTRAL_LONGITUDE
  return REGION_LONGITUDE[regionValue.trim()] ?? UTC8_CENTRAL_LONGITUDE
}

/**
 * 真太阳时校准：根据标准时（北京时间）和当地经度，得到校准后的分钟偏移（可正可负）
 * 公式：偏移(分钟) = (当地经度 - 120) * 4 + EoT(日序)
 * @param longitude 当地经度（东经）
 * @param solarDate 公历日期 YYYY-M-D，用于均时差近似
 * @returns 分钟数，加在标准时上即为当地真太阳时
 */
export function getSolarTimeOffsetMinutes(longitude: number, solarDate: string): number {
  const longitudeDiff = (longitude - UTC8_CENTRAL_LONGITUDE) * 4 // 每度约 4 分钟
  const [y, m, d] = solarDate.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  const start = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000)
  const B = (360 / 365) * (dayOfYear - 81)
  const BRad = (B * Math.PI) / 180
  const eot = 9.87 * Math.sin(2 * BRad) - 7.53 * Math.cos(BRad) - 1.5 * Math.sin(BRad) // 均时差 分钟
  return Math.round(longitudeDiff + eot)
}
