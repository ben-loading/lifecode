'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

// ——— 动态内容数据（固定标题在 JSX，此处仅放变化内容） ———

const 长期战略 = {
  副标题: '',
  最强赛道A: {
    标签: '天命方向',
    行业领域: '不良资产处置 / 高风险金融风控 / 工程爆破与拆迁 / 危机公关',
    上限高度: '一方诸侯（拥有独立定价权的区域性行业领袖）',
    发展路径:
      '从一线技术或业务骨干切入 -> 积累处理「烂摊子」的特殊案例经验 -> 组建私有化团队 -> 承接高难度、高利润的「清算/重建」类项目。',
    理由:
      '您的命宫「廉贞破军」主破坏与重建，官禄宫「武曲化忌」代表在资金流转困难或执行受阻的环境中反而能体现价值。您是解决「死局」的专家，越乱的环境越适合您。',
  },
  次选赛道B: {
    标签: '稳健方向',
    行业领域: '重工业硬件制造 / 军工安防 / 外科医疗器械',
    简评:
      '利用「武曲」的金属性与刚毅特质，走技术壁垒路线。虽然枯燥，但能有效消耗过剩的火性能量，避免人生大起大落，作为保底选项极为稳妥。',
  },
  模式选择: {
    打工胜率: 20,
    创业胜率: 80,
    角色定位: '您更适合做「开拓者」与「精神领袖」。',
    深度解析:
      '您无法忍受常规的层级压制（廉贞破军）。在打工模式下，您极易功高盖主或因脾气冲撞高层而离职。创业或成为合伙人中的「话事人」是必然归宿，但因官禄宫「武曲化忌」，您必须搭配一位精通财务与细节管理的「守成者」合伙人，否则容易赢了战役输了现金流。',
  },
}

// 人生大运：每人时间范围不同，区间/岁数/干支/条数均由接口按用户返回
const 大运列表 = [
  {
    区间: '2026-2035',
    岁数: '35-44岁',
    干支: '壬子',
    宫位: '大运走田宅宫',
    事业总评分: 75,
    趋势波动指数: [4, 6, 9, 5, 7, 6, 8, 5, 6, 7],
    核心策略: '防守反击 / 资产固化',
    关键解读:
      '这十年是您「安营扎寨」的关键期。大运天干「壬」引发天梁化禄，意味着有长辈或政策红利；但大运地支「子」与本命「午」冲，这十年家庭和内部根据地会有变动。事业上不求虚名，重点在于将利润转化为固定资产（房产、厂房、专利）。这十年是「不管赚多少，留住才是钱」。',
  },
  {
    区间: '2036-2045',
    岁数: '45-54岁',
    干支: '癸丑',
    宫位: '大运走官禄宫',
    事业总评分: 85,
    趋势波动指数: [6, 7, 8, 9, 9, 6, 7, 8, 9, 8],
    核心策略: '二次创业 / 跨界整合',
    关键解读:
      '大运进入身宫（官禄宫），这是您人生事业的巅峰期。虽然有「武曲生年忌」和「贪狼自化忌」的双忌纠缠，但这正是「乱世出英雄」的写照。这十年您会极度忙碌，甚至身兼数职，通过跨界整合资源获得巨大的社会地位。注意：这十年虽然权势重，但现金流依然紧张，属于「资产庞大但手头紧」的状态。',
  },
  {
    区间: '2046-2055',
    岁数: '55-64岁',
    干支: '甲寅',
    宫位: '大运走交友宫',
    事业总评分: 70,
    趋势波动指数: [8, 7, 6, 5, 5, 6, 6, 5, 4, 4],
    核心策略: '退居幕后 / 顾问咨询',
    关键解读:
      '太阳巨门主口舌与名声。这十年不宜再冲锋陷阵，应转型做顾问、导师或行业协会会长。靠过去的威望和人脉吃饭，利用口才变现，而非体力变现。',
  },
]

const 年度事业重心 = {
  副标题: '基于流年丙午火运与命局的生克制化',
  年度关键词: '潜龙勿用、现金为王',
  核心战略:
    '全面收缩防守。2026年是丙午年，与您日主丙火形成「比劫夺财」的极凶格局。事业上会出现强有力的竞争者，或者看似巨大的机会实则是吞噬资金的黑洞。今年的打法不是「赢」，而是「不输」。',
  行动指南: [
    '资产置换：在年初（2月前）将手中的流动资金转化为低风险固定资产或偿还债务，制造「账面没钱」的假象，防止亲友借贷或盲目投资。',
    '拒绝合伙：今年严禁开启任何新的合伙项目，老朋友拉你入伙的十有八九是坑。',
    '专注技术：将精力花在打磨产品或优化内部流程上，减少对外的市场扩张活动。',
  ],
}

