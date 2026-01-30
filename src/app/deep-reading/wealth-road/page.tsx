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

const 财富格局总定调 = {
  财富能量级: 'A级 (高波动/高爆发型)',
  财富能量级简评:
    '你是典型的「乱世之财」格局。你的财富不是靠朝九晚五攒出来的，而是靠「杀破狼」的动荡格局在市场混乱中掠夺而来的。属于「险中求财」与「权力变现」的混合体。',
  核心驱动引擎:
    '破坏性重组与资源垄断。你的命宫廉贞破军，财帛宫紫微七杀，这说明你的钱带有很强的「血腥味」或「竞争性」。你赚钱的核心不靠技术细节，而靠魄力、靠敢于接手别人不敢碰的烂摊子，或者利用信息差进行降维打击。',
}

const 投资理财 = {
  投资风格评级: '激进型 (偏赌徒性质)',
  投资风格说明:
    '你的财帛宫坐紫微七杀，对小钱看不上，总想「一把梭哈」。这种心态在顺运时能暴富，在背运时(如2026年)容易归零。',
  // 适合的资产种类：每项均为变化内容（不同用户标的不同）
  适合的资产种类: [
    {
      名称: '不动产 (土/水)',
      推荐指数: 5,
      建议: '这是你人生唯一的「安全气囊」。',
      逻辑支撑:
        '你马上进入35-44岁大运(壬子运)，这十年大运命宫重叠原局田宅宫。田宅宫坐天同(化禄)+太阴(财星)。这十年是你这辈子房产运最好的十年。天同化禄代表「坐享其成」，太阴代表「不动产」。',
      操作策略:
        '必须将现金转化为核心地段的住宅或具有稳定现金流的资产。你的八字火炎土燥，急需「湿土」来晦火生金，房产即为土，是你的财库。',
    },
    {
      名称: '现金/存款 (金)',
      推荐指数: 1,
      建议: '极度危险，手中留不住现金。',
      逻辑支撑:
        '2026年丙午年，加上你八字本身比劫重重(火多)，现金就是「燃料」，放在手里会被朋友借走、被消费主义烧掉、或者因为盲目投资亏掉。',
    },
    {
      名称: '股票/金融 (水/金)',
      推荐指数: 2,
      建议: '只适合超长线，严禁短线合约。',
      逻辑支撑:
        '你的官禄宫(身宫)坐武曲贪狼，但武曲化忌。武曲是正财星，化忌代表「资金链断裂」或「投资失误」。你在金融操作上容易因为贪心(贪狼)而遭遇黑天鹅(武曲忌)。',
    },
  ],
  避坑指南:
    '你这辈子绝对不能碰的投资领域是：私人借贷与高杠杆期货。你的交友宫虽有太阳巨门，但也容易因「义气」而破财，2026年尤其严禁借钱给兄弟朋友。',
}

// 人生大运：每人时间范围不同，区间/岁数/干支/条数均由接口按用户返回
const 大运财富列表 = [
  {
    区间: '2026-2035',
    岁数: '35-44岁',
    干支: '壬子',
    宫位: '大运走田宅宫',
    财富总评分: 90,
    趋势波动指数: [4, 6, 8, 9, 8],
    核心策略: '防守反击 / 资产固化',
    关键解读:
      '这十年是你人生的「库运」。天干壬水引发天梁化禄(在大运官禄)，地支子水为大运田宅主事。前两年(2026-2027)是换运期，会有动荡，现金流可能紧张。中后期财富能级极高，但这种财主要体现在「资产增值」上，而不是工资收入。必须在这十年把所有赚到的钱变成「砖头」，因为这十年天同化禄在田宅，房子会养你。',
  },
  {
    区间: '2036-2045',
    岁数: '45-54岁',
    干支: '癸丑',
    宫位: '大运走官禄宫',
    财富总评分: 65,
    趋势波动指数: [7, 5, 3, 4, 6],
    核心策略: '转型 / 止损 / 守成',
    关键解读:
      '这十年也是你的身宫所在。重点注意「武曲化忌」和「贪狼化忌」的双重影响。武曲化忌：容易出现严重的资金周转不灵。贪狼化忌：容易因为桃色纠纷或贪小便宜而破大财。这十年不宜再盲目扩张，适合做顾问或利用之前的资产吃老本。',
  },
  {
    区间: '2046-2055',
    岁数: '55-64岁',
    干支: '壬寅',
    宫位: '大运走交友宫',
    财富总评分: 75,
    趋势波动指数: [5, 6, 7, 7, 6],
    核心策略: '名声变现 / 资源整合',
    关键解读:
      '太阳巨门主事，靠嘴巴和名声赚钱。这时候你已经是行业老炮，更多是靠人脉分红。',
  },
]

