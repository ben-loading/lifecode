'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'

// ——— 动态内容数据（固定标题在 JSX 中，此处仅放变化内容，便于后续接接口） ———

const 命格锚点 = {
  人生点题: '烈火狂刀 · 晚运才高',
  时间坐标: '当前公历 2026 年 1 月，处于 乙巳蛇年尾声 / 丙午马年进气 之际。',
  当前大运: '壬子大运 (35-44岁)',
  当前大运简评:
    '正处于大运交接的震荡期，从「福德宫」转入「田宅宫」，人生重心从「搞钱/享受」转向「资产沉淀/家庭根基」，水火交战，内心冲突加剧。',
}

const 去年运势复盘 = {
  年份关键词: '外强中干 · 情绪暗礁',
  深度体感与事件验证:
    '这年流年命宫踩入本命财帛（紫微七杀），你看似风光，实则「太阴化忌」冲入大运命宫（田宅位）。你会觉得在外面你是说了算的大哥，回到家或独处时却有深深的无力感和抑郁感，外部环境给了你赚钱掌权的机会，但同时也掏空了你的精神内核。',
  极有可能发生: [
    '事业上：职位或话语权确实提升了（紫微化科），做了一些「露脸」的大项目，但过程极度消耗，全是硬仗。',
    '与伴侣或异性：家里不安宁。太阴化忌主女性亲属或妻子，可能伴侣身体不好，或者因为房产/家务事发生了长期的冷战/内耗。',
    '身体上：睡眠质量极差，容易失眠多梦，或出现内分泌失调、眼部不适。',
    '意外/变动：为了房子或办公场地的事情操碎了心，可能进行了装修、搬迁或处理不动产纠纷。',
    '破财/花销：资产固化。钱不是花没了，而是变成了房子、设备或者被套牢在某个固定资产里（太阴化忌入田宅）。',
  ],
}

const 本年核心攻略 = {
  副标题: '红泥炉火：丙午流年，火气极旺，双核指导',
  年度总象标题: '烈火焚心 · 悬崖勒马的「修罗场」',
  警报文案:
    '今年是丙午年，天干透丙火，地支午火，你八字本就火旺，火上浇油。最致命的是，流年四化引发「廉贞化忌」，与你本命的生年廉贞化忌重叠（双忌冲命）。这是精神压力、官非、血光的高发年，千万别「作」。',
  财富实战: {
    流年信号: '流年财帛宫在寅（空宫借星），受「双忌」间接影响。八字比劫夺财。',
    行动指南:
      '严禁借贷，严禁担保。今年你的现金流极易断裂。如果有人拉你做「高回报、快周转」的项目，百分之百是坑。利于「火」属性的虚拟/名气变现（如做 IP、咨询、技术服务），不利于重资产投入。',
  },
  情感实战: {
    流年信号: '流年夫妻宫在辰（机梁），天机化权。',
    行动指南:
      '容易因为「谁说了算」而吵架。伴侣今年变得强势且唠叨。未婚者遇到的桃花多是「嘴炮型」或「智力型」，但因为你自身状态（廉贞双忌）极差，容易把好缘分作没了。建议：少见面，多发红包，保持距离美。',
  },
  事业实战: {
    流年信号: '流年官禄宫在戌（火星+陀罗），流年命宫（午）有铃星。',
    行动指南:
      '「熬」字诀。今年职场全是「暗箭」（陀罗）和「急火」（火星）。你会遇到极难缠的客户或极其不合理的工期。',
    策略补充:
      '策略：不要试图硬碰硬，你的「狂刀」今年容易折。适合做幕后技术攻关，或者闭关进修。如果涉及合同法律条款，必须请专业律师过目（防廉贞化忌带来的官非）。',
  },
}

const 未来三年大势 = [
  { 年份标题: '2027 丁未年', 级别: '平/吉', 级别样式: 'default' as const, 描述: '火土相生，泄去过旺的火气。情绪回稳，利于置业或团队稳固，是休养生息的一年。' },
  { 年份标题: '2028 戊申年', 级别: '吉', 级别样式: 'highlight' as const, 描述: '转折大年。土生金（食伤生财），流年踩入「武曲贪狼」位。财运真正爆发的起点，之前的布局开始变现，利于创业或跳槽。' },
  { 年份标题: '2029 己酉年', 级别: '凶中带吉', 级别样式: 'warn' as const, 描述: '流年回到本命宫（廉贞破军），大的变动再次来袭。可能是换城市或行业，但这次你手里有钱（2028 赚的），底气足。' },
]

const 流月战术节奏 = [
  {
    season: '春季',
    stems: '庚寅/辛卯/壬辰',
    stars: '★★',
    summary: '先抑后扬',
    description: '农历一二月容易破财，三月（辰月）天机化权，利于策划和动脑，工作有转机。',
    variant: 'default' as const,
  },
  {
    season: '夏季',
    stems: '癸巳/甲午/乙未',
    stars: '★',
    summary: '极度危险期',
    description:
      '火气最旺的三个月，加上双廉贞化忌。注意心脏、血压、眼睛问题。严禁酒后驾车，严禁与人发生肢体冲突。这三个月能「怂」则「怂」。',
    variant: 'danger' as const,
  },
  {
    season: '秋季',
    stems: '丙申/丁酉/戊戌',
    stars: '★★★',
    summary: '触底反弹',
    description: '金气进气，财运开始回血。之前卡住的项目会在农历七八月出现转机。',
    variant: 'highlight' as const,
  },
  {
    season: '冬季',
    stems: '己亥/庚子/辛丑',
    stars: '★★',
    summary: '',
    description:
      '水火激战。年底容易因为家事（长辈健康或子女问题）分心，工作上收尾即可，别开新坑。',
    variant: 'default' as const,
  },
]