const 流月走势 = {
  事业能量流: [3, 2, 4, 2, 1, 3, 5, 7, 8, 9, 8, 6],
  挑战关键流月: [
    '农历四月（巳月）至 农历五月（午月）：火气最旺之时，极易发生冲动决策、下属顶撞、合同纠纷。这两个月建议休假或闭关，少做决策。',
    '农历六月（未月）：容易出现判断失误，看似赚钱的项目实则亏损，警惕诈骗。',
  ],
  高能关键流月: [
    '农历八月（酉月）至 农历九月（戌月）：金气进气，财运回升。上半年的死局此时会出现转机，是催收尾款、结项的好时机。',
    '农历十月（亥月）至 农历十一月（子月）：水火既济，官杀护身。这时候您的权威感最强，利于与高层谈判或确立明年的新方向。',
  ],
}

const 动荡预警 = {
  可能出现的动荡事件: [
    '竞争对手恶意压价或挖角核心团队。',
    '因个人情绪失控（丙火过旺）导致得罪重要客户或监管方。',
    '兄弟朋友借钱不还，导致公司现金流断裂。',
  ],
  回避与止损方案:
    'B计划：提前建立「备用金账户」，该账户不由您亲自管理，交由配偶或信托管理。遇到冲突时，强制自己执行「冷处理24小时」原则，绝不当场拍板。',
}

const 助力分析 = {
  核心助力来源:
    '生肖属猴、鸡（金）或属鼠（水）的人群。在职场上，寻找那些性格冷静、甚至有些冷酷的财务/法务背景人士作为您的「刹车片」。',
  增运建议: [
    '办公位调整：坐北朝南，或在办公室北方放置金属材质的摆件（如铜钟、金蟾）以泄火气。',
    '行为风水：多穿黑色、深蓝色系衣服（五行属水）；避免穿红色、紫色。',
  ],
}

const 事业年度总结 = {
  正文: '2026年是您人生剧本中的「巷战时刻」，不求攻城略地，但求保存有生力量；活下来，2027年就是您的反击主场。',
  评分: 55,
}

// 图表配色（与主报告一致）
const CHART_STROKE = '#8B6F47'
const CHART_FILL = '#A0826D'
const CHART_GRID = '#D4A574'

