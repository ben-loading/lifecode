'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'

// ——— 动态内容数据（固定标题在 JSX，此处仅放变化内容） ———

const 核心情感模式 = {
  命理解析:
    '你日柱为【丙戌】，日干丙火生于巳月，火气极旺，且自坐火库（戌）。在紫微斗数中，你的【夫妻宫】在未宫无主星，借对宫（官禄宫）的【武曲化忌】与【贪狼】安星，且会有【左辅、右弼】同守或会照。',
  博弈地位: '绝对上位者 / 暴君模式',
  博弈地位简评:
    '你对伴侣的控制欲极强，这种控制不是查岗，而是精神上的压制。丙戌日柱由于自坐食伤库，你习惯把伴侣当「孩子」或「下属」对待，高兴时宠上天，不高兴时冷若冰霜。',
  情感死穴: [
    '「武曲化忌」的诅咒：你的亲密关系极易与「金钱」挂钩且产生冲突。要么是你嫌弃对方乱花钱，要么是伴侣因你的财务冒险而感到极度不安全。你容易吸引到那种刚开始很崇拜你，但最后因为受不了你的「独断专行」和「财务危机」而反目成仇的人。',
    '左辅右弼入夫妻宫：这在古书中被称为「双妻之象」。这不一定指重婚，而是指你的感情世界里，极易出现「三人行」的拥挤感，或者你总是很难在一段关系中彻底收心。',
  ],
}

const 正缘画像 = {
  外貌气质:
    '基于配偶星（辛金）被火炼，以及借星【贪狼】的特性。你的正缘通常骨架较明显、皮肤偏白或化妆精致，眼神有媚态或社交能力极强。她绝对不是那种唯唯诺诺的小白兔，而是带有一定野性或才艺的女性。',
  职业圈层:
    '五行喜金水。对方多从事金融财务、珠宝时尚、公关交际，或者是自由职业/艺术类工作（贪狼星特质）。',
  // 相遇高频地标：变化内容，每项为 { 名称, 五行标签, 简注 }
  相遇高频地标: [
    { 名称: '高端健身房/拳击馆', 五行标签: '金', 简注: '武曲星的硬朗气场。' },
    { 名称: '酒吧/KTV/夜店', 五行标签: '水/贪狼', 简注: '贪狼主桃花之地，也是你容易放松的地方。' },
    { 名称: '海边/江景餐厅', 五行标签: '水', 简注: '水能既济你的火性。' },
  ],
  地标前言: '你的命局火炎土燥，急需金水降温。',
  互动剧本: '相爱相杀',
  互动剧本说明:
    '由于日支戌土是火库，你与伴侣的关系是「消耗型」的。她能给你带来快乐（食伤），但你也在不断消耗她的能量（火克金）。相处模式往往是：激情开场 -> 争夺主导权 -> 财务/价值观冲突 -> 剧烈争吵或冷战。',
}

// 人生大运：每人时间范围不同，区间/岁数/干支/条数由接口按用户返回；可选 情感趋势指数 用于绘图
const 大运情感列表 = [
  {
    区间: '2026-2035',
    岁数: '35-44岁',
    干支: '壬子',
    幸福指数: 60,
    情感状态关键词: '桃花泛滥、子午冲、动荡不安',
    关键解读:
      '这十年大运【壬子】全是水（七杀），与你2026年后的流年【丙午】形成极其猛烈的「子午相冲」。桃花极旺：子水为你命局的桃花沐浴之地，这十年你身边女人不会断，但质量参差不齐。婚姻宫受冲：大运地支「子」与流年或原局容易发生冲突。这十年是婚变/分的高危期，因为「水火交战」，你的情绪会极不稳定，容易把工作上的压力发泄在伴侣身上。',
  },
  {
    区间: '2036-2045',
    岁数: '45-54岁',
    干支: '癸丑',
    幸福指数: 75,
    情感状态关键词: '湿土晦火、趋于平稳、暗藏压抑',
    关键解读:
      '丑土是你命局的「养」地，也是金（财星）的库。这十年你的性情会大幅收敛。虽然【癸水】正官透出，代表你会有责任感，但丑戌相刑（日支与大运刑），代表夫妻间虽无大吵，但容易有「冷暴力」或身体健康问题（如伴侣妇科/肠胃不适）。',
  },
]