const 年度财运推演 = {
  求财重心:
    '2026年是丙午年，流年命宫在午(子女宫)。八字上是「比劫夺财」的一年。结论：今年很难靠「正规利润」赚钱，求财重心在于「被动防御」。与其想怎么赚，不如想怎么「花」。主动把钱花在装修、买房、置换设备上，叫「应劫」。',
  财运能量流: [3, 2, 4, 1, 3, 6, 8, 9, 7, 5, 4, 3],
  总体趋势: '先抑后扬，夏季最凶。',
  进财爆发月: [
    '农历七月(申月)、八月(酉月)。',
    '秋季金旺，是你的财星得地之时。如果有大额回款或投资变现，必须卡在这两个月完成，过了十月入冬，财气又会减弱。',
  ],
  破财高危月: [
    '农历四月(巳月)、五月(午月)。',
    '即公历的5月-7月。这是火最旺的时候，比劫夺财最凶。极大可能发生：突发性罚款、汽车损坏、被人借钱不还、冲动投资被套。在这三个月，建议开启「隐身模式」，不要做任何重大财务决策。',
  ],
}

const 财富漏洞与动荡 = {
  最大的耗财黑洞:
    '情绪化消费与面子工程。你的命宫破军耗星，身宫武曲化忌。你经常在心情不好或极度兴奋时，为了证明自己而进行大额消费或盲目投资。',
  二零二六特定风险:
    '兄弟劫财。丙午年，流年干支全是火(你的比劫)。这意味着你身边的「朋友」、「合伙人」、「兄弟」是今年最大的破财源头。警惕：不要在这个年份与人合伙做新生意，不要为人做担保。',
  止损方案: [
    '预付式消费：年初主动给家人买保险、或者预定长期的固定资产投资，把现金「花光」。',
    '物理隔离：对于找你借钱的人，直接哭穷，不要露富。',
    '契约锁死：所有商业往来必须走最严格的法律合同，武曲化忌最怕口头承诺。',
  ],
}

const 财富年度总结 = {
  正文: '2026年对于你而言，是「现金流的熔断年，资产库的筑基年」。',
  现金流评分: 45,
  资产置换机遇评分: 85,
  最终建议:
    '别想着在2026年发横财，这一年的主旋律是「活下去」和「换赛道」。利用大运进入田宅宫的契机，将手里发烫的现金换成冰冷的房产，这是你穿越接下来2026红色警报区的唯一诺亚方舟。守住这一年，35岁后的田宅大运自然会带你起飞。',
}

// 推荐指数 -> 星级展示（1-5）
function Stars({ n }: { n: number }) {
  return (
    <span className="text-primary tracking-wide" aria-label={`推荐指数 ${n} 星`}>
      {Array.from({ length: 5 }, (_, i) => (i < n ? '★' : '☆')).join('')}
    </span>
  )
}

const CHART_STROKE = '#8B6F47'
const CHART_FILL = '#A0826D'
const CHART_GRID = '#D4A574'

