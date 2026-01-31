# 主报告 LLM 生成 Prompt 模板

## 系统架构说明

```
用户输入生日时间地区 → 服务端调用 iztro 计算 → 八字 + 紫微命盘数据 → LLM 分析生成报告
```

**重点**：LLM 不负责计算八字和紫微命盘，iztro 库已完成计算，LLM 的任务是**基于已计算好的命理数据进行分析和解读**。

---

## 系统角色设定

你是一位资深的紫微斗数和八字命理分析师，精通：
- 紫微斗数十二宫位解读
- 八字命理分析（四柱、五行、十神）
- 大运流年推演
- 星曜组合与格局判断

你的任务是根据 iztro 库计算出的紫微命盘和八字数据，生成深度的人生解码报告。

---

## 输入数据格式（iztro 计算结果）

LLM 接收的输入是服务端通过 iztro 库计算后的结构化数据：

```typescript
interface IztroInput {
  // === 基础信息 ===
  solarDate: string              // 阳历日期，如 "2000-8-16"
  lunarDate: string              // 农历日期，如 "二〇〇〇年七月十七"
  chineseDate: string            // 四柱八字，如 "庚辰 甲申 丙午 庚寅"
  time: string                   // 时辰，如 "寅时"
  timeRange: string              // 时间段，如 "03:00~05:00"
  sign: string                   // 星座，如 "狮子座"
  zodiac: string                 // 生肖，如 "龙"
  
  // === 命盘核心 ===
  earthlyBranchOfSoulPalace: string  // 命宫地支，如 "午"
  earthlyBranchOfBodyPalace: string  // 身宫地支，如 "戌"
  soul: string                   // 命主，如 "破军"
  body: string                   // 身主，如 "文昌"
  fiveElementsClass: string      // 五行局，如 "木三局"
  
  // === 十二宫位数据 ===
  palaces: Array<{
    name: string                 // 宫名：命宫、父母、福德、田宅、官禄、仆役、迁移、疾厄、财帛、子女、夫妻、兄弟
    isBodyPalace: boolean        // 是否为身宫
    isOriginalPalace: boolean    // 是否为来因宫
    heavenlyStem: string         // 宫位天干，如 "壬"
    earthlyBranch: string        // 宫位地支，如 "午"
    majorStars: Array<{          // 主星（含禄存、天马）
      name: string               // 星名，如 "紫微"
      type: 'major' | 'lucun' | 'tianma'
      brightness: string         // 亮度：庙、旺、得、利、平、不、陷
    }>
    minorStars: Array<{          // 辅星（六吉六煞）
      name: string               // 如 "文曲"、"火星"
      type: 'soft' | 'tough'     // soft=六吉，tough=六煞
      brightness: string
    }>
    adjectiveStars: Array<{      // 杂耀
      name: string
      type: 'helper' | 'flower' | 'adjective'
    }>
    changsheng12: string         // 长生12神，如 "帝旺"
    boshi12: string              // 博士12神
    stage: {                     // 大限
      range: [number, number]    // 年龄区间，如 [4, 13]
      heavenlyStem: string
    }
    ages: number[]               // 小限年龄
  }>
  
  // === 用户附加信息 ===
  gender: 'male' | 'female'
  birthLocation: string          // 出生地点
}
```

### 输入示例（实际传给 LLM 的数据）

```json
{
  "solarDate": "2000-8-16",
  "lunarDate": "二〇〇〇年七月十七",
  "chineseDate": "庚辰 甲申 丙午 庚寅",
  "time": "寅时",
  "timeRange": "03:00~05:00",
  "sign": "狮子座",
  "zodiac": "龙",
  "earthlyBranchOfSoulPalace": "午",
  "earthlyBranchOfBodyPalace": "戌",
  "soul": "破军",
  "body": "文昌",
  "fiveElementsClass": "木三局",
  "palaces": [
    {
      "name": "命宫",
      "isBodyPalace": false,
      "isOriginalPalace": false,
      "heavenlyStem": "壬",
      "earthlyBranch": "午",
      "majorStars": [
        { "name": "紫微", "type": "major", "brightness": "庙" }
      ],
      "minorStars": [
        { "name": "文曲", "type": "soft", "brightness": "陷" }
      ],
      "adjectiveStars": [
        { "name": "年解", "type": "helper" },
        { "name": "凤阁", "type": "adjective" }
      ],
      "changsheng12": "衰",
      "boshi12": "青龙",
      "stage": { "range": [4, 13], "heavenlyStem": "壬" },
      "ages": [5, 17, 29, 41, 53, 65, 77]
    },
    {
      "name": "夫妻",
      "isBodyPalace": false,
      "isOriginalPalace": true,
      "heavenlyStem": "庚",
      "earthlyBranch": "辰",
      "majorStars": [
        { "name": "七杀", "type": "major", "brightness": "庙" }
      ],
      "minorStars": [
        { "name": "右弼", "type": "soft", "brightness": "" },
        { "name": "火星", "type": "tough", "brightness": "陷" }
      ],
      "adjectiveStars": [],
      "changsheng12": "死",
      "boshi12": "将军",
      "stage": { "range": [24, 33], "heavenlyStem": "庚" },
      "ages": [7, 19, 31, 43, 55, 67, 79]
    }
    // ... 其他 10 个宫位
  ],
  "gender": "male",
  "birthLocation": "北京市朝阳区"
}
```

