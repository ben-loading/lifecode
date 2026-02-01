'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAppContext } from '@/lib/context'
import { useState, useEffect } from 'react'
import { createArchive, createReportJob } from '@/lib/api-client'
import { MAIN_REPORT_COST } from '@/lib/costs'
import { LoginModal } from '@/components/login-modal'
import { InsufficientBalanceDialog } from '@/components/insufficient-balance-dialog'

// 分析步骤配置（与后端流程对应）
const analysisStepsConfig = [
  { id: 1, label: '分析时辰', subLabel: '解析出生时间与地区' },
  { id: 2, label: '分析八字', subLabel: '节气四柱排盘' },
  { id: 3, label: '分析排盘', subLabel: '紫微斗数命盘' },
  { id: 4, label: '先天命盘解析', subLabel: '构建分析上下文' },
  { id: 5, label: '大限与流年解析', subLabel: '生成命理解读' },
  { id: 6, label: '输出解码结果', subLabel: '校验与呈现' },
]

export function ArchivePage() {
  const router = useRouter()
  const { user, setUser, balance, setBalance } = useAppContext()
  const [archiveNote, setArchiveNote] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showInsufficient, setShowInsufficient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(analysisStepsConfig.length)

  // 分析步骤动画：前端计时驱动，约70s平摊至前5步
  useEffect(() => {
    if (!loading) return
    const stepDurations = [10000, 10000, 12000, 13000, 25000] // 前5步合计~70s(ms)
    let stepIndex = 0
    setCurrentStep(0)
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
  }, [loading])

  const handleStartDecode = async () => {
    if (!archiveNote?.trim()) return
    if (!user.isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    const needsLocation = user.birthTimeMode !== 'shichen'
    if (!user.gender || !user.birthDate) {
      setError('请先完善性别与出生日期')
      return
    }
    if (needsLocation && !user.birthLocation?.trim()) {
      setError('请先选择出生地区（用于真太阳时校准）')
      return
    }
    if (user.birthCalendar === 'lunar' && !user.lunarDate) {
      setError('请先完善农历日期')
      return
    }
    if (balance < MAIN_REPORT_COST) {
      setShowInsufficient(true)
      return
    }
    setError('')
    setLoading(true)
    try {
      const archive = await createArchive({
        name: archiveNote.trim().slice(0, 12),
        gender: user.gender,
        birthDate: user.birthDate,
        birthLocation: user.birthLocation ?? '',
        birthCalendar: user.birthCalendar,
        birthTimeMode: user.birthTimeMode,
        birthTimeBranch: user.birthTimeBranch,
        lunarDate: user.lunarDate,
        isLeapMonth: user.isLeapMonth,
      })
      const { jobId } = await createReportJob({ archiveId: archive.id })
      setBalance(balance - MAIN_REPORT_COST)
      setUser((prev) => ({
        ...prev,
        archiveName: archiveNote.trim(),
        archiveNote: archiveNote.trim(),
        currentArchiveId: archive.id,
      }))
      router.push(`/report?jobId=${jobId}&archiveId=${archive.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '发起失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="text-foreground hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <div className="px-6 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-medium tracking-wider">
            为这份"编码"备注档案
          </h1>
          <p className="text-sm text-muted-foreground">
            未来更方便查阅
          </p>
        </div>

        <div className="space-y-4">
          {/* Archive Note Input */}
          <div className="space-y-3">
            <label className="text-xs text-muted-foreground tracking-wider">#档案备注</label>
            <input
              type="text"
              value={archiveNote}
              onChange={(e) => setArchiveNote(e.target.value.slice(0, 12))}
              placeholder="XXXX"
              maxLength={12}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <p className="text-xs text-muted-foreground text-right">
              {archiveNote.length}/12
            </p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
          <Button
            onClick={handleStartDecode}
            disabled={!archiveNote.trim() || loading}
            className="w-full h-12 rounded-lg"
          >
            {loading ? '正在解码' : '开启解码'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            不用担心，这份编码对会得到安全的保护
          </p>
        </div>

        {/* 分析动画：点击后在下方显示 */}
        {loading && (
          <div className="mt-8 pt-8 border-t border-border">
            <div className="text-center space-y-3 mb-6">
              <h2 className="text-lg tracking-wider font-medium">正在解码中...</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                解码不会因关闭页面而中断，完成后将自动展示报告
              </p>
            </div>

            <Separator className="bg-border mb-6" />

            {/* 分析步骤 */}
            <div className="space-y-4">
              {analysisStepsConfig.map((step, index) => {
                const isCompleted = index < currentStep
                const isInProgress = index === currentStep && loading

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
                          <span className="text-primary-foreground">✓</span>
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

            {/* 进度百分比 */}
            <div className="mt-8 pt-6 border-t border-border text-center space-y-2">
              <p className="text-2xl font-medium text-primary">
                {loading && currentStep < 5
                  ? Math.round(((currentStep + 1) / analysisStepsConfig.length) * 100)
                  : loading && currentStep === 5
                    ? 92
                    : 100}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                {loading && currentStep === 5 ? '正在生成命理解读…' : '分析进度'}
              </p>
            </div>
          </div>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
      <InsufficientBalanceDialog
        isOpen={showInsufficient}
        onClose={() => setShowInsufficient(false)}
        required={MAIN_REPORT_COST}
        currentBalance={balance}
      />
    </main>
  )
}
