'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronDown, FileText } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PaymentDialog } from '@/components/payment-dialog'
import { ReservationDialog } from '@/components/reservation-dialog'
import { TopUpDialog } from '@/components/topup-dialog'
import { useAppContext } from '@/lib/context'
import { useLanguage } from '@/lib/context-language'
import { createDeepReportJob, getSession } from '@/lib/api-client'
import { getDeepReportArchiveStatusCached, invalidateDeepReport, listArchivesCached } from '@/lib/api-cache'
import { toast } from 'sonner'
import { DEEP_REPORT_COST } from '@/lib/costs'
import { InsufficientBalanceDialog } from '@/components/insufficient-balance-dialog'
import { ConfirmEnergyDeductionDialog } from '@/components/confirm-energy-deduction-dialog'
import { useDebounceCallback } from '@/lib/utils'
import type { ApiArchive } from '@/lib/types/api'

type TabType = '深度報告' | '真人1V1' | 'AI解答'
type DeepItemStatus = 'none' | 'generating' | 'completed' | 'failed'

// 注意：deepReports 数组中的文字会在组件内使用 t() 函数翻译
const getDeepReports = (t: (text: string) => string) => [
  { id: 1, slug: 'future-fortune', title: t('未來運勢'), description: t('驗證前年，深度分析未來5年明年的整體運勢及趨勢。'), energy: 200 },
  { id: 2, slug: 'career-path', title: t('仕途探索'), description: t('全方位剖析事業發展，深度探索職業生涯，打工？創業？延展創業當老闆？'), energy: 200 },
  { id: 3, slug: 'wealth-road', title: t('財富之路'), description: t('深度剖析個人財富格局和能力，正財、偏財、投資如何配置？'), energy: 200 },
  { id: 4, slug: 'love-marriage', title: t('愛情姻緣'), description: t('撮合個人的愛情場景，提升個人的感情處理方式，感知另一半。'), energy: 200 },
]