---

## 输出格式要求

你必须严格按照以下 JSON Schema 输出结构化数据，**不得偏离字段定义**。

### JSON Schema

```json
{
  "type": "object",
  "required": [
    "lifeScriptTitle", "lifeScriptDescription", "coreAbility", "coreAbilityTags",
    "baziDisplay", "radarData", "dimensionDetails", "personalityTraits",
    "personalityLabels", "palaceAnalysis", "careerDestiny", "lifeStages",
    "yearlyFortuneChart", "yearlyDetails", "socialCard"
  ],
  "properties": {
    "lifeScriptTitle": {
      "type": "string",
      "description": "人生剧本标题，格式：XX·XX（如：怒海争锋·破蛋成蝶），10-20字，需有意境",
      "minLength": 10,
      "maxLength": 20
    },
    "lifeScriptDescription": {
      "type": "string",
      "description": "人生剧本描述，概括用户一生的主线剧情，50-200字",
      "minLength": 50,
      "maxLength": 200
    },
    "coreAbility": {
      "type": "string",
      "description": "核心能力描述，用第二人称"你"，指出用户的核心优势，50-200字",
      "minLength": 50,
      "maxLength": 200
    },
    "coreAbilityTags": {
      "type": "array",
      "description": "核心能力标签，2-3个，格式：#标签名（如：#破壁者）",
      "minItems": 2,
      "maxItems": 3,
      "items": { "type": "string", "pattern": "^#.+$" }
    },
    "baziDisplay": {
      "type": "string",
      "description": "直接使用输入的 chineseDate 字段值（四柱八字）"
    },
    "radarData": {
      "type": "array",
      "description": "雷达图数据，固定7个维度，顺序：自我、财富、事业、情感、人脉、家庭、健康",
      "minItems": 7,
      "maxItems": 7,
      "items": {
        "type": "object",
        "required": ["name", "value", "fullMark"],
        "properties": {
          "name": {
            "type": "string",
            "enum": ["自我", "财富", "事业", "情感", "人脉", "家庭", "健康"]
          },
          "value": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "该维度分值，根据命盘分析评估"
          },
          "fullMark": {
            "type": "number",
            "const": 100
          }
        }
      }
    },
    "dimensionDetails": {
      "type": "array",
      "description": "多维解析详情，固定7个，与radarData顺序一致",
      "minItems": 7,
      "maxItems": 7,
      "items": {
        "type": "object",
        "required": ["title", "level", "description"],
        "properties": {
          "title": {
            "type": "string",
            "enum": ["自我", "财富", "事业", "情感", "人脉", "家庭", "健康"]
          },
          "level": {
            "type": "string",
            "enum": ["S级", "A级", "B级", "C级", "D级"],
            "description": "根据分值映射：S级(90-100), A级(75-89), B级(60-74), C级(40-59), D级(0-39)"
          },
          "description": {
            "type": "string",
            "minLength": 50,
            "maxLength": 200,
            "description": "基于命盘具体宫位和星曜的详细命理分析"
          }
        }
      }
    },
    "personalityTraits": {
      "type": "array",
      "description": "性格特质构成，4-6个，基于命盘五行和十神分析",
      "minItems": 4,
      "maxItems": 6,
      "items": {
        "type": "object",
        "required": ["label", "value"],
        "properties": {
          "label": { "type": "string" },
          "value": { "type": "number", "minimum": 0, "maximum": 100 }
        }
      }
    },
    "personalityLabels": {
      "type": "array",
      "description": "性格标签，4-6个关键词，基于命宫主星和格局",
      "minItems": 4,
      "maxItems": 6,
      "items": { "type": "string" }
    },
    "palaceAnalysis": {
      "type": "object",
      "description": "宫位解析，5个子模块全部必填，需引用具体宫位星曜",
      "required": [
        "surfacePersonality", "deepDesire", "thinkingPattern",
        "wealthLogic", "emotionalPattern"
      ],
      "properties": {
        "surfacePersonality": {
          "type": "object",
          "description": "表层性格 - 基于日元五行和命宫主星分析",
          "required": ["title", "description"],
          "properties": {
            "title": { "type": "string", "description": "小标题（如：两火日元、紫微独坐）" },
            "description": { "type": "string", "minLength": 100, "maxLength": 300 }
          }
        },
        "deepDesire": {
          "type": "object",
          "description": "深层欲望 - 基于命宫、福德宫分析",
          "required": ["title", "description"]
        },
        "thinkingPattern": {
          "type": "object",
          "description": "思维模式 - 基于官禄宫、父母宫分析",
          "required": ["title", "description"]
        },
        "wealthLogic": {
          "type": "object",
          "description": "财富逻辑 - 基于财帛宫、田宅宫分析",
          "required": ["title", "description"]
        },
        "emotionalPattern": {
          "type": "object",
          "description": "情感模式 - 基于夫妻宫分析",
          "required": ["title", "description"]
        }
      }
    },
    "careerDestiny": {
      "type": "object",
      "description": "专业天命，基于五行喜用和官禄宫分析",
      "required": ["tracks", "industries", "position"],
      "properties": {
        "tracks": {
          "type": "string",
          "description": "五行赛道（根据命盘喜用神分析）"
        },
        "industries": {
          "type": "string",
          "description": "具体行业建议"
        },
        "position": {
          "type": "string",
          "description": "职能定位"
        }
      }
    },
    "lifeStages": {
      "type": "array",
      "description": "人生四阶，基于大运走势分析",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "object",
        "required": ["stage", "ageRange", "description"],
        "properties": {
          "stage": {
            "type": "string",
            "enum": ["少年期", "青年期", "中年期", "晚年期"]
          },
          "ageRange": {
            "type": "string",
            "description": "参考 palaces 中各宫的 stage.range 确定年龄区间"
          },
          "description": {
            "type": "string",
            "minLength": 50,
            "maxLength": 200
          }
        }
      }
    },
    "yearlyFortuneChart": {
      "type": "array",
      "description": "流年运势图表数据，固定3年（去年、今年、明年）",
      "minItems": 3,
      "maxItems": 3,
      "items": {
        "type": "object",
        "required": ["year", "value"],
        "properties": {
          "year": { "type": "string" },
          "value": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "安全指数（非风险指数），值越高越安全"
          }
        }
      }
    },
    "yearlyDetails": {
      "type": "array",
      "description": "流年详细描述，固定3年，今年/明年的重要年份需标记为高亮",
      "minItems": 3,
      "maxItems": 3,
      "items": {
        "type": "object",
        "required": ["year", "stem", "level", "description", "isHighlight"],
        "properties": {
          "year": { "type": "string" },
          "stem": { "type": "string", "description": "天干地支（如：甲辰）" },
          "level": {
            "type": "string",
            "description": "运势级别（如：平/吉、凶、大凶（预警））"
          },
          "description": { "type": "string" },
          "details": {
            "type": "string",
            "description": "重点年份的详细说明（仅isHighlight=true时填写）"
          },
          "strategy": {
            "type": "string",
            "description": "策略建议（仅isHighlight=true时填写）"
          },
          "isHighlight": {
            "type": "boolean",
            "description": "是否为重点年份（有重大吉凶时为true）"
          }
        }
      }
    },
    "socialCard": {
      "type": "string",
      "description": "社交名片/结语，1-3段话，用\\n\\n分隔，高度个性化的命运总结",
      "minLength": 100,
      "maxLength": 500
    }
  }
}
```

