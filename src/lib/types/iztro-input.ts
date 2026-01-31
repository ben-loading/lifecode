/**
 * iztro 库输入输出类型定义
 */

export interface IztroInput {
  // === 基础信息 ===
  solarDate: string              // 阳历："2000-8-16"
  lunarDate: string              // 农历："二〇〇〇年七月十七"
  chineseDate: string            // 四柱八字："庚辰 甲申 丙午 庚寅"
  time: string                   // 时辰："寅时"
  timeRange: string              // 时间段："03:00~05:00"
  sign: string                   // 星座："狮子座"
  zodiac: string                 // 生肖："龙"
  
  // === 命盘核心 ===
  earthlyBranchOfSoulPalace: string  // 命宫地支："午"
  earthlyBranchOfBodyPalace: string  // 身宫地支："戌"
  soul: string                   // 命主："破军"
  body: string                   // 身主："文昌"
  fiveElementsClass: string      // 五行局："木三局"
  
  // === 十二宫位完整数据 ===
  palaces: IztroPalace[]
  
  // === 用户信息 ===
  gender: 'male' | 'female'
  birthLocation: string
}

export interface IztroPalace {
  name: string                   // 宫名：命宫、财帛、官禄、夫妻等
  isBodyPalace: boolean
  heavenlyStem: string           // 天干："壬"
  earthlyBranch: string          // 地支："午"
  majorStars: IztroStar[]        // 主星
  minorStars: IztroStar[]        // 辅星（六吉六煞）
  adjectiveStars: IztroAdjectiveStar[]  // 杂耀
  changsheng12: string           // 长生12神
  stage: {                       // 大限
    range: [number, number]      // 如 [4, 13]
    heavenlyStem: string
  }
  ages: number[]                 // 小限年龄
}

export interface IztroStar {
  name: string                   // 如："紫微"
  type: 'major' | 'lucun' | 'tianma' | 'soft' | 'tough'
  brightness: string             // 亮度："庙"/"旺"/"得"/"陷"等
}

export interface IztroAdjectiveStar {
  name: string
  type: 'helper' | 'flower' | 'adjective'
}
