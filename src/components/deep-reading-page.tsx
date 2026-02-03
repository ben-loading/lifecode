'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { PaymentDialog } from '@/components/payment-dialog'
import { ReservationDialog } from '@/components/reservation-dialog'
import { TopUpDialog } from '@/components/topup-dialog'
import { useAppContext } from '@/lib/context'
import { createDeepReportJob, getSession } from '@/lib/api-client'
import { getDeepReportArchiveStatusCached, invalidateDeepReport } from '@/lib/api-cache'
import { toast } from 'sonner'
import { DEEP_REPORT_COST } from '@/lib/costs'
import { InsufficientBalanceDialog } from '@/components/insufficient-balance-dialog'

type TabType = '深度报告' | '真人1V1' | 'AI解答'
type DeepItemStatus = 'none' | 'generating' | 'completed' | 'failed'

const deepReports = [
  { id: 1, slug: 'future-fortune', title: '未来运势', description: '验证前年，深度分析未来5年明年的整体运势及趋势。', energy: 200 },
  { id: 2, slug: 'career-path', title: '仕途探索', description: '全方位剖析事业发展，深度探索职业生涯，打工？创业？延展创业当老板？', energy: 200 },
  { id: 3, slug: 'wealth-road', title: '财富之路', description: '深度剖析个人财富格局和能力，正财、偏财、投资如何配置？', energy: 200 },
  { id: 4, slug: 'love-marriage', title: '爱情姻缘', description: '撮合个人的爱情场景，提升个人的感情处理方式，感知另一半。', energy: 200 },
]

export function DeepReadingPage({
  archiveName,
  archiveLoading = false,
}: {
  archiveName?: string
  archiveLoading?: boolean
}) {
  const router = useRouter()
  const { user, balance, setBalance } = useAppContext()
  const currentArchiveId = user.currentArchiveId
  const [activeTab, setActiveTab] = useState<TabType>('深度报告')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReservationDialog, setShowReservationDialog] = useState(false)
  const [hasReservation, setHasReservation] = useState(false)
  const [showInsufficient, setShowInsufficient] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [unlockLoading, setUnlockLoading] = useState<string | null>(null)
  const [statusMap, setStatusMap] = useState<Record<string, { status: DeepItemStatus; jobId?: string }>>({})
  const [statusLoading, setStatusLoading] = useState(false)
  const [reservationNumber] = useState('123456')
  const [expiryDate] = useState('2026/01/28 14:00')

  const fetchStatus = useCallback(async () => {
    if (!currentArchiveId) return
    setStatusLoading(true)
    try {
      const map = await getDeepReportArchiveStatusCached(currentArchiveId)
      setStatusMap(map)
    } catch {
      setStatusMap({})
    } finally {
      setStatusLoading(false)
    }
  }, [currentArchiveId])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const getButtonState = (reportSlug: string) => {
    const item = statusMap[reportSlug]
    if (unlockLoading === reportSlug) return { label: '解读中…', disabled: true }
    if (!item) return { label: '解读', disabled: false }
    if (item.status === 'generating') return { label: '解读中…', disabled: true }
    if (item.status === 'completed') return { label: '查看报告', disabled: false }
    if (item.status === 'failed') return { label: '重新生成', disabled: false }
    return { label: '解读', disabled: false }
  }

  const handleDeepReportAction = async (reportSlug: string) => {
    const item = statusMap[reportSlug]
    // 已完成：直接打开报告页，不触发扣费/充值弹窗
    if (item?.status === 'completed') {
      router.push(`/deep-reading/${reportSlug}?archiveId=${currentArchiveId}`)
      return
    }
    if (!currentArchiveId) {
      setShowInsufficient(true)
      return
    }
    const isRetry = item?.status === 'failed'
    if (!isRetry && balance < DEEP_REPORT_COST) {
      setShowInsufficient(true)
      return
    }
    setUnlockLoading(reportSlug)
    try {
      const res = await createDeepReportJob(currentArchiveId, reportSlug, isRetry)
      const session = await getSession().catch(() => null)
      if (session?.user) setBalance(session.user.balance)
      await fetchStatus()
      if (res.status === 'completed') {
        invalidateDeepReport(currentArchiveId, reportSlug)
        toast.success('解读完成，可点击「查看报告」')
      } else {
        toast.error('解读失败，可点击「重新生成」免费重试')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('402') || msg.includes('不足') || msg.includes('INSUFFICIENT')) {
        const session = await getSession().catch(() => null)
        if (session?.user) setBalance(session.user.balance)
        setShowInsufficient(true)
      } else {
        toast.error(msg || '解读失败，请稍后再试')
      }
      await fetchStatus()
    } finally {
      setUnlockLoading(null)
    }
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
    window.open('https://discord.gg/your-server', '_blank')
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
          <h1 className="text-lg font-medium">深度解读</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-8 px-5 pb-3 border-b border-border">
          {(['深度报告', '真人1V1', 'AI解答'] as TabType[]).map((tab) => {
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
                {tab}
                {isUnavailable && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                    未开放
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
                <p className="text-sm text-muted-foreground">加载中…</p>
              </div>
            )
          }
          return (
            <>
              {/* Archive Info */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">解读档案</p>
                  <p className="text-sm font-medium text-foreground">#{archiveName || '档案'}</p>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  ↗
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === '深度报告' && (
          <div className="space-y-3">
            {deepReports.map((report) => (
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
                      return (
                        <>
                          <span
                            className={`text-xs max-w-[60%] text-left leading-tight ${showGeneratingHint ? 'text-foreground/70' : 'text-primary font-medium'}`}
                          >
                            {showGeneratingHint
                              ? '全方位推演中，约一分钟，请静候'
                              : showEnergy
                                ? `${report.energy}能量`
                                : ''}
                          </span>
                          <button
                            onClick={() => handleDeepReportAction(report.slug)}
                            disabled={btn.disabled}
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
              该功能暂未开放
            </p>
            <p className="text-xs text-muted-foreground tracking-widest mt-3 text-center">
              敬请期待
            </p>
          </div>
        )}

        {activeTab === 'AI解答' && (
          <div className="pt-12 pb-8 flex flex-col items-center justify-center">
            <span className="block w-8 h-px bg-border mb-8" aria-hidden />
            <p className="text-sm text-foreground/90 tracking-[0.2em] text-center">
              该功能暂未开放
            </p>
            <p className="text-xs text-muted-foreground tracking-widest mt-3 text-center">
              敬请期待
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
    </main>
  )
}