const 年度情感推演 = {
  流年天干: '丙火（比肩）',
  流年地支: '午火（羊刃/劫财）',
  核心象义: '比劫夺财，烈火焚身。',
  单身: {
    脱单概率: '高（但多为烂桃花）',
    命理依据: '流年地支【午】与日支【戌】半合火局。合代表有人缘，但合化为「比劫」（竞争者）。',
    艳遇坐标: '演唱会现场、赛车场、各种展会（火旺之地）。',
    避坑警示:
      '警惕「名花有主」或「图谋不轨」的对象。由于2026年是「比劫夺财」年，你遇到的对象，要么身边已经有男朋友（比肩争合），要么是看中你的钱想让你买单（劫财）。这一年，千万不要在刚认识的异性身上大额花钱，大概率是肉包子打狗。',
  },
  有伴侣: {
    第三者入侵指数: 5,
    命理依据:
      '午戌半合火局：流年【午】强行合入你的夫妻宫【戌】。这个「合」化成了火（比劫）。在男命八字中，比劫就是「情敌」。羊刃入命：午火是丙火的羊刃，代表脾气极其暴躁。',
    潜在危险来源:
      '你的兄弟/朋友，或者是社交圈里的人。流年显示，你的伴侣可能会因为你的「兄弟义气」而感到被冷落，或者直接有你的熟人介入你们的关系。另一种情况是：你因为脾气失控（羊刃），对伴侣造成了不可逆的伤害。',
    维稳手段: [
      '物理降温。聚少离多：这一年适合出差，人为制造距离，减少正面摩擦。',
      '卧室风水：床头严禁放红色物品，多用黑色、深蓝色床品（水克火）。',
      '财政透明：主动把一部分钱交给伴侣管理（被动应劫），否则这笔钱也会被「劫财」运势亏掉。',
    ],
  },
}

const 流月情感 = {
  激情燃烧月: {
    月份: '公历8月 (丙申月) & 9月 (丁酉月)',
    说明: '金气进气，财星得地。这两个月你的魅力最大，且容易遇到相对靠谱、有质感的异性，或者与伴侣关系缓和。',
  },
  信任危机月: {
    月份: '公历6月 (甲午月) & 12月 (庚子月)',
    说明:
      '6月是「午午自刑」，火气最旺，你可能会因为一句话不对付就炸毛，导致分手。12月是「子午相冲」，冲动太岁羊刃，极易发生突发性的冲突、抓包、或因冲动而导致的肢体摩擦。',
  },
}

const 关键时间点 = {
  容易结婚年份: [
    { 年份: '2028年 (戊申) / 2029年 (己酉)', 说明: '这两年食伤生财，财星（妻星）得地且有力，是你最有希望稳定下来，遇到愿意辅佐你的伴侣的年份。' },
  ],
  容易分手年份: [
    { 年份: '2026年 (丙午)', 说明: '烈火劫财，九死一生。' },
    { 年份: '2032年 (壬子)', 说明: '天克地冲日柱（壬水克丙火，子水冲戌土），这是人生中情感关口最大的一年，这年如果没分，那基本就是一辈子了。' },
  ],
}

const 情感年度总结 = {
  正文: '「与其在情场厮杀，不如先保住钱包。」',
  说明:
    '2026年丙午年，对你而言是「比劫重重」的一年。你的荷尔蒙会爆棚，自信心会爆棚，但你的理智会下线。在感情上，你极易陷入「多男争女」的狗血剧情，或者因为「哥们义气」而牺牲伴侣的利益。',
  军师建议:
    '这一年，把过剩的精力发泄在健身上，别发泄在女人身上。对于突然出现的热情异性，请默认对方是来「劫财」的，管住你的钱袋子，你的感情才能少点灾难。',
}

// 星级展示（1-5）
function Stars({ n }: { n: number }) {
  return (
    <span className="text-primary tracking-wide" aria-label={`${n} 星`}>
      {Array.from({ length: 5 }, (_, i) => (i < n ? '★' : '☆')).join('')}
    </span>
  )
}

const CHART_STROKE = '#8B6F47'
const CHART_FILL = '#A0826D'
const CHART_GRID = '#D4A574'