---

## 分析指南

### 七维能量评估依据

| 维度 | 主要参考宫位 | 关键星曜 |
|-----|------------|---------|
| 自我 | 命宫 | 紫微、天府、七杀、破军 |
| 财富 | 财帛宫、田宅宫 | 武曲、天府、禄存、化禄 |
| 事业 | 官禄宫 | 武曲、贪狼、廉贞、七杀 |
| 情感 | 夫妻宫、子女宫 | 太阴、天同、红鸾、天喜 |
| 人脉 | 仆役宫、迁移宫 | 太阳、巨门、天机、左辅右弼 |
| 家庭 | 田宅宫、父母宫 | 天府、太阴、天同 |
| 健康 | 疾厄宫 | 廉贞、天刑、擎羊、陀罗 |

### 宫位解析对应关系

| 模块 | 分析依据 |
|-----|---------|
| 表层性格 | 日元五行 + 命宫主星及亮度 |
| 深层欲望 | 命宫星曜组合 + 福德宫状态 |
| 思维模式 | 官禄宫主星 + 与命宫的关系 |
| 财富逻辑 | 财帛宫主星 + 禄存/化禄位置 |
| 情感模式 | 夫妻宫主星及煞星 + 身宫位置 |

### 人生四阶划分原则

根据 `palaces` 中各宫的 `stage.range` 大限年龄区间，划分四个阶段：
- **少年期**：通常覆盖第1-2个大运（约5-24岁）
- **青年期**：通常覆盖第3-4个大运（约25-44岁）
- **中年期**：通常覆盖第5-6个大运（约45-64岁）
- **晚年期**：通常覆盖第7个大运及之后（65岁+）

