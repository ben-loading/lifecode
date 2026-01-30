'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'
import { Share2, BookOpen, Menu } from 'lucide-react'
import { useAppContext } from '@/lib/context'
import { useState, useEffect } from 'react'
import { SideMenu } from '@/components/side-menu'
import { ShareDialog } from '@/components/share-dialog'
import { getReportJobStatus, getMainReport } from '@/lib/api-client'
import type { ApiMainReport } from '@/lib/types/api'

// 分析步骤
const analysisStepsConfig = [
  { id: 1, label: '编码解析', status: '进行中' },
  { id: 2, label: '采用紫微斗数进行命理排盘', status: '进行中' },
  { id: 3, label: '先天命盘解析', status: '进行中' },
  { id: 4, label: '全域能量解析', status: '进行中' },
  { id: 5, label: '大限走势解析', status: '进行中' },
  { id: 6, label: '输出解码结果', status: '进行中' },
]

export default function ReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const archiveId = searchParams.get('archiveId')
  const { user, hasCompletedMainReport, setHasCompletedMainReport, setUser } = useAppContext()
  const [showMenu, setShowMenu] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [mainReport, setMainReport] = useState<ApiMainReport | null>(null)
  const hasJobFromUrl = Boolean(jobId && archiveId)
  const [isAnalyzing, setIsAnalyzing] = useState(hasJobFromUrl || !hasCompletedMainReport)
  const [currentStep, setCurrentStep] = useState(
    hasCompletedMainReport ? analysisStepsConfig.length : 0,
  )
  const analysisSteps = analysisStepsConfig.map((step) => ({
    ...step,
    status: currentStep >= step.id ? '完成' : currentStep === step.id - 1 ? '进行中' : '未开始',
  }))

  // 有 jobId+archiveId 时轮询任务状态，完成后拉取主报告并更新 currentArchiveId
  useEffect(() => {
    if (!jobId || !archiveId) return
    let cancelled = false
    const poll = async () => {
      try {
        const job = await getReportJobStatus(jobId)
        if (cancelled) return
        if (job.status === 'running' && job.currentStep != null) {
          setCurrentStep(job.currentStep)
        }
        if (job.status === 'completed') {
          const report = await getMainReport(archiveId)
          if (cancelled) return
          if (report) setMainReport(report)
          setUser((prev) => ({ ...prev, currentArchiveId: archiveId }))
          setHasCompletedMainReport(true)
          setIsAnalyzing(false)
          setCurrentStep(analysisStepsConfig.length)
          return
        }
        if (job.status === 'failed') {
          setIsAnalyzing(false)
          return
        }
      } catch {
        // 继续轮询
      }
      if (!cancelled) setTimeout(poll, 1500)
    }
    poll()
    return () => {
      cancelled = true
    }
  }, [jobId, archiveId, setUser, setHasCompletedMainReport])

  // 无 jobId 但有 currentArchiveId 时（如刷新页）：拉取主报告
  useEffect(() => {
    if (jobId || mainReport || !user.currentArchiveId) return
    getMainReport(user.currentArchiveId).then((report) => {
      if (report) setMainReport(report)
    }).catch(() => {})
  }, [jobId, user.currentArchiveId, mainReport])

  // 无 jobId 时：模拟分析过程（仅首次生成报告时播放）
  useEffect(() => {
    if (hasJobFromUrl || hasCompletedMainReport || !isAnalyzing) {
      if (!hasJobFromUrl) setCurrentStep(analysisStepsConfig.length)
      return
    }
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisStepsConfig.length) return prev + 1
        setIsAnalyzing(false)
        setHasCompletedMainReport(true)
        return prev
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [hasJobFromUrl, hasCompletedMainReport, isAnalyzing, setHasCompletedMainReport])

  // 人生剧本数据（优先使用 API 主报告）
  const lifeScript = {
    title: mainReport?.lifeScriptTitle ?? '怒海争锋·破蛋成蝶',
    description:
      mainReport?.lifeScriptDescription ??
      '早年性格叛逆，多才多艺但学而不精（文曲忌）。中年（32-41岁）经历重大的人生转折与压力洗礼，在动荡中确立地位。晚年掌握实权，财富丰厚。',
  }

  const coreAbility =
    mainReport?.coreAbility ??
    '越是危机时刻，越是规则崩坏的地方，你的直觉和执行力越强。你是天生的"战时CEO"或"救火队长"。'

  const radarData = mainReport?.radarData ?? [
    { name: '自我', value: 95, fullMark: 100 },
    { name: '财富', value: 82, fullMark: 100 },
    { name: '事业', value: 85, fullMark: 100 },
    { name: '情感', value: 45, fullMark: 100 },
    { name: '人脉', value: 68, fullMark: 100 },
    { name: '家庭', value: 65, fullMark: 100 },
    { name: '健康', value: 60, fullMark: 100 },
  ]

  const dimensionDetails = mainReport?.dimensionDetails ?? [
    { 
      title: '自我', 
      level: 'S级', 
      description: '八字身极强，比劫重重。自信心爆棚，主观意识过强，甚至有点自恋和独断专行。' 
    },
    { 
      title: '财富', 
      level: 'A级', 
      description: '命带财库但被冲，紫微七杀掌财。具备爆发式致富的能量，但缺乏守财的能量。' 
    },
    { 
      title: '事业', 
      level: 'A级', 
      description: '官禄宫武曲贪狼，配合八字杀印相生。越到中年（35岁后）能量越强，是典型的晚发型选手。' 
    },
    { 
      title: '情感', 
      level: 'C级', 
      description: '夫妻宫状态极差，不仅空宫还带"劫"。感情是你最大的软肋，也是最耗损你能量的地方。' 
    },
    { 
      title: '人脉', 
      level: 'B级', 
      description: '交友宫巨门太阳。朋友多，但多是利益之交或者是来蹭你热度的"酒肉朋友"，真心的少。' 
    },
    { 
      title: '家庭', 
      level: 'B级', 
      description: '田宅宫天同太阴，虽然不错，但你常年在外征战，家庭对你来说只是一个旅馆。' 
    },
    { 
      title: '健康', 
      level: 'B级', 
      description: '火气太旺，注意心血管、眼疾和呼吸系统。' 
    },
  ]

  // 性格特质构成数据 - 色块数量可变（4-6个）
  const personalityTraits = [
    { label: '领子工作', value: 85 },
    { label: '晚景休闲', value: 65 },
    { label: '寅卯空', value: 72 },
    { label: '正印', value: 80 },
    { label: '合', value: 70 },
  ]

  // 性格标签数据 - 标签数量可变（4-6个）
  const personalityLabels = ['理性', '果断', '独立', '敏锐', '坚韧', '创新']

  // 流年运势图表数据
  const yearlyFortuneData = [
    { year: '2024', value: 40 },
    { year: '2025', value: 25 },
    { year: '2026', value: 15 },
  ]

  // 流年运势详细描述 - 2026年为重点突出
  const yearlyDetails = [
    {
      year: '2024',
      stem: '甲辰',
      level: '平/吉',
      description: '有新的机会萌芽，但比较隐晦，内心焦虑感重。',
      isHighlight: false,
    },
    {
      year: '2025',
      stem: '乙巳',
      level: '凶',
      description: '巳亥冲，巳申刑。这一年非常动荡，可能涉及搬家、换工作或破大财，人际关系紧张。',
      isHighlight: false,
    },
    {
      year: '2026',
      stem: '丙午',
      level: '大凶（预警）',
      description: '你是丙火，流年又是丙午（烈火）。这是"比劫夺财"的极值。',
      details: '竞争白热化，现金流极度紧张。你会发现满大街都是你的竞争对手，或者你的合作伙伴突然翻脸分钱。极度容易冲动投资导致亏损。',
      strategy: '躺平装死，苟住现金。绝对不要在2026年加杠杆、扩规模。',
      isHighlight: true,
    },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => setShowMenu(true)}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-lg tracking-wider font-medium text-primary">人生解码</span>
          <button
            onClick={() => router.push('/chart')}
            className="text-foreground hover:opacity-70 transition-opacity"
            aria-label="查看紫微斗数命盘"
          >
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      {isAnalyzing ? (
        /* Analyzing State */
        <div className="px-5 py-8 min-h-[calc(100vh-130px)] flex flex-col">
          {/* User Info Section - Top Position */}
          <section className="text-center space-y-3 mb-8">
            <h1 className="text-2xl tracking-[0.2em] font-semibold">{user.archiveName || 'KC小可爱'}</h1>
            <p className="text-xs text-muted-foreground">正在解码中...</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              解码不会因关闭页面而中断，完成后将通过邮箱通知
            </p>
          </section>

          <Separator className="bg-border mb-6" />

          {/* Analysis Steps with Enhanced Design */}
          <div className="space-y-4 flex-1">
            {analysisStepsConfig.map((step, index) => {
              const isCompleted = index < currentStep
              const isInProgress = index === currentStep && isAnalyzing

              return (
                <div key={step.id} className="flex items-start gap-4">
                  {/* Custom Step Indicator */}
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground scale-100'
                          : isInProgress
                            ? 'bg-primary text-primary-foreground scale-110'
                            : 'bg-border text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? '✓' : isInProgress ? '●' : '○'}
                    </div>
                    {index < analysisStepsConfig.length - 1 && (
                      <div
                        className={`w-0.5 h-12 transition-colors duration-500 ${
                          isCompleted ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pt-1">
                    <p
                      className={`text-sm font-medium tracking-wide transition-colors duration-500 ${
                        isCompleted || isInProgress ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isCompleted ? '已完成' : isInProgress ? '进行中' : '待处理'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress Percentage */}
          <div className="mt-8 pt-6 border-t border-border text-center space-y-2">
            <p className="text-2xl font-medium text-primary">
              {Math.round((currentStep / analysisStepsConfig.length) * 100)}%
            </p>
            <p className="text-xs text-muted-foreground">分析进度</p>
          </div>
        </div>
      ) : (
        /* Report State */
        <div className="px-5 py-8 space-y-8 flex flex-col">
          {/* User Info Section */}
          <section className="text-center space-y-3">
            <h1 className="text-2xl tracking-[0.2em] font-semibold">{user.archiveName || 'KC小可爱'}</h1>
            <p className="text-sm text-muted-foreground tracking-wide">{mainReport?.baziDisplay ?? '己已 辛未 乙未 癸未'}</p>
          </section>

          <Separator className="bg-border" />

          {/* 人生主线 */}
          <section className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground tracking-widest uppercase">人 生 剧 本</p>
              <h2 className="text-xl tracking-wider font-medium">怒海争锋·破蛋成蝶</h2>
            </div>
            <p className="text-sm text-foreground/70 leading-[1.8] text-justify">
              早年性格叛逆，多才多艺但学而不精（文曲忌）。中年（32-41岁）经历重大的人生转折与压力洗礼，在动荡中确立地位。晚年掌握实权，财富丰厚。
            </p>
          </section>

          <Separator className="bg-border" />

          {/* 核心能力 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">核 心 能 力</h3>
            <p className="text-sm text-foreground/70 leading-[1.8] text-justify">
              越是危机时刻，越是规则崩坏的地方，你的直觉和执行力越强。你是天生的"战时CEO"或"救火队长"。
            </p>
            <p className="text-sm text-foreground/70 leading-[1.8] text-justify">
              #破壁者 #拓荒领袖
            </p>
          </section>

          <Separator className="bg-border" />

          {/* 性格特质构成 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
              性格特质构成
            </h3>
            <Card className="border-border bg-white/60 shadow-none">
              <CardContent className="p-6">
                {/* 五行属性柱状图 - 自适应列数 */}
                <div 
                  className="grid gap-2 text-center"
                  style={{ 
                    gridTemplateColumns: `repeat(${personalityTraits.length}, minmax(0, 1fr))` 
                  }}
                >
                  {personalityTraits.map((trait, index) => (
                    <div key={index} className="space-y-1">
                      <div 
                        className="h-16 bg-primary rounded-sm flex items-end justify-center pb-1"
                        style={{ opacity: 0.3 + (trait.value / 100) * 0.7 }}
                      >
                        <span className="text-[8px] text-white">{trait.value}%</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">{trait.label}</p>
                    </div>
                  ))}
                </div>

                {/* 特质标签 - 支持动态数量 */}
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {personalityLabels.map((label) => (
                    <span
                      key={label}
                      className="px-3 py-1 text-xs border border-[#ccc] rounded-full text-foreground/70"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator className="bg-border" />

          {/* 宫位解析 */}
          <section className="space-y-6">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">宫 位 解 析</h3>

            {/* 表层性格 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">表层性格</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">两火日元</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  日元为火，命中又见火，形成"双火交辉"之象。代表热情、活力、行动力极强，
                  但也需注意火旺则燥，容易急躁冲动。建议修心养性，以水济火。年柱干支显示早年环境对性格形成有重要影响，
                  月柱体现家庭氛围与社交模式，日柱代表核心自我。
                </p>
              </div>
            </div>

            {/* 深层欲望 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">深层欲望</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">命宫遇六破军</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  破坏性与创造性并存，与平庸绝缘的灵性觉醒（编码：参考破绝灵典Z）描述略。
                  贵人相助、六亲缘薄，但成就非凡。破军星入命，主变动、开创，一生多经历重大转折，
                  每次转变都是突破自我的契机。宜从事开创性工作，不宜守成。
                </p>
              </div>
            </div>

            {/* 思维模式 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">思维模式</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">官煞武曲负搭</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  破坏与创造性并存（编码）描述略，代表事业心极强。武曲星主财帛、决断，
                  七杀星主权威、魄力。两星相会，形成"将星"格局。事业上宜掌权、宜独立创业，
                  但需注意贪多嚼不烂，聚焦核心目标方能成就大业。35岁后事业运明显上升。
                </p>
              </div>
            </div>

            {/* 财富逻辑 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">财富逻辑</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">财帛欣陆七杀</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  财运方面呈现"机遇与风险并存"的格局。擅长把握商机，但需警惕投机心理。
                  建议稳扎稳打，积累实力后再图大发展。七杀入财帛宫，主财来财去、大起大落。
                  宜从事竞争性强的行业，如金融、投资、销售等。35岁后财运渐旺，40岁迎来财富高峰期。
                </p>
              </div>
            </div>

            {/* 情感模式 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">情感模式</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">夫妻宫宋宫·左右</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  帝级气场与大器格局，能吸引优秀伴侣。但两颗主星同宫也意味着"双王会合"，
                  婚姻中需注意相互尊重，避免因个性太强而产生摩擦。伴侣"崩入一"，贵气。
                  左辅右弼同宫，主贵人多助，婚姻中能得到伴侣家族的支持与帮助。
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* 多维解析与验证 - 雷达图 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
              能量分析
            </h3>
            <Card className="border-border bg-white/60 shadow-none">
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="#D4A574" strokeDasharray="3 3" strokeOpacity={0.3} />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#8B6F47', fontWeight: 500 }}
                    />
                    <Radar
                      name="能力值"
                      dataKey="value"
                      stroke="#8B6F47"
                      fill="#A0826D"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 七维详细说明 */}
            <div className="space-y-4 mt-6">
              {dimensionDetails.map((item) => (
                <div key={item.title} className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-primary text-white rounded">
                      {item.level}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-[1.8] pl-0">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-border" />

          {/* 专业天命 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">专 业 天 命</h3>
            <div className="space-y-4">
              {/* 五行赛道 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">五行赛道</p>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  <span className="font-medium text-foreground">金/水</span>。你需要"金"来被你炼化（变现），需要"水"来降温（控制风险）。
                </p>
              </div>

              {/* 具体行业 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">具体行业</p>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  金融（尤其是风投、并购）、互联网技术架构、能源交易、特种设备制造。
                </p>
              </div>

              {/* 职能定位 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">职能定位</p>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  <span className="font-medium text-foreground">开疆拓土的大将</span>。不要做守成的行政，不要做需要耐心的客服。去做销售总监、项目发起人、或者独立创业者。
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* 人生阶段 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">人 生 四 阶</h3>
            <div className="space-y-5">
              {/* 少年期 */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">少年期</span>
                  <span className="text-xs text-muted-foreground">5～24</span>
                </div>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  动荡不安，学业起伏，可能早早离家或与父母缘分浅（父母宫陀罗火星）。
                </p>
              </div>

              {/* 青年期 */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">青年期</span>
                  <span className="text-xs text-muted-foreground">25～44</span>
                </div>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  试错期。在不同的赛道横冲直撞，虽然有高光时刻，但财来财去，很难沉淀大钱。
                </p>
              </div>

              {/* 中年期 */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">中年期</span>
                  <span className="text-xs text-muted-foreground">45～64</span>
                </div>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  黄金爆发期。官禄宫武曲贪狼发力，此时你已学会控制情绪，经验转化为直觉，财富量级将指数级跃升。
                </p>
              </div>

              {/* 晚年期 */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">晚年期</span>
                  <span className="text-xs text-muted-foreground">65+</span>
                </div>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  归隐田园。福德宫天府禄存，晚年反而能享受到物质带来的安稳。
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* 流年运势 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">流 年 运 势</h3>
            <Card className="border-border bg-white/60 shadow-none">
              <CardContent className="p-3 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={yearlyFortuneData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4A574" strokeOpacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: '#8B6F47', fontWeight: 500 }}
                      axisLine={{ stroke: '#D4A574', strokeOpacity: 0.4 }}
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#A89680' }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      width={30}
                    />
                    <Area
                      type="natural"
                      dataKey="value"
                      stroke="#8B6F47"
                      fill="#A0826D"
                      fillOpacity={0.2}
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-muted-foreground mt-1">← 风险指数走势</p>
              </CardContent>
            </Card>

            {/* 流年详细描述 */}
            <div className="space-y-5 mt-6">
              {yearlyDetails.map((item) => (
                <div key={item.year} className={item.isHighlight ? 'space-y-3' : 'space-y-2'}>
                  {item.isHighlight ? (
                    // 2026年重点突出样式
                    <>
                      <div className="text-center py-2 bg-primary text-white rounded-sm">
                        <p className="text-sm tracking-wider">
                          {item.year} ({item.stem}) | {item.level}
                        </p>
                      </div>
                      <div className="space-y-3 px-3 py-4 bg-[#f5f4f2] rounded-sm border-l-2 border-primary">
                        <p className="text-sm text-foreground/70 leading-[1.8]">
                          {item.description}
                        </p>
                        {item.details && (
                          <p className="text-sm text-foreground/70 leading-[1.8]">
                            {item.details}
                          </p>
                        )}
                        {item.strategy && (
                          <div className="pt-2 mt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-1">策略建议</p>
                            <p className="text-sm text-foreground leading-[1.8] font-medium">
                              {item.strategy}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    // 2024、2025年常规样式
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">{item.year} ({item.stem})</span>
                        <span className="text-xs text-muted-foreground">{item.level}</span>
                      </div>
                      <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                        {item.description}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-border" />

          {/* 社交名片 / 结语 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">社 交 名 片</h3>
            <Card className="border-border bg-[#f5f4f2]">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  你这辈子是来战斗和掠夺的，不是来享受岁月静好的。你的成就建立在对他人的征服和对规则的重塑之上。
                </p>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  你最大的敌人不是别人，是你那无法遏制的赌徒心态。在2026年这种"火上浇油"的年份，如果你学不会"认怂"，可能会把过去十年的积累一把输光。
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Footer Actions */}
          <section className="pt-6 pb-4 space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={() => setShowShareDialog(true)}
                variant="outline"
                className="flex-1 h-12 rounded-full bg-transparent"
              >
                <Share2 className="w-4 h-4 mr-2" />
                分享一下
              </Button>
              <Button
                onClick={() => router.push('/deep-reading')}
                className="flex-1 h-12 rounded-full"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                深度解读
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Side Menu */}
      <SideMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        archiveName={user.archiveName || 'KC小可爱'}
        userEmail={user.email || 'luo luo@gmail.com'}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        archiveName={user.archiveName || 'KC小可爱'}
        lifeScriptTitle={lifeScript.title}
        coreAbility={coreAbility}
      />
    </main>
  )
}