export default function LoveMarriagePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium tracking-wide">爱情姻缘 · 深度报告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* 1. 核心情感模式与死穴 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            核 心 情 感 模 式 与 死 穴
          </h2>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">命理解析</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {核心情感模式.命理解析}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">你的博弈地位</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {核心情感模式.博弈地位}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {核心情感模式.博弈地位简评}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">情感死穴/痛点</p>
            <ul className="space-y-3 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
              {核心情感模式.情感死穴.map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 2. 终身正缘画像：相遇高频地标做定位感 */}
        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            终 身 正 缘 画 像
          </h2>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">外貌/气质特征</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {正缘画像.外貌气质}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">职业/圈层</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {正缘画像.职业圈层}
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">相遇高频地标</p>
            {正缘画像.地标前言 && (
              <p className="text-xs text-muted-foreground/90 pl-3 border-l border-border mb-3">
                {正缘画像.地标前言}
              </p>
            )}
            <div className="relative space-y-0 pl-1">
              {/* 定位/地图标记风格：图钉 + 虚线轨迹感 */}
              {正缘画像.相遇高频地标.map((地标, i) => (
                <div key={i} className="relative flex gap-3 py-4 first:pt-1 last:pb-0">
                  {/* 左侧图钉与轨迹线 */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="rounded-full bg-primary/12 text-primary p-2.5 border-2 border-primary/25 shadow-sm"
                      aria-hidden
                    >
                      <MapPin className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    {i < 正缘画像.相遇高频地标.length - 1 && (
                      <div className="w-px min-h-[16px] mt-1 border-l border-dashed border-primary/25" />
                    )}
                  </div>
                  {/* 地标卡片：类似定位信息块 */}
                  <div className="flex-1 min-w-0 rounded-lg border border-border/80 bg-card/50 px-3 py-2.5 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      地标 {i + 1}
                    </p>
                    <p className="text-sm font-medium text-foreground flex flex-wrap items-center gap-2">
                      {地标.名称}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-normal">
                        {地标.五行标签}
                      </span>
                    </p>
                    <p className="text-xs text-foreground/75 leading-[1.6] mt-1.5">{地标.简注}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">互动剧本</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {正缘画像.互动剧本}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {正缘画像.互动剧本说明}
            </p>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 3. 人生大运情感质量曲线：幸福指数用条形展示 */}
        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            人 生 大 运 情 感 质 量 曲 线
          </h2>

          <div className="space-y-6">
            {大运情感列表.map((运) => (
              <div key={运.区间} className="space-y-3">
                <p className="text-sm font-medium text-foreground tracking-wide">
                  {运.区间}（{运.岁数}）：{运.干支} 运
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">幸福指数</p>
                  <p className="text-base font-medium text-primary">{运.幸福指数} / 100</p>
                </div>
                <Card className="border-border bg-white/60 shadow-none overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-muted-foreground">幸福指数</span>
                      <span className="text-[10px] text-muted-foreground">0 — 100</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{ width: `${运.幸福指数}%`, backgroundColor: CHART_FILL }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground">情感状态关键词</p>
                <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary font-medium">
                  {运.情感状态关键词}
                </p>
                <p className="text-xs text-muted-foreground">关键解读</p>
                <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                  {运.关键解读}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 4. 2026年度情感深度推演 */}
        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 年 度 情 感 深 度 推 演
          </h2>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p className="text-xs text-muted-foreground">流年天干</p>
            <p className="text-foreground/90">{年度情感推演.流年天干}</p>
            <p className="text-xs text-muted-foreground">流年地支</p>
            <p className="text-foreground/90">{年度情感推演.流年地支}</p>
          </div>
          <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
            {年度情感推演.核心象义}
          </p>

          <Card className="border-border bg-muted/10 shadow-none">
            <CardContent className="p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                如果你目前单身（猎爱指南）
              </p>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">脱单概率</p>
                <p className="text-sm font-medium text-foreground">{年度情感推演.单身.脱单概率}</p>
              </div>
              <p className="text-xs text-muted-foreground">命理依据</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {年度情感推演.单身.命理依据}
              </p>
              <p className="text-xs text-muted-foreground">艳遇/邂逅坐标</p>
              <p className="text-sm text-foreground/80 pl-3 border-l border-primary">
                {年度情感推演.单身.艳遇坐标}
              </p>
              <p className="text-xs text-muted-foreground">避坑警示</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
                {年度情感推演.单身.避坑警示}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/10 shadow-none">
            <CardContent className="p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                如果你已有伴侣（防变指南）
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">第三者入侵指数</p>
                <Stars n={年度情感推演.有伴侣.第三者入侵指数} />
              </div>
              <p className="text-xs text-muted-foreground">命理依据</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {年度情感推演.有伴侣.命理依据}
              </p>
              <p className="text-xs text-muted-foreground">潜在危险来源</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
                {年度情感推演.有伴侣.潜在危险来源}
              </p>
              <p className="text-xs text-muted-foreground">维稳手段</p>
              <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {年度情感推演.有伴侣.维稳手段.map((item, i) => (
                  <li key={i}>· {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-border" />

        {/* 5. 2026流月情感风向标 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 流 月 情 感 风 向 标
          </h2>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">激情燃烧月（利约会）</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {流月情感.激情燃烧月.月份}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {流月情感.激情燃烧月.说明}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">信任危机月（防争吵/防抓包）</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-destructive/50">
              {流月情感.信任危机月.月份}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {流月情感.信任危机月.说明}
            </p>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 6. 关键时间点预测 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            关 键 时 间 点 预 测
          </h2>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">容易结婚/定终身的年份</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary">
              {关键时间点.容易结婚年份.map((item, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{item.年份}</span>：{item.说明}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">容易分手/婚变的年份</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
              {关键时间点.容易分手年份.map((item, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{item.年份}</span>：{item.说明}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 7. 情感年度总结 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            情 感 年 度 总 结
          </h2>

          <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
            {情感年度总结.正文}
          </p>
          <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
            {情感年度总结.说明}
          </p>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">军师建议</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-primary font-medium">
              {情感年度总结.军师建议}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