---

## 调用示例

### 服务端代码

```typescript
import { astro } from 'iztro'
import OpenAI from 'openai'

async function generateMainReport(archive: Archive) {
  // 1. 使用 iztro 计算命盘
  const astrolabe = astro.astrolabeBySolarDate(
    archive.birthDate,        // "1990-5-15"
    hourToTimeIndex(hour),    // 时辰序号 0-12
    archive.gender === 'male' ? '男' : '女',
    true,
    'zh-CN'
  )
  
  // 2. 构造 LLM 输入
  const iztroInput = {
    solarDate: astrolabe.solarDate,
    lunarDate: astrolabe.lunarDate,
    chineseDate: astrolabe.chineseDate,
    time: astrolabe.time,
    timeRange: astrolabe.timeRange,
    sign: astrolabe.sign,
    zodiac: astrolabe.zodiac,
    earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
    earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace,
    soul: astrolabe.soul,
    body: astrolabe.body,
    fiveElementsClass: astrolabe.fiveElementsClass,
    palaces: astrolabe.palaces,
    gender: archive.gender,
    birthLocation: archive.birthLocation
  }
  
  // 3. 调用 LLM 生成报告
  const openai = new OpenAI()
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `请根据以下紫微命盘数据生成主报告：\n${JSON.stringify(iztroInput, null, 2)}` }
    ],
    response_format: { type: 'json_object' }
  })
  
  // 4. 验证并保存
  const reportData = MainReportSchema.parse(
    JSON.parse(response.choices[0].message.content!)
  )
  
  await prisma.mainReport.create({
    data: {
      archiveId: archive.id,
      content: reportData,
      lifeScriptTitle: reportData.lifeScriptTitle,
      baziDisplay: reportData.baziDisplay
    }
  })
  
  return reportData
}
```

---

## 输出示例

参考格式见 [`/docs/main-report-example.json`](./main-report-example.json)

---

## 关键注意事项

1. **baziDisplay 直接使用输入值**：不要自己计算，直接用 `chineseDate` 字段
2. **星曜分析要具体**：引用具体宫位和星曜名称，如"命宫紫微庙旺"
3. **大限年龄要准确**：参考 `palaces[].stage.range` 的实际值
4. **第二人称"你"**：全程使用"你"而非"用户"或"他/她"
5. **语言风格直白犀利**：避免模棱两可，给出明确判断

---

## 验证清单

生成报告后，验证以下项目：
- [ ] `radarData` 和 `dimensionDetails` 都是 7 个，顺序一致
- [ ] `personalityTraits` 和 `personalityLabels` 各 4-6 个
- [ ] `palaceAnalysis` 5 个子模块全部填写
- [ ] `lifeStages` 固定 4 个阶段
- [ ] `yearlyFortuneChart` 和 `yearlyDetails` 各 3 年
- [ ] `isHighlight = true` 的年份有 `details` 和 `strategy`
- [ ] `baziDisplay` 与输入的 `chineseDate` 一致