export default function FutureFortunePage() {
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
          <h1 className="text-lg font-medium tracking-wide">未来运势 · 深度报告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* 1. 命格锚点：固定标题 + 动态内容，无英文 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            命 格 锚 点
          </h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground tracking-wider">人生点题</p>
              <p className="text-base font-medium tracking-wider text-foreground pl-3 border-l-2 border-primary">
                {命格锚点.人生点题}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground tracking-wider">时间坐标</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {命格锚点.时间坐标}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground tracking-wider">当前大运</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {命格锚点.当前大运}
              </p>
              <p className="text-xs text-foreground/70 leading-[1.6] pl-3 border-l border-border italic">
                简评：{命格锚点.当前大运简评}
              </p>
            </div>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 2. 去年运势复盘：固定标题 + 动态内容，去掉铁口直断 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            去 年 运 势 复 盘
          </h2>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground tracking-wider">2025年关键词</p>
            <p className="text-sm font-medium text-foreground text-center tracking-wide">
              {去年运势复盘.年份关键词}
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">深度体感与事件验证</p>
              <p className="text-sm text-foreground/80 leading-[1.8] pl-3 border-l border-border text-justify">
                {去年运势复盘.深度体感与事件验证}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">极有可能发生了以下情况</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
              {去年运势复盘.极有可能发生.map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 3. 本年核心攻略：副标题动态，年度总象固定标题+动态，实战为一/二级固定标题+内容动态，无英文 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            本 年 核 心 攻 略
          </h2>
          {本年核心攻略.副标题 && (
            <p className="text-center text-[11px] text-muted-foreground">
              {本年核心攻略.副标题}
            </p>
          )}

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium text-foreground tracking-wide text-center">
                2026 年度总象：{本年核心攻略.年度总象标题}
              </p>
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-2">
                <p className="text-xs font-medium text-destructive tracking-wider">警报</p>
                <p className="text-sm text-foreground/90 leading-[1.7]">
                  {本年核心攻略.警报文案}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="text-sm font-medium tracking-wide text-foreground">财富实战</h3>
            <div className="space-y-2 pl-3 border-l border-border">
              <p className="text-xs text-muted-foreground">流年信号</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">
                {本年核心攻略.财富实战.流年信号}
              </p>
              <p className="text-xs text-muted-foreground pt-1">行动指南</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">
                {本年核心攻略.财富实战.行动指南}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium tracking-wide text-foreground">情感实战</h3>
            <div className="space-y-2 pl-3 border-l border-border">
              <p className="text-xs text-muted-foreground">流年信号</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">
                {本年核心攻略.情感实战.流年信号}
              </p>
              <p className="text-xs text-muted-foreground pt-1">行动指南</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">
                {本年核心攻略.情感实战.行动指南}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium tracking-wide text-foreground">事业实战</h3>
            <div className="space-y-2 pl-3 border-l border-border">
              <p className="text-xs text-muted-foreground">流年信号</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">
                {本年核心攻略.事业实战.流年信号}
              </p>
              <p className="text-xs text-muted-foreground pt-1">行动指南</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">
                {本年核心攻略.事业实战.行动指南}
              </p>
              {本年核心攻略.事业实战.策略补充 && (
                <p className="text-sm text-foreground/80 leading-[1.7] pt-1">
                  {本年核心攻略.事业实战.策略补充}
                </p>
              )}
            </div>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 4. 未来三年大势：年份为固定标题，级别+描述为动态 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            未 来 三 年 大 势
          </h2>

          <div className="space-y-4">
            {未来三年大势.map((item) => (
              <div
                key={item.年份标题}
                className={`pl-3 border-l space-y-1 ${
                  item.级别样式 === 'highlight'
                    ? 'border-primary'
                    : item.级别样式 === 'warn'
                      ? 'border-border'
                      : 'border-border'
                }`}
              >
                <p className="text-sm font-medium text-foreground tracking-wide">{item.年份标题}</p>
                <span
                  className={`inline-block text-xs px-1.5 py-0.5 rounded mt-1 ${
                    item.级别样式 === 'highlight'
                      ? 'bg-primary/20 text-primary'
                      : item.级别样式 === 'warn'
                        ? 'border border-amber-500/50 text-amber-700'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.级别}
                </span>
                <p className="text-sm text-foreground/80 leading-[1.7] pt-1">{item.描述}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 5. 流月战术节奏：固定标题(春/夏/秋/冬) + 变化内容 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 流 月 战 术 节 奏
          </h2>
          <p className="text-center text-[11px] text-muted-foreground">
            针对 2026 丙午年的关键月份提醒
          </p>

          <div className="space-y-4">
            {流月战术节奏.map((item) => (
              <div
                key={item.season}
                className={`pl-3 border-l space-y-1 ${
                  item.variant === 'danger'
                    ? 'border-destructive/50'
                    : item.variant === 'highlight'
                      ? 'border-primary'
                      : 'border-border'
                }`}
              >
                <p className="text-sm font-medium text-foreground tracking-wide">{item.season}</p>
                <p
                  className={`text-xs ${
                    item.variant === 'danger'
                      ? 'text-destructive font-medium'
                      : item.variant === 'highlight'
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                  }`}
                >
                  {item.stems}
                  {item.stars ? ` · ${item.stars}` : ''}
                  {item.summary ? ` ${item.summary}` : ''}
                </p>
                <p className="text-sm text-foreground/80 leading-[1.7] pt-0.5">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