export default function CareerPathPage() {
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
          <h1 className="text-lg font-medium tracking-wide">仕途探索 · 深度报告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* 1. 长期战略：赛道与模式定位 */}
        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            长 期 战 略：赛 道 与 模 式 定 位
          </h2>
          {长期战略.副标题 && (
            <p className="text-center text-[11px] text-muted-foreground">
              {长期战略.副标题}
            </p>
          )}

          {/* 最强赛道 A */}
          <Card className="border-primary/30 bg-primary/5 shadow-none">
            <CardContent className="p-5 space-y-5">
              <p className="text-sm font-medium text-foreground tracking-wide">
                最强赛道 A · {长期战略.最强赛道A.标签}
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">行业领域</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l-2 border-primary">
                    {长期战略.最强赛道A.行业领域}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">上限高度</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.最强赛道A.上限高度}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">发展路径</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.最强赛道A.发展路径}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">理由</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.最强赛道A.理由}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 次选赛道 B */}
          <Card className="border-border bg-muted/20 shadow-none">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm font-medium text-foreground tracking-wide">
                次选赛道 B · {长期战略.次选赛道B.标签}
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">行业领域</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.次选赛道B.行业领域}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">简评</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.次选赛道B.简评}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 模式选择：打工 VS 创业 */}
          <Card className="border-border bg-background shadow-none">
            <CardContent className="p-5 space-y-5">
              <p className="text-sm font-medium text-foreground tracking-wide">
                模式选择：打工 VS 创业
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>打工 {长期战略.模式选择.打工胜率}%</span>
                  <span>创业 {长期战略.模式选择.创业胜率}%</span>
                </div>
                <div className="h-7 rounded-full overflow-hidden flex bg-muted">
                  <div
                    className="h-full bg-muted-foreground/25 flex items-center justify-end pr-2"
                    style={{ width: `${长期战略.模式选择.打工胜率}%` }}
                  />
                  <div
                    className="h-full bg-primary flex items-center justify-start pl-2"
                    style={{ width: `${长期战略.模式选择.创业胜率}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-muted-foreground tracking-wider">角色定位</p>
                <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                  {长期战略.模式选择.角色定位}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground tracking-wider">深度解析</p>
                <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                  {长期战略.模式选择.深度解析}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-border" />

        {/* 2. 人生大运事业能量曲线：趋势波动指数 -> 图表 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            人 生 大 运 事 业 能 量 曲 线
          </h2>

          <div className="space-y-6">
          {大运列表.map((运) => (
            <div key={运.区间} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-foreground tracking-wide">
                  {运.区间}（{运.岁数}）：{运.干支} 运
                </p>
                <span className="text-xs text-muted-foreground">{运.宫位}</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">事业总评分</p>
                <p className="text-base font-medium text-primary">{运.事业总评分} / 100</p>
              </div>
              <Card className="border-border bg-white/60 shadow-none">
                <CardContent className="p-2 pb-2">
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart
                      data={运.趋势波动指数.map((v, i) => ({ 年: `${i + 1}`, 值: v }))}
                      margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} strokeOpacity={0.3} vertical={false} />
                      <XAxis
                        dataKey="年"
                        tick={{ fontSize: 10, fill: CHART_STROKE }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fontSize: 10, fill: CHART_STROKE }}
                        axisLine={false}
                        tickLine={false}
                        width={20}
                      />
                      <Area
                        type="monotone"
                        dataKey="值"
                        stroke={CHART_STROKE}
                        fill={CHART_FILL}
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-center text-muted-foreground mt-1">趋势波动指数</p>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground">核心策略</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary font-medium">
                {运.核心策略}
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

        {/* 3. 2026年度事业重心与行动指南 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 年 度 事 业 重 心 与 行 动 指 南
          </h2>
          {年度事业重心.副标题 && (
            <p className="text-center text-[11px] text-muted-foreground">
              {年度事业重心.副标题}
            </p>
          )}

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground tracking-wider">年度总基调</p>
            <p className="text-xs text-muted-foreground tracking-wider">年度关键词</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {年度事业重心.年度关键词}
            </p>
            <p className="text-xs text-muted-foreground tracking-wider">核心战略</p>
            <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
              {年度事业重心.核心战略}
            </p>
            <p className="text-xs text-muted-foreground tracking-wider">行动指南</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
              {年度事业重心.行动指南.map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 4. 2026流月走势与关键节点：事业能量流 -> 12 月图表 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 流 月 走 势 与 关 键 节 点
          </h2>

          <p className="text-xs text-muted-foreground tracking-wider">事业能量流</p>
          <Card className="border-border bg-white/60 shadow-none">
            <CardContent className="p-2 pb-2">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={流月走势.事业能量流.map((值, i) => ({
                    月: `${i + 1}月`,
                    值,
                  }))}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} strokeOpacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="月"
                    tick={{ fontSize: 9, fill: CHART_STROKE }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: CHART_STROKE }}
                    axisLine={false}
                    tickLine={false}
                    width={20}
                  />
                  <Bar dataKey="值" fill={CHART_FILL} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground tracking-wider">挑战关键流月（防守期）</p>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
            {流月走势.挑战关键流月.map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground tracking-wider">高能关键流月（进攻期）</p>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary">
            {流月走势.高能关键流月.map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
        </section>

        <Separator className="bg-border" />

        {/* 5. 动荡预警与回避方案 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            动 荡 预 警 与 回 避 方 案
          </h2>

          <p className="text-xs text-muted-foreground tracking-wider">可能出现的动荡事件</p>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
            {动荡预警.可能出现的动荡事件.map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground tracking-wider">回避与止损方案</p>
          <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary">
            {动荡预警.回避与止损方案}
          </p>
        </section>

        <Separator className="bg-border" />

        {/* 6. 助力分析与化解建议 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            助 力 分 析 与 化 解 建 议
          </h2>

          <p className="text-xs text-muted-foreground tracking-wider">核心助力来源</p>
          <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
            {助力分析.核心助力来源}
          </p>
          <p className="text-xs text-muted-foreground tracking-wider">增运建议</p>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
            {助力分析.增运建议.map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
        </section>

        <Separator className="bg-border" />

        {/* 7. 事业年度总结 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            事 业 年 度 总 结
          </h2>

          <p className="text-sm text-foreground/80 leading-[1.8] pl-3 border-l-2 border-primary">
            {事业年度总结.正文}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xs text-muted-foreground">评分</p>
            <p className="text-lg font-medium text-primary">
              {事业年度总结.评分} / 100
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
