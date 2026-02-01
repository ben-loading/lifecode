'use client'

import { Suspense } from 'react'
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
import { getReportJobStatus, getMainReport, getReportArchiveStatus, createReportJob, createReportJobRetry } from '@/lib/api-client'
import type { ApiMainReport } from '@/lib/types/api'

// 分析步骤：与后端流程对应（时辰→八字→排盘→先天→大限/流年→输出），前端用计时驱动，不依赖轮询步进
const analysisStepsConfig = [
  { id: 1, label: '分析时辰', subLabel: '解析出生时间与地区' },
  { id: 2, label: '分析八字', subLabel: '节气四柱排盘' },
  { id: 3, label: '分析排盘', subLabel: '紫微斗数命盘' },
  { id: 4, label: '先天命盘解析', subLabel: '构建分析上下文' },
  { id: 5, label: '大限与流年解析', subLabel: '生成命理解读' },
  { id: 6, label: '输出解码结果', subLabel: '校验与呈现' },
]

// 页面加载状态
function ReportPageLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}

// 包装组件，使用 Suspense 解决 useSearchParams 的 SSR 问题
export default function ReportPage() {
  return (
    <Suspense fallback={<ReportPageLoading />}>
      <ReportPageContent />
    </Suspense>
  )
}

function ReportPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const archiveIdFromUrl = searchParams.get('archiveId')
  const archiveId = searchParams.get('archiveId')
  const { user, hasCompletedMainReport, setHasCompletedMainReport, setUser } = useAppContext()
  const [showMenu, setShowMenu] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [mainReport, setMainReport] = useState<ApiMainReport | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [retryError, setRetryError] = useState<string | null>(null)
  const hasJobFromUrl = Boolean(jobId && archiveId)
  // 当前查看的档案：URL 优先，避免侧栏切换档案时仍显示上一个有报告档案的内容
  const effectiveArchiveId = archiveIdFromUrl ?? user.currentArchiveId
  // 仅当 URL 带有 jobId+archiveId（真实生成任务）时显示分析中，避免无参数时出现假进度
  const [isAnalyzing, setIsAnalyzing] = useState(hasJobFromUrl)
  // currentStep：0=第一步进行中 … 5=第六步进行中，6=全部完成。由前端计时驱动，不依赖后端 currentStep
  const [currentStep, setCurrentStep] = useState(
    hasJobFromUrl ? 0 : analysisStepsConfig.length,
  )
  const [reportFetchedForArchiveId, setReportFetchedForArchiveId] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const showEmptyState = !hasJobFromUrl && !mainReport && !effectiveArchiveId
  const loadingReportByArchive = !hasJobFromUrl && Boolean(effectiveArchiveId) && reportFetchedForArchiveId !== effectiveArchiveId
  const noReportForCurrentArchive = !hasJobFromUrl && Boolean(effectiveArchiveId) && reportFetchedForArchiveId === effectiveArchiveId && !mainReport
  // 仅当当前 mainReport 属于当前档案时展示报告内容，避免刷新或切换档案时短暂显示上一档案/默认案例
  const reportBelongsToCurrentArchive = mainReport && (!effectiveArchiveId || mainReport.archiveId === effectiveArchiveId)

  // URL 有 jobId+archiveId 时同步为“分析中”，避免点击重新生成/开启解码后无过渡动画
  useEffect(() => {
    if (hasJobFromUrl && jobId && !mainReport && !generationError) {
      setIsAnalyzing(true)
      setCurrentStep(0)
    }
  }, [hasJobFromUrl, jobId, mainReport, generationError])

  // 前端计时驱动步骤：总时长约 70s 平摊至前 5 步，内容生成（50s+）不集中压在最后一步；isAnalyzing 即跑（含点击重新生成后尚未带 jobId 时）
  useEffect(() => {
    if (!isAnalyzing) return
    const stepDurations = [10000, 10000, 12000, 13000, 25000] // 前 5 步合计 ~70s（ms），第 6 步等接口完成即跳转
    let stepIndex = 0
    const timeouts: ReturnType<typeof setTimeout>[] = []
    const scheduleNext = () => {
      if (stepIndex >= stepDurations.length) return
      const t = setTimeout(() => {
        setCurrentStep((prev) => {
          const next = prev + 1
          return next > 5 ? 5 : next
        })
        stepIndex += 1
        scheduleNext()
      }, stepDurations[stepIndex])
      timeouts.push(t)
    }
    scheduleNext()
    return () => timeouts.forEach(clearTimeout)
  }, [isAnalyzing])

  // 仅轮询任务是否完成（不依赖后端步进），完成后拉取主报告
  useEffect(() => {
    if (!jobId || !archiveId) return
    let cancelled = false
    const poll = async () => {
      try {
        const job = await getReportJobStatus(jobId)
        if (cancelled) return
        if (job.status === 'completed') {
          setGenerationError(null)
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
          setGenerationError(job.error || '报告生成失败，请重试')
          setIsAnalyzing(false)
          return
        }
      } catch {
        // 网络异常时继续轮询
      }
      if (!cancelled) setTimeout(poll, 2000)
    }
    poll()
    return () => {
      cancelled = true
    }
  }, [jobId, archiveId, setUser, setHasCompletedMainReport])

  // 无 jobId 时按档案查状态：有结果直接展示，有进行中任务则跳转走分析动画，否则显示生成失败
  // 进入时先清空上一档案的报告/错误，避免未加载前显示模版或错误档案
  useEffect(() => {
    if (jobId || !effectiveArchiveId) return
    setMainReport(null)
    setGenerationError(null)
    setReportFetchedForArchiveId(null)
    getReportArchiveStatus(effectiveArchiveId).then(({ report, runningJob }) => {
      if (report) {
        setMainReport(report)
        setReportFetchedForArchiveId(effectiveArchiveId)
        return
      }
      if (runningJob?.jobId) {
        router.replace(`/report?jobId=${runningJob.jobId}&archiveId=${effectiveArchiveId}`)
        setReportFetchedForArchiveId(effectiveArchiveId)
        return
      }
      setMainReport(null)
      setReportFetchedForArchiveId(effectiveArchiveId)
    }).catch(() => {
      setMainReport(null)
      setReportFetchedForArchiveId(effectiveArchiveId)
    })
  }, [jobId, effectiveArchiveId, router])

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

  const coreAbilityTags = mainReport?.coreAbilityTags ?? ['#破壁者', '#拓荒领袖']

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
  const personalityTraits = mainReport?.personalityTraits ?? [
    { label: '领子工作', value: 85 },
    { label: '晚景休闲', value: 65 },
    { label: '寅卯空', value: 72 },
    { label: '正印', value: 80 },
    { label: '合', value: 70 },
  ]

  // 性格标签数据 - 标签数量可变（4-6个）
  const personalityLabels = mainReport?.personalityLabels ?? ['理性', '果断', '独立', '敏锐', '坚韧', '创新']

  // 流年运势图表数据（安全指数，非风险指数）
  const yearlyFortuneData = mainReport?.yearlyFortuneChart ?? [
    { year: '2024', value: 60 },
    { year: '2025', value: 35 },
    { year: '2026', value: 20 },
  ]

  // 流年运势详细描述 - 重点年份会有 isHighlight=true
  const yearlyDetails = mainReport?.yearlyDetails ?? [
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

  // 宫位解析（5 个子模块）
  const palaceAnalysis = mainReport?.palaceAnalysis ?? {
    surfacePersonality: {
      title: '两火日元',
      description: '日元为火，命中又见火，形成"双火交辉"之象。代表热情、活力、行动力极强，但也需注意火旺则燥，容易急躁冲动。建议修心养性，以水济火。年柱干支显示早年环境对性格形成有重要影响，月柱体现家庭氛围与社交模式，日柱代表核心自我。'
    },
    deepDesire: {
      title: '命宫遇六破军',
      description: '破坏性与创造性并存，与平庸绝缘的灵性觉醒。贵人相助、六亲缘薄，但成就非凡。破军星入命，主变动、开创，一生多经历重大转折，每次转变都是突破自我的契机。宜从事开创性工作，不宜守成。'
    },
    thinkingPattern: {
      title: '官煞武曲负搭',
      description: '破坏与创造性并存，代表事业心极强。武曲星主财帛、决断，七杀星主权威、魄力。两星相会，形成"将星"格局。事业上宜掌权、宜独立创业，但需注意贪多嚼不烂，聚焦核心目标方能成就大业。35岁后事业运明显上升。'
    },
    wealthLogic: {
      title: '财帛欣陆七杀',
      description: '财运方面呈现"机遇与风险并存"的格局。擅长把握商机，但需警惕投机心理。建议稳扎稳打，积累实力后再图大发展。七杀入财帛宫，主财来财去、大起大落。宜从事竞争性强的行业，如金融、投资、销售等。35岁后财运渐旺，40岁迎来财富高峰期。'
    },
    emotionalPattern: {
      title: '夫妻宫宋宫·左右',
      description: '帝级气场与大器格局，能吸引优秀伴侣。但两颗主星同宫也意味着"双王会合"，婚姻中需注意相互尊重，避免因个性太强而产生摩擦。左辅右弼同宫，主贵人多助，婚姻中能得到伴侣家族的支持与帮助。'
    }
  }

  // 职业天命
  const careerDestiny = mainReport?.careerDestiny ?? {
    tracks: '金/水。你需要"金"来被你炼化（变现），需要"水"来降温（控制风险）。',
    industries: '金融（尤其是风投、并购）、互联网技术架构、能源交易、特种设备制造。',
    position: '开疆拓土的大将。不要做守成的行政，不要做需要耐心的客服。去做销售总监、项目发起人、或者独立创业者。'
  }

  // 人生四阶
  const lifeStages = mainReport?.lifeStages ?? [
    { stage: '少年期', ageRange: '5～24', description: '动荡不安，学业起伏，可能早早离家或与父母缘分浅（父母宫陀罗火星）。' },
    { stage: '青年期', ageRange: '25～44', description: '试错期。在不同的赛道横冲直撞，虽然有高光时刻，但财来财去，很难沉淀大钱。' },
    { stage: '中年期', ageRange: '45～64', description: '黄金爆发期。官禄宫武曲贪狼发力，此时你已学会控制情绪，经验转化为直觉，财富量级将指数级跃升。' },
    { stage: '晚年期', ageRange: '65+', description: '归隐田园。福德宫天府禄存，晚年反而能享受到物质带来的安稳。' }
  ]

  // 社交名片（结语）
  const socialCard = mainReport?.socialCard ?? '你这辈子是来战斗和掠夺的，不是来享受岁月静好的。你的成就建立在对他人的征服和对规则的重塑之上。\n\n你最大的敌人不是别人，是你那无法遏制的赌徒心态。在2026年这种"火上浇油"的年份，如果你学不会"认怂"，可能会把过去十年的积累一把输光。'

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
      {showEmptyState ? (
        /* 未生成主报告：引导去填写编码并生成 */
        <div className="px-5 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <p className="text-sm text-muted-foreground">您还未生成主报告</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            填写出生信息并开启解码，即可获得基于紫微斗数与命盘的主报告
          </p>
          <Button
            onClick={() => router.push('/input')}
            className="rounded-full"
          >
            填写编码并生成
          </Button>
        </div>
      ) : loadingReportByArchive ? (
        /* 根据档案拉取报告中 */
        <div className="px-5 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">加载报告中...</p>
        </div>
      ) : isAnalyzing ? (
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

          {/* Analysis Steps：与时辰→八字→排盘→内容对应，进行中步骤显示转圈避免卡死感 */}
          <div className="space-y-4 flex-1">
            {analysisStepsConfig.map((step, index) => {
              const isCompleted = index < currentStep
              const isInProgress = index === currentStep && isAnalyzing

              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 shrink-0 ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : isInProgress
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-border text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <span className="text-primary">✓</span>
                      ) : isInProgress ? (
                        <div
                          className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"
                          aria-hidden
                        />
                      ) : (
                        <span className="text-muted-foreground">○</span>
                      )}
                    </div>
                    {index < analysisStepsConfig.length - 1 && (
                      <div
                        className={`w-0.5 h-12 transition-colors duration-500 ${
                          isCompleted ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 pt-0.5 min-w-0">
                    <p
                      className={`text-sm font-medium tracking-wide transition-colors duration-500 ${
                        isCompleted || isInProgress ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isCompleted ? '已完成' : isInProgress ? '进行中…' : step.subLabel ?? '待处理'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 进度：前几步按计时显示，最后一步长时间显示约 90% + 转圈 */}
          <div className="mt-8 pt-6 border-t border-border text-center space-y-2">
            <p className="text-2xl font-medium text-primary">
              {isAnalyzing && currentStep < 5
                ? Math.round(((currentStep + 1) / analysisStepsConfig.length) * 100)
                : isAnalyzing && currentStep === 5
                  ? 92
                  : 100}
              %
            </p>
            <p className="text-xs text-muted-foreground">
              {isAnalyzing && currentStep === 5 ? '正在生成命理解读…' : '分析进度'}
            </p>
          </div>
        </div>
      ) : !reportBelongsToCurrentArchive ? (
        /* 报告未就绪或属于其他档案：避免刷新/切换时显示默认案例内容 */
        <div className="px-5 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">加载报告中...</p>
        </div>
      ) : noReportForCurrentArchive ? (
        /* 获取不到报告：显示生成失败，点击重新生成后直接进入上方分析过渡动画 */
        <div className="px-5 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <p className="text-sm font-medium text-foreground">生成失败</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            报告未能生成，可免费重新生成，不会再次扣除能量
          </p>
          {retryError && (
            <p className="text-xs text-destructive max-w-xs">{retryError}</p>
          )}
          {retryError?.includes('请先使用') ? (
            <button
              type="button"
              onClick={() => router.push('/input')}
              className="text-xs text-primary underline hover:no-underline"
            >
              去填写出生信息
            </button>
          ) : (
            <Button
              disabled={isRegenerating}
              onClick={async () => {
                if (!effectiveArchiveId || isRegenerating) return
                setRetryError(null)
                setMainReport(null)
                setGenerationError(null)
                setIsAnalyzing(true)
                setCurrentStep(0)
                setIsRegenerating(true)
                try {
                  const { jobId: newJobId } = await createReportJobRetry(effectiveArchiveId)
                  router.replace(`/report?jobId=${newJobId}&archiveId=${effectiveArchiveId}`)
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : String(err)
                  if (msg.includes('请先使用') || msg.includes('NEED_FIRST_GENERATE')) {
                    setRetryError('请先使用「开启解码」生成报告')
                  } else if (msg.includes('已有生成任务进行中') || msg.includes('JOB_ALREADY_RUNNING')) {
                    setRetryError('该档案已有生成任务进行中，请稍后再试')
                  } else {
                    setRetryError('重新生成失败，请稍后再试')
                  }
                  setIsAnalyzing(false)
                } finally {
                  setIsRegenerating(false)
                }
              }}
              className="rounded-full"
            >
              {isRegenerating ? '提交中…' : '重新生成'}
            </Button>
          )}
        </div>
      ) : (
        /* Report State */
        <div className="px-5 py-8 space-y-8 flex flex-col">
          {generationError ? (
            /* 生成失败：点击重新生成后直接进入分析过渡动画，不展示开启解码大按钮 */
            <section className="space-y-6 text-center py-12">
              <p className="text-sm font-medium text-foreground">生成失败</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto whitespace-pre-wrap">{generationError}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">可免费重新生成，不会再次扣除能量</p>
              {generationError.includes('请先使用') ? (
                <button
                  type="button"
                  onClick={() => router.push('/input')}
                  className="text-xs text-primary underline hover:no-underline"
                >
                  去填写出生信息
                </button>
              ) : (
                <Button
                  disabled={isRegenerating}
                  onClick={async () => {
                    const aid = effectiveArchiveId ?? archiveId
                    if (!aid || isRegenerating) return
                    setGenerationError(null)
                    setMainReport(null)
                    setIsAnalyzing(true)
                    setCurrentStep(0)
                    setIsRegenerating(true)
                    try {
                      const { jobId: newJobId } = await createReportJobRetry(aid)
                      router.replace(`/report?jobId=${newJobId}&archiveId=${aid}`)
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : String(err)
                      if (msg.includes('请先使用') || msg.includes('NEED_FIRST_GENERATE')) {
                        setGenerationError('请先使用「开启解码」生成报告')
                      } else if (msg.includes('已有生成任务进行中') || msg.includes('JOB_ALREADY_RUNNING')) {
                        setGenerationError('该档案已有生成任务进行中，请稍后再试')
                      } else {
                        setGenerationError('重新生成失败，请稍后再试')
                      }
                      setIsAnalyzing(false)
                    } finally {
                      setIsRegenerating(false)
                    }
                  }}
                  className="rounded-full"
                >
                  {isRegenerating ? '提交中…' : '重新生成'}
                </Button>
              )}
            </section>
          ) : (
            <>
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
              <h2 className="text-xl tracking-wider font-medium">{lifeScript.title}</h2>
            </div>
            <p className="text-sm text-foreground/70 leading-[1.8] text-justify">
              {lifeScript.description}
            </p>
          </section>

          <Separator className="bg-border" />

          {/* 核心能力 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">核 心 能 力</h3>
            <p className="text-sm text-foreground/70 leading-[1.8] text-justify">
              {coreAbility}
            </p>
            <p className="text-sm text-foreground/70 leading-[1.8] text-justify">
              {coreAbilityTags.join(' ')}
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
                <h4 className="text-sm font-medium tracking-wide">{palaceAnalysis.surfacePersonality.title}</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  {palaceAnalysis.surfacePersonality.description}
                </p>
              </div>
            </div>

            {/* 深层欲望 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">深层欲望</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">{palaceAnalysis.deepDesire.title}</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  {palaceAnalysis.deepDesire.description}
                </p>
              </div>
            </div>

            {/* 思维模式 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">思维模式</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">{palaceAnalysis.thinkingPattern.title}</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  {palaceAnalysis.thinkingPattern.description}
                </p>
              </div>
            </div>

            {/* 财富逻辑 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">财富逻辑</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">{palaceAnalysis.wealthLogic.title}</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  {palaceAnalysis.wealthLogic.description}
                </p>
              </div>
            </div>

            {/* 情感模式 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">情感模式</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">{palaceAnalysis.emotionalPattern.title}</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  {palaceAnalysis.emotionalPattern.description}
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
                  {careerDestiny.tracks}
                </p>
              </div>

              {/* 具体行业 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">具体行业</p>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  {careerDestiny.industries}
                </p>
              </div>

              {/* 职能定位 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">职能定位</p>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  {careerDestiny.position}
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* 人生阶段 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">人 生 四 阶</h3>
            <div className="space-y-5">
              {lifeStages.map((item) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{item.stage}</span>
                    <span className="text-xs text-muted-foreground">{item.ageRange}</span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                    {item.description}
                  </p>
                </div>
              ))}
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
                <p className="text-xs text-center text-muted-foreground mt-1">← 安全指数走势</p>
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
                {socialCard.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-sm text-foreground/70 leading-[1.8]">
                    {paragraph}
                  </p>
                ))}
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
            </>
          )}
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