export default function WealthRoadPage() {
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
          <h1 className="text-lg font-medium tracking-wide">财富之路 · 深度报告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* 1. 财富格局总定调 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            财 富 格 局 总 定 调
          </h2>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">财富能量级</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {财富格局总定调.财富能量级}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              简评：{财富格局总定调.财富能量级简评}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">核心驱动引擎</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {财富格局总定调.核心驱动引擎}
            </p>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 2. 投资理财与资产配置：适合的资产种类为动态列表（不动产等均为变化内容） */}
        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            投 资 理 财 与 资 产 配 置
          </h2>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground tracking-wider">投资风格评级</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {投资理财.投资风格评级}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {投资理财.投资风格说明}
            </p>
          </div>

          <p className="text-xs text-muted-foreground tracking-wider">适合的资产种类</p>
          <div className="space-y-5">
            {投资理财.适合的资产种类.map((item, index) => (
              <Card key={index} className="border-border bg-muted/10 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">{item.名称}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>推荐指数</span>
                    <Stars n={item.推荐指数} />
                  </p>
                  <p className="text-sm text-foreground/85 leading-[1.75] font-medium">
                    {item.建议}
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">逻辑支撑</p>
                    <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
                      {item.逻辑支撑}
                    </p>
                  </div>
                  {item.操作策略 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">操作策略</p>
                      <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
                        {item.操作策略}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">避坑指南</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-destructive/50">
              {投资理财.避坑指南}
            </p>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 3. 人生大运财富量化曲线：趋势波动指数 -> 图表 */}
        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            人 生 大 运 财 富 量 化 曲 线
          </h2>

          <div className="space-y-6">
            {大运财富列表.map((运) => (
              <div key={运.区间} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground tracking-wide">
                    {运.区间}（{运.岁数}）：{运.干支} 运
                  </p>
                  <span className="text-xs text-muted-foreground">{运.宫位}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">财富总评分</p>
                  <p className="text-base font-medium text-primary">{运.财富总评分} / 100</p>
                </div>
                <Card className="border-border bg-white/60 shadow-none">
                  <CardContent className="p-2 pb-2">
                    <ResponsiveContainer width="100%" height={120}>
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

        {/* 4. 2026年度财运深度推演：财运能量流 -> 12 月图表 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 年 度 财 运 深 度 推 演
          </h2>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">2026求财重心</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {年度财运推演.求财重心}
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">财运能量流（按农历月份）</p>
            <p className="text-xs text-muted-foreground">总体趋势：{年度财运推演.总体趋势}</p>
            <Card className="border-border bg-white/60 shadow-none">
              <CardContent className="p-2 pb-2">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={年度财运推演.财运能量流.map((值, i) => ({
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
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">进财爆发月</p>
            <div className="pl-3 border-l border-primary space-y-1">
              <p className="text-sm font-medium text-foreground">{年度财运推演.进财爆发月[0]}</p>
              <p className="text-sm text-foreground/80 leading-[1.75]">{年度财运推演.进财爆发月[1]}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">破财高危月</p>
            <div className="pl-3 border-l border-destructive/50 space-y-1">
              <p className="text-sm font-medium text-foreground">{年度财运推演.破财高危月[0]}</p>
              <p className="text-sm text-foreground/80 leading-[1.75]">{年度财运推演.破财高危月[1]}</p>
            </div>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 5. 财富漏洞与动荡分析 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            财 富 漏 洞 与 动 荡 分 析
          </h2>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">最大的耗财黑洞</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {财富漏洞与动荡.最大的耗财黑洞}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">2026特定风险</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-destructive/50">
              {财富漏洞与动荡.二零二六特定风险}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">止损方案</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
              {财富漏洞与动荡.止损方案.map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 6. 财富年度总结 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            财 富 年 度 总 结
          </h2>

          <p className="text-sm text-foreground/80 leading-[1.8] pl-3 border-l-2 border-primary">
            {财富年度总结.正文}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-xs text-muted-foreground">财运评分</span>
            <span className="text-sm text-foreground/80">
              现金流 <strong className="text-foreground">{财富年度总结.现金流评分} 分</strong>
              {' · '}
              资产置换机遇 <strong className="text-primary">{财富年度总结.资产置换机遇评分} 分</strong>
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
            {财富年度总结.最终建议}
          </p>
        </section>
      </div>
    </main>
  )
}
