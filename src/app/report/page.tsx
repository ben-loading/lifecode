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
import { useLanguage } from '@/lib/context-language'
import { useState, useEffect } from 'react'
import { SideMenu } from '@/components/side-menu'
import { ShareDialog } from '@/components/share-dialog'
import { getReportJobStatus, createReportJob, createReportJobRetry } from '@/lib/api-client'
import { getMainReportCached, getReportArchiveStatusCached, getArchiveCached, invalidateMainReport, listArchivesCached } from '@/lib/api-cache'
import type { ApiMainReport } from '@/lib/types/api'

// 页面加载状态
function ReportPageLoading() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">{t('載入中...')}</p>
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
  const { t } = useLanguage()
  const [showMenu, setShowMenu] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [mainReport, setMainReport] = useState<ApiMainReport | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [retryError, setRetryError] = useState<string | null>(null)
  const hasJobFromUrl = Boolean(jobId && archiveId)
  // 当前查看的档案：URL 优先，避免侧栏切换档案时仍显示上一个有报告档案的内容
  const effectiveArchiveId = archiveIdFromUrl ?? user.currentArchiveId
  const [reportFetchedForArchiveId, setReportFetchedForArchiveId] = useState<string | null>(null)
  const [fetchStatusError, setFetchStatusError] = useState(false) // 按档案拉取状态失败（网络/接口错误），与「确无报告」区分
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [archiveDisplayName, setArchiveDisplayName] = useState<string | null>(null)
  const [showLoadingRegenerate, setShowLoadingRegenerate] = useState(false)
  const showEmptyState = !hasJobFromUrl && !mainReport && !effectiveArchiveId
  const loadingReportByArchive = !hasJobFromUrl && Boolean(effectiveArchiveId) && reportFetchedForArchiveId !== effectiveArchiveId
  const noReportForCurrentArchive = !hasJobFromUrl && Boolean(effectiveArchiveId) && reportFetchedForArchiveId === effectiveArchiveId && !mainReport
  // 仅当当前 mainReport 属于当前档案时展示报告内容，避免刷新或切换档案时短暂显示上一档案/默认案例
  const reportBelongsToCurrentArchive = mainReport && (!effectiveArchiveId || mainReport.archiveId === effectiveArchiveId)
  // 主报告页只负责加载并展示报告；动态分析已在档案页完成，此处仅「加载报告中」或报告内容
  const loadingReport = loadingReportByArchive || (hasJobFromUrl && !mainReport && !generationError)

  // 修复：主报告页刷新后，将 URL 中的 archiveId 同步到 context，确保侧边栏正确显示当前档案
  // 如果 URL 中没有 archiveId，但用户已登录，获取最新档案并设置到 context 和 URL
  useEffect(() => {
    // 如果 URL 中有 archiveId，同步到 context（确保刷新后侧边栏能正确显示当前档案）
    if (archiveIdFromUrl) {
      // 只有当 context 中的 archiveId 与 URL 不一致时，才更新 context
      if (archiveIdFromUrl !== user.currentArchiveId) {
        getArchiveCached(archiveIdFromUrl)
          .then((archive) => {
            setUser((prev) => ({
              ...prev,
              currentArchiveId: archive.id,
              archiveName: archive.name,
            }))
          })
          .catch(() => {
            // 如果获取档案失败，仍然设置 archiveId 到 context
            setUser((prev) => ({
              ...prev,
              currentArchiveId: archiveIdFromUrl,
            }))
          })
      }
      return
    }
    // 如果 URL 中没有 archiveId，但用户已登录，获取最新档案
    // 注意：只在刷新页面时执行，如果用户主动清空了 currentArchiveId（创建新档案），不自动跳转
    // 通过检查是否在 report 页面来判断：如果在 report 页面但没有 archiveId，说明是刷新，需要恢复
    if (!archiveIdFromUrl && user.isLoggedIn && !user.currentArchiveId) {
      // 检查当前路径，如果在 /report 页面，说明是刷新，需要恢复档案
      const currentPath = window.location.pathname
      if (currentPath === '/report') {
        listArchivesCached()
          .then((archives) => {
            const latestArchive = archives?.[0] // 列表按创建时间倒序，第一个为最新
            if (latestArchive) {
              setUser((prev) => ({
                ...prev,
                currentArchiveId: latestArchive.id,
                archiveName: latestArchive.name,
              }))
              // 更新 URL 以保持刷新后能恢复
              router.replace(`/report?archiveId=${latestArchive.id}`, { scroll: false })
            }
          })
          .catch(() => {
            // 获取档案列表失败，不处理
          })
      }
      // 如果不在 /report 页面（比如在首页），不自动跳转，让用户自己选择
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveIdFromUrl, user.isLoggedIn, user.currentArchiveId])

  // 仅轮询任务是否完成，完成后拉取主报告；若任务完成但数据库无报告或轮询超时，展示错误并允许重新生成
  const POLL_TIMEOUT_MS = 150 * 1000 // 150 秒超时后提示重新生成
  useEffect(() => {
    if (!jobId || !archiveId) return
    let cancelled = false
    const startedAt = Date.now()
    const poll = async () => {
      try {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setGenerationError(t('報告生成逾時，請重新生成'))
          return
        }
        const job = await getReportJobStatus(jobId)
        if (cancelled) return
        if (job.status === 'completed') {
          setGenerationError(null)
          invalidateMainReport(archiveId)
          const report = await getMainReportCached(archiveId)
          if (cancelled) return
          if (report) {
            setMainReport(report)
            setUser((prev) => ({ ...prev, currentArchiveId: archiveId }))
            setHasCompletedMainReport(true)
          } else {
            // 任务标记完成但数据库无报告（生成不稳定/未写入），展示错误并允许重新生成
            setGenerationError(t('報告資料未能載入，請重新生成'))
          }
          return
        }
        if (job.status === 'failed') {
          setGenerationError(job.error || t('報告生成失敗，請重試'))
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

  // 有 jobId 且一直在「加载报告中」时，约 25 秒后展示「重新生成」入口，避免长时间卡住
  const LOADING_REGENERATE_DELAY_MS = 25 * 1000
  useEffect(() => {
    if (!hasJobFromUrl || mainReport || generationError) {
      setShowLoadingRegenerate(false)
      return
    }
    const t = setTimeout(() => setShowLoadingRegenerate(true), LOADING_REGENERATE_DELAY_MS)
    return () => clearTimeout(t)
  }, [hasJobFromUrl, mainReport, generationError])

  // 无 jobId 时按档案查状态：有结果直接展示，有进行中任务则跳转，否则显示生成失败；请求失败不误判为「无报告」
  const FETCH_STATUS_TIMEOUT_MS = 15 * 1000 // 15 秒
  useEffect(() => {
    if (jobId || !effectiveArchiveId) return
    setFetchStatusError(false)
    setGenerationError(null)
    // 仅当当前档案与要拉取的不一致时清空报告；同档案保留旧内容直到新响应，避免刷新/返回时闪「加载」再出内容
    setMainReport((prev) => (prev && prev.archiveId !== effectiveArchiveId ? null : prev))
    // 若当前已有该档案的报告则先视为「已拉取」，直接展示内容并后台刷新，避免闪一下加载
    setReportFetchedForArchiveId((prev) => {
      const hasReportForThisArchive = mainReport?.archiveId === effectiveArchiveId
      return hasReportForThisArchive ? effectiveArchiveId : null
    })
    // 刷新或首次进入时不用过期 status 缓存，避免读到旧的 report:null 误显示「生成失败」
    const hasReportToShow = mainReport?.archiveId === effectiveArchiveId
    if (!hasReportToShow) invalidateMainReport(effectiveArchiveId)
    let cancelled = false
    const timeoutId = setTimeout(() => {
      if (cancelled) return
      setMainReport(null)
      setReportFetchedForArchiveId(effectiveArchiveId)
    }, FETCH_STATUS_TIMEOUT_MS)
    const doFetch = (): Promise<void> =>
      getReportArchiveStatusCached(effectiveArchiveId).then(({ report, runningJob }) => {
        if (cancelled) return
        clearTimeout(timeoutId)
        setFetchStatusError(false)
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
      })

    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null
    doFetch().catch(() => {
      if (cancelled) return
      // 首次失败可能是刷新时 session/档案未就绪，短延迟后重试一次
      retryTimeoutId = setTimeout(() => {
        doFetch().catch(() => {
          if (cancelled) return
          clearTimeout(timeoutId)
          setFetchStatusError(true)
        })
      }, 600)
    })

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      if (retryTimeoutId != null) clearTimeout(retryTimeoutId)
    }
  }, [jobId, effectiveArchiveId, router])

  // 根据当前档案 ID 拉取档案名，刷新后不再依赖 user.archiveName，避免显示占位「KC小可爱」
  useEffect(() => {
    if (!effectiveArchiveId) {
      setArchiveDisplayName(null)
      return
    }
    let cancelled = false
    getArchiveCached(effectiveArchiveId)
      .then((archive) => {
        if (!cancelled) setArchiveDisplayName(archive.name ?? null)
      })
      .catch(() => {
        if (!cancelled) setArchiveDisplayName(null)
      })
    return () => { cancelled = true }
  }, [effectiveArchiveId])

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
          <span className="text-lg tracking-wider font-medium text-primary">{t('人生解碼')}</span>
          <button
            onClick={() => router.push('/chart')}
            className="text-foreground hover:opacity-70 transition-opacity"
            aria-label="查看紫微斗數命盤"
          >
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      {showEmptyState ? (
        /* 未生成主报告：引导去填写编码并生成 */
        <div className="px-5 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <p className="text-sm text-muted-foreground">{t('您還未生成主報告')}</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {t('填寫出生資訊並開啟解碼，即可獲得基於紫微斗數與命盤的主報告')}
          </p>
          <Button
            onClick={() => router.push('/input')}
            className="rounded-full"
          >
            {t('填寫編碼並生成')}
          </Button>
        </div>
      ) : (loadingReport || (!reportBelongsToCurrentArchive && !generationError && !noReportForCurrentArchive)) ? (
        /* 主报告页仅展示「加载报告中」；动态分析已在档案页完成。已确认无报告时走下方 noReportForCurrentArchive */
        <div className="px-5 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-4">
          {fetchStatusError ? (
            <>
              <p className="text-sm text-muted-foreground">{t('載入失敗，請重新整理重試')}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="rounded-full">
                {t('重新整理頁面')}
              </Button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">{t('載入報告中...')}</p>
            </>
          )}
          {showLoadingRegenerate && effectiveArchiveId && !fetchStatusError && (
            <div className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">{t('載入時間較長，可能報告未寫入')}</p>
              <Button
                variant="outline"
                size="sm"
                disabled={isRegenerating}
                onClick={() => {
                  setGenerationError(t('報告載入逾時，請重新生成'))
                }}
                className="rounded-full"
              >
                {t('重新生成')}
              </Button>
            </div>
          )}
        </div>
      ) : noReportForCurrentArchive ? (
        /* 获取不到报告：显示生成失败，点击重新生成后跳转带 jobId 的 report 页，由档案页或本页仅展示加载报告中 */
        <div className="px-5 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <p className="text-sm font-medium text-foreground">{t('生成失敗')}</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {t('報告未能生成，可免費重新生成，不會再次扣除能量')}
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
              {t('去填寫出生資訊')}
            </button>
          ) : (
            <Button
              disabled={isRegenerating}
              onClick={async () => {
                if (!effectiveArchiveId || isRegenerating) return
                setRetryError(null)
                setMainReport(null)
                setGenerationError(null)
                setIsRegenerating(true)
                try {
                  const { jobId: newJobId } = await createReportJobRetry(effectiveArchiveId)
                  router.replace(`/report?jobId=${newJobId}&archiveId=${effectiveArchiveId}&retry=1`)
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : String(err)
                  if (msg.includes('请先使用') || msg.includes('NEED_FIRST_GENERATE')) {
                    setRetryError(t('請先使用「開啟解碼」生成報告'))
                  } else if (msg.includes('已有生成任务进行中') || msg.includes('JOB_ALREADY_RUNNING')) {
                    setRetryError(t('該檔案已有生成任務進行中，請稍後再試'))
                  } else {
                    setRetryError(t('重新生成失敗，請稍後再試'))
                  }
                } finally {
                  setIsRegenerating(false)
                }
              }}
              className="rounded-full"
            >
              {isRegenerating ? t('提交中…') : t('重新生成')}
            </Button>
          )}
        </div>
      ) : (
        /* Report State */
        <div className="px-5 py-8 space-y-8 flex flex-col">
          {generationError ? (
            /* 生成失败：点击重新生成后跳转带 jobId 的 report 页，仅展示加载报告中 */
            <section className="space-y-6 text-center py-12">
              <p className="text-sm font-medium text-foreground">{t('生成失敗')}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto whitespace-pre-wrap">{generationError}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">{t('可免費重新生成，不會再次扣除能量')}</p>
              {generationError.includes('请先使用') ? (
                <button
                  type="button"
                  onClick={() => router.push('/input')}
                  className="text-xs text-primary underline hover:no-underline"
                >
                  {t('去填寫出生資訊')}
                </button>
              ) : (
                <Button
                  disabled={isRegenerating}
                  onClick={async () => {
                    const aid = effectiveArchiveId ?? archiveId
                    if (!aid || isRegenerating) return
                    setGenerationError(null)
                    setMainReport(null)
                    setIsRegenerating(true)
                    try {
                      const { jobId: newJobId } = await createReportJobRetry(aid)
                      router.replace(`/report?jobId=${newJobId}&archiveId=${aid}&retry=1`)
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : String(err)
                      if (msg.includes('请先使用') || msg.includes('NEED_FIRST_GENERATE')) {
                        setGenerationError(t('請先使用「開啟解碼」生成報告'))
                      } else if (msg.includes('已有生成任务进行中') || msg.includes('JOB_ALREADY_RUNNING')) {
                        setGenerationError(t('該檔案已有生成任務進行中，請稍後再試'))
                      } else {
                        setGenerationError(t('重新生成失敗，請稍後再試'))
                      }
                    } finally {
                      setIsRegenerating(false)
                    }
                  }}
                  className="rounded-full"
                >
                  {isRegenerating ? t('提交中…') : t('重新生成')}
                </Button>
              )}
            </section>
          ) : (
            <>
          <div className="pb-28 space-y-8">
          {/* User Info Section */}
          <section className="text-center space-y-3">
            <h1 className="text-2xl tracking-[0.2em] font-semibold">{(archiveDisplayName ?? user.archiveName) || '檔案'}</h1>
            <p className="text-sm text-muted-foreground tracking-wide">{mainReport?.baziDisplay ?? '—'}</p>
          </section>

          <Separator className="bg-border" />

          {/* 人生主线 */}
          <section className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground tracking-widest uppercase">人 生 劇 本</p>
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
              性格特質構成
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
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">宮 位 解 析</h3>

            {/* 表层性格 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">表層性格</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">{palaceAnalysis.surfacePersonality.title}</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  {palaceAnalysis.surfacePersonality.description}
                </p>
              </div>
            </div>

            {/* 深层欲望 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">深層慾望</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">{palaceAnalysis.deepDesire.title}</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  {palaceAnalysis.deepDesire.description}
                </p>
              </div>
            </div>

            {/* 思维模式 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">思維模式</p>
              <div className="space-y-2 pl-3 border-l border-border">
                <h4 className="text-sm font-medium tracking-wide">{palaceAnalysis.thinkingPattern.title}</h4>
                <p className="text-sm text-foreground/70 leading-[1.8]">
                  {palaceAnalysis.thinkingPattern.description}
                </p>
              </div>
            </div>

            {/* 财富逻辑 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">財富邏輯</p>
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
              {t('能量分析')}
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

          {/* 專業天命 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">專 業 天 命</h3>
            <div className="space-y-4">
              {/* 五行赛道 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">五行賽道</p>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  {careerDestiny.tracks}
                </p>
              </div>

              {/* 具体行业 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">具體行業</p>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  {careerDestiny.industries}
                </p>
              </div>

              {/* 职能定位 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">職能定位</p>
                <p className="text-sm text-foreground/70 leading-[1.8] pl-3 border-l border-border">
                  {careerDestiny.position}
                </p>
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* 人生阶段 */}
          <section className="space-y-4">
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">人 生 四 階</h3>
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
            <h3 className="text-center text-xs tracking-widest text-muted-foreground uppercase">流 年 運 勢</h3>
            <Card className="border-border bg-white/60 shadow-none">
              <CardContent className="px-3 py-3 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={yearlyFortuneData} margin={{ top: 10, right: 25, left: 25, bottom: 5 }}>
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
                      width={25}
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
                <p className="text-xs text-center text-muted-foreground mt-1">← 安全指數走勢</p>
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
                            <p className="text-xs text-muted-foreground mb-1">策略建議</p>
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
          </div>

          {/* 底部悬浮：分享一下 + 深度解读 */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border max-w-md mx-auto px-5 py-4 safe-area-pb">
            <div className="flex gap-3">
              <Button
                onClick={() => setShowShareDialog(true)}
                variant="outline"
                className="flex-1 h-12 rounded-full bg-transparent"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('分享一下')}
              </Button>
              <Button
                onClick={() => router.push('/deep-reading')}
                className="flex-1 h-12 rounded-full"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {t('深度解讀')}
              </Button>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* Side Menu */}
      <SideMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        archiveName={(archiveDisplayName ?? user.archiveName) || '檔案'}
        userEmail={user.email || 'luo luo@gmail.com'}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        archiveName={(archiveDisplayName ?? user.archiveName) || '檔案'}
        lifeScriptTitle={lifeScript.title}
        coreAbility={coreAbility}
      />
    </main>
  )
}