export function DeepReadingPage({
  archiveName,
  archiveLoading = false,
  archiveId,
}: {
  archiveName?: string
  archiveLoading?: boolean
  archiveId?: string
}) {
  const router = useRouter()
  const { user, balance, setBalance, setUser } = useAppContext()
  const { t } = useLanguage()
  // 优先使用传入的 archiveId（来自 URL），避免刷新时丢失档案状态；无传入时用 context 的 currentArchiveId
  const currentArchiveId = archiveId ?? user.currentArchiveId
  const [activeTab, setActiveTab] = useState<TabType>('深度報告')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReservationDialog, setShowReservationDialog] = useState(false)
  const [hasReservation, setHasReservation] = useState(false)
  const [showInsufficient, setShowInsufficient] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [showConfirmDeduction, setShowConfirmDeduction] = useState(false)
  const [pendingReportSlug, setPendingReportSlug] = useState<string | null>(null)
  const [unlockLoading, setUnlockLoading] = useState<string | null>(null)
  const [statusMap, setStatusMap] = useState<Record<string, { status: DeepItemStatus; jobId?: string }>>({})
  const [statusLoading, setStatusLoading] = useState(false)
  const [reservationNumber] = useState('123456')
  const [expiryDate] = useState('2026/01/28 14:00')
  const [showArchiveSelector, setShowArchiveSelector] = useState(false)
  const [archiveList, setArchiveList] = useState<ApiArchive[]>([])
  const [archiveListLoading, setArchiveListLoading] = useState(false)

  const [lastFetchedArchiveId, setLastFetchedArchiveId] = useState<string | null>(null)
  const fetchStatus = useCallback(async (invalidateCache = false) => {
    if (!currentArchiveId) return
    // 切换档案时清空旧状态（避免显示上一个档案的数据）
    if (lastFetchedArchiveId && lastFetchedArchiveId !== currentArchiveId) {
      setStatusMap({})
    }
    setLastFetchedArchiveId(currentArchiveId)
    setStatusLoading(true)
    try {
      // 如果需要强制刷新（如刷新页面），先清除缓存
      if (invalidateCache) {
        invalidateDeepReport(currentArchiveId)
      }
      const map = await getDeepReportArchiveStatusCached(currentArchiveId)
      // 更新状态时保留之前「解读中」的状态，避免因 API 延迟/缓存导致按钮短暂变回「解锁」
      setStatusMap((prev) => {
        const next: Record<string, { status: DeepItemStatus; jobId?: string }> = {}
        // 先应用新数据
        Object.keys(map).forEach((slug) => {
          next[slug] = map[slug]
        })
        // 仅在同一档案内保留之前是 'generating' 的状态，除非新状态是 'completed' 或 'failed'（已确认完成/失败）
        // 修复：如果后端返回 'none'，但本地是 'generating'，应该保留 'generating'（可能是后端还没创建任务或缓存过期）
        Object.keys(prev).forEach((slug) => {
          const prevItem = prev[slug]
          const nextItem = next[slug]
          if (prevItem?.status === 'generating') {
            // 之前是生成中，新数据中没有或状态是 'none' 或不是 completed/failed，则保留 generating
            if (!nextItem || nextItem.status === 'none' || (nextItem.status !== 'completed' && nextItem.status !== 'failed')) {
              next[slug] = { ...prevItem, ...(nextItem || {}) } // 保留 jobId 等，但状态保持 generating
            }
          }
        })
        return next
      })
    } catch {
      // 请求失败时不清空状态，保留当前 statusMap（避免误将「解读中」清空）
    } finally {
      setStatusLoading(false)
    }
  }, [currentArchiveId, lastFetchedArchiveId])

  // 页面加载时强制刷新状态（清除缓存），确保获取最新的 generating 状态
  useEffect(() => {
    // 首次加载时清除缓存，确保获取最新状态
    fetchStatus(true)
  }, [fetchStatus])

  // 加载档案列表（用于档案选择器）
  useEffect(() => {
    if (!showArchiveSelector) return
    setArchiveListLoading(true)
    listArchivesCached()
      .then((list) => setArchiveList(list ?? []))
      .catch(() => setArchiveList([]))
      .finally(() => setArchiveListLoading(false))
  }, [showArchiveSelector])

  // 切换档案
  const handleSelectArchive = (archive: ApiArchive) => {
    setUser((prev) => ({ ...prev, currentArchiveId: archive.id }))
    // 清空旧档案的状态，避免切换时显示上一个档案的数据
    setStatusMap({})
    router.replace(`/deep-reading?archiveId=${archive.id}`, { scroll: false })
    setShowArchiveSelector(false)
    // 切换档案后重新拉取状态（路由页会更新 archiveId prop，fetchStatus 会自动触发）
  }

  const getButtonState = (reportSlug: string) => {
    const item = statusMap[reportSlug]
    // 当前报告本身正在生成中，禁用按钮
    if (unlockLoading === reportSlug) return { label: t('解讀中…'), disabled: true }
    if (item?.status === 'generating') return { label: t('解讀中…'), disabled: true }
    // 其他状态：按钮保持可点击（即使有其他报告正在生成，也让用户点击后显示提示）
    // 这样用户点击时能看到提示，而不是按钮被禁用无法点击
    if (item?.status === 'completed') return { label: t('查看報告'), disabled: false }
    if (item?.status === 'failed') return { label: t('重新生成'), disabled: false }
    // 默认状态：按钮可点击，点击时 handleDeepReportAction 会检查是否有其他报告正在生成并显示提示
    return { label: t('解讀'), disabled: false }
  }

  // 检查是否有其他报告正在生成中
  const getGeneratingReport = useCallback((): { slug: string; title: string } | null => {
    const reports = getDeepReports(t)
    for (const [slug, item] of Object.entries(statusMap)) {
      if (item?.status === 'generating' || unlockLoading === slug) {
        const report = reports.find((r) => r.slug === slug)
        if (report) {
          return { slug, title: report.title }
        }
      }
    }
    return null
  }, [statusMap, unlockLoading, t])

  // 开始生成报告（用户确认后调用），使用 useCallback 确保依赖正确
  const startGeneratingReport = useCallback(async (reportSlug: string, isRetry: boolean) => {
    setUnlockLoading(reportSlug)
    // 点击解读时立即标记为 generating，避免在 fetchStatus 完成前按钮变回「解锁」
    setStatusMap((prev) => ({
      ...prev,
      [reportSlug]: { status: 'generating' },
    }))
    try {
      const res = await createDeepReportJob(currentArchiveId!, reportSlug, isRetry)
      const session = await getSession().catch(() => null)
      if (session?.user) setBalance(session.user.balance)
      // 如果返回明确状态，立即更新（completed/failed），避免被 fetchStatus 的延迟数据覆盖
      if (res.status === 'completed') {
        setStatusMap((prev) => ({
          ...prev,
          [reportSlug]: { status: 'completed' },
        }))
        invalidateDeepReport(currentArchiveId!, reportSlug)
        toast.success(t('解讀完成，可點擊「查看報告」'))
        // 完成后清空 unlockLoading，并刷新状态
        setUnlockLoading(null)
        await fetchStatus()
      } else if (res.status === 'failed') {
        setStatusMap((prev) => ({
          ...prev,
          [reportSlug]: { status: 'failed' },
        }))
        toast.error(t('解讀失敗，可點擊「重新生成」免費重試'))
        // 失败后清空 unlockLoading，并刷新状态
        setUnlockLoading(null)
        await fetchStatus()
      } else {
        // 如果返回的是 generating（理论上不会），或者需要等待后端确认
        // 先刷新状态，确保后端已创建任务，然后再清空 unlockLoading
        await fetchStatus()
        // 延迟清空 unlockLoading，确保状态已更新
        setTimeout(() => {
          setUnlockLoading(null)
        }, 300)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('402') || msg.includes('不足') || msg.includes('INSUFFICIENT')) {
        const session = await getSession().catch(() => null)
        if (session?.user) setBalance(session.user.balance)
        setShowInsufficient(true)
        // 能量不足时恢复状态，允许重试
        setStatusMap((prev) => {
          const next = { ...prev }
          delete next[reportSlug]
          return next
        })
        setUnlockLoading(null)
      } else {
        toast.error(msg || t('解讀失敗，請稍後再試'))
        // 其他错误保持 generating，等待 fetchStatus 确认最终状态
        // 先刷新状态，然后再清空 unlockLoading
        await fetchStatus()
        setTimeout(() => {
          setUnlockLoading(null)
        }, 300)
      }
    }
  }, [currentArchiveId, fetchStatus, setBalance, setUnlockLoading, setStatusMap, setShowInsufficient])

  // 内部处理函数（不防抖），使用 useCallback 确保依赖正确
  const handleDeepReportActionInternal = useCallback(async (reportSlug: string) => {
    const item = statusMap[reportSlug]
    // 已完成：直接打开报告页，不触发扣费/充值弹窗
    if (item?.status === 'completed') {
      router.push(`/deep-reading/${reportSlug}?archiveId=${currentArchiveId}`)
      return
    }
    
    // 如果当前报告本身正在生成中，直接返回（不应该触发）
    if (item?.status === 'generating' || unlockLoading === reportSlug) {
      return
    }
    
    // 检查是否有其他报告正在生成中（优先检查，确保提示能显示）
    // 直接在函数内检查，不依赖 useCallback
    const reports = getDeepReports(t)
    let generatingReport: { slug: string; title: string } | null = null
    for (const [slug, statusItem] of Object.entries(statusMap)) {
      if (slug !== reportSlug && (statusItem?.status === 'generating' || unlockLoading === slug)) {
        const report = reports.find((r) => r.slug === slug)
        if (report) {
          generatingReport = { slug, title: report.title }
          break
        }
      }
    }
    
    if (generatingReport) {
      // 使用 toast.error 显示提示
      toast.error(t('當前「{{title}}」正在解讀中，請等待完成後再進行解讀').replace('{{title}}', generatingReport.title), {
        duration: 3000,
      })
      return
    }
    
    if (!currentArchiveId) {
      setShowInsufficient(true)
      return
    }

    const isRetry = item?.status === 'failed'
    
    // 如果是重试，直接开始生成（不扣费）
    if (isRetry) {
      await startGeneratingReport(reportSlug, isRetry)
      return
    }

    // 检查余额
    if (balance < DEEP_REPORT_COST) {
      setShowInsufficient(true)
      return
    }

    // 余额足够，显示确认弹窗
    setPendingReportSlug(reportSlug)
    setShowConfirmDeduction(true)
  }, [statusMap, unlockLoading, currentArchiveId, balance, router, startGeneratingReport, setShowInsufficient, setPendingReportSlug, setShowConfirmDeduction, t])

  // 防抖版本的处理函数（500ms 防抖，防止快速连续点击）
  const debouncedHandleAction = useDebounceCallback(handleDeepReportActionInternal, 500)

  // 对外暴露的处理函数：已完成状态立即执行，其他情况防抖
  const handleDeepReportAction = useCallback(async (reportSlug: string) => {
    const item = statusMap[reportSlug]
    // 已完成状态：立即执行，不防抖（用户体验优先）
    if (item?.status === 'completed') {
      await handleDeepReportActionInternal(reportSlug)
      return
    }
    // 其他情况：应用防抖
    debouncedHandleAction(reportSlug)
  }, [statusMap, handleDeepReportActionInternal, debouncedHandleAction])

  // 确认扣除能量
  const handleConfirmDeduction = () => {
    if (pendingReportSlug) {
      setShowConfirmDeduction(false)
      startGeneratingReport(pendingReportSlug, false)
      setPendingReportSlug(null)
    }
  }

  // 取消确认扣除能量
  const handleCancelDeduction = () => {
    setShowConfirmDeduction(false)
    setPendingReportSlug(null)
  }

  const handlePayment = () => {
    setShowPaymentDialog(true)
  }

  const handlePaymentConfirm = () => {
    setHasReservation(true)
    setShowPaymentDialog(false)
  }

  const handleViewReservation = () => {
    setShowReservationDialog(true)
  }

  const handleViewHistory = () => {
    router.push('/deep-reading/consult-history')
  }

  const handleJoinDiscord = () => {
    window.open('https://discord.gg/lifelabs', '_blank')
  }

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">{t('深度解讀')}</h1>
        </div>

        {/* 档案选择器（移动到 Tabs 上方，居中展示） */}
        {currentArchiveId && !archiveLoading && (
          <div className="px-5 pt-3 pb-2">
            <button
              onClick={() => setShowArchiveSelector(true)}
              className="w-full flex items-center justify-center relative py-2 group"
            >
              <div className="flex flex-col items-center min-w-0">
                <span className="text-[10px] text-muted-foreground mb-1 tracking-wider">{t('解讀檔案')}</span>
                <span className="text-base font-medium text-foreground">
                  #{archiveName || t('檔案')}
                </span>
              </div>
              <div className="absolute right-0 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-center gap-8 px-5 pb-3 border-b border-border">
          {(['深度報告', '真人1V1', 'AI解答'] as TabType[]).map((tab) => {
            const isUnavailable = tab === '真人1V1' || tab === 'AI解答'
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(tab)}
                {isUnavailable && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                    {t('未開放')}
                  </span>
                )}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content：档案名 + 4 类状态未就绪时整块 loading */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {(() => {
          const contentLoading = !currentArchiveId || archiveLoading || statusLoading
          if (contentLoading) {
            return (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">{t('載入中…')}</p>
              </div>
            )
          }
          return (
            <>

              {/* Tab Content */}
              {activeTab === '深度報告' && (
          <div className="space-y-3">
            {getDeepReports(t).map((report) => (
              <div
                key={report.id}
                className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-3">
                  {/* Title */}
                  <h3 className="text-sm font-medium text-foreground">{report.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2">
                    {(() => {
                      const st = statusMap[report.slug]?.status
                      const isGenerating = st === 'generating' || unlockLoading === report.slug
                      const showEnergy = !st || st === 'none' || st === 'failed'
                      const btn = getButtonState(report.slug)
                      const showGeneratingHint = isGenerating
                      // 只有当当前报告本身正在生成时才禁用按钮
                      // 如果有其他报告正在生成，按钮保持可点击，点击时显示提示
                      // 这样用户点击时能看到提示，而不是按钮被禁用无法点击
                      const shouldDisable = btn.disabled // 只根据当前报告本身的状态决定是否禁用
                      // 确保按钮可点击：如果当前报告本身不在生成中，按钮不应该被禁用
                      // 即使有其他报告正在生成，也应该让用户点击后看到提示
                      return (
                        <>
                          <span
                            className={`text-xs max-w-[60%] text-left leading-tight ${showGeneratingHint ? 'text-foreground/70' : 'text-primary font-medium'}`}
                          >
                            {showGeneratingHint
                              ? t('全方位推演中，約一分鐘，請靜候')
                              : showEnergy
                                ? `${report.energy}${t('能量')}`
                                : ''}
                          </span>
                          <button
                            onClick={() => {
                              // 直接调用，让 handleDeepReportAction 处理所有逻辑
                              handleDeepReportAction(report.slug)
                            }}
                            disabled={shouldDisable}
                            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            {btn.label}
                          </button>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === '真人1V1' && (
          <div className="pt-12 pb-8 flex flex-col items-center justify-center">
            <span className="block w-8 h-px bg-border mb-8" aria-hidden />
            <p className="text-sm text-foreground/90 tracking-[0.2em] text-center">
              {t('該功能暫未開放')}
            </p>
            <p className="text-xs text-muted-foreground tracking-widest mt-3 text-center">
              {t('敬請期待')}
            </p>
          </div>
        )}

        {activeTab === 'AI解答' && (
          <div className="pt-12 pb-8 flex flex-col items-center justify-center">
            <span className="block w-8 h-px bg-border mb-8" aria-hidden />
            <p className="text-sm text-foreground/90 tracking-[0.2em] text-center">
              {t('該功能暫未開放')}
            </p>
            <p className="text-xs text-muted-foreground tracking-widest mt-3 text-center">
              {t('敬請期待')}
            </p>
          </div>
        )}
            </>
          )
        })()}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handlePaymentConfirm}
        currentBalance={balance}
        amount={2000}
      />

      <InsufficientBalanceDialog
        isOpen={showInsufficient}
        onClose={() => setShowInsufficient(false)}
        onGoTopUp={() => {
          setShowInsufficient(false)
          setShowTopUp(true)
        }}
        required={DEEP_REPORT_COST}
        currentBalance={balance}
      />
      {pendingReportSlug && (
        <ConfirmEnergyDeductionDialog
          isOpen={showConfirmDeduction}
          onClose={handleCancelDeduction}
          onConfirm={handleConfirmDeduction}
          reportTitle={getDeepReports(t).find((r) => r.slug === pendingReportSlug)?.title || t('深度報告')}
          required={DEEP_REPORT_COST}
          currentBalance={balance}
        />
      )}
      <TopUpDialog
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
        onSuccess={async () => {
          const session = await getSession().catch(() => null)
          if (session?.user) setBalance(session.user.balance)
        }}
      />

      <ReservationDialog
        isOpen={showReservationDialog}
        onClose={() => setShowReservationDialog(false)}
        reservationNumber={reservationNumber}
        expiryDate={expiryDate}
      />

      {/* 档案选择器弹窗 */}
      <Dialog open={showArchiveSelector} onOpenChange={setShowArchiveSelector}>
        <DialogContent className="max-w-md p-0">
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-base font-medium tracking-wide">{t('選擇檔案')}</DialogTitle>
          </div>
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {archiveListLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground tracking-wide">{t('載入檔案列表中…')}</p>
              </div>
            ) : archiveList.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground tracking-wide">{t('暫無檔案')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {archiveList.map((archive) => {
                  const isCurrent = archive.id === currentArchiveId
                  return (
                    <button
                      key={archive.id}
                      type="button"
                      onClick={() => handleSelectArchive(archive)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-primary/10 border border-primary text-foreground shadow-sm'
                          : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        isCurrent ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`} />
                      <FileText className={`w-4 h-4 shrink-0 ${
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <span className="flex-1 truncate text-sm font-medium">{archive.name || t('未命名檔案')}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium shrink-0">
                          {t('當前')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
