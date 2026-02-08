'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAppContext } from '@/lib/context'
import { useState, useEffect } from 'react'
import { createArchive, createReportJob } from '@/lib/api-client'
import { invalidateArchivesList } from '@/lib/api-cache'
import { MAIN_REPORT_COST } from '@/lib/costs'
import { LoginModal } from '@/components/login-modal'
import { InsufficientBalanceDialog } from '@/components/insufficient-balance-dialog'

// 分析步驟配置（與後端流程對應）
const analysisStepsConfig = [
  { id: 1, label: '分析時辰', subLabel: '解析出生時間與地區' },
  { id: 2, label: '分析八字', subLabel: '節氣四柱排盤' },
  { id: 3, label: '分析排盤', subLabel: '紫微斗數命盤' },
  { id: 4, label: '先天命盤解析', subLabel: '構建分析上下文' },
  { id: 5, label: '大限與流年解析', subLabel: '生成命理解讀' },
  { id: 6, label: '輸出解碼結果', subLabel: '校驗與呈現' },
]

const ANALYSIS_STEPS_DELAY_MS = 480 // 档案名出现后再展示步骤，更从容

export function ArchivePage() {
  const router = useRouter()
  const { user, setUser, balance, setBalance } = useAppContext()
  const [archiveNote, setArchiveNote] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showInsufficient, setShowInsufficient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(analysisStepsConfig.length)
  const [decodingFadeIn, setDecodingFadeIn] = useState(false)
  const [analysisStepsVisible, setAnalysisStepsVisible] = useState(false)
  const [stepsFadeIn, setStepsFadeIn] = useState(false)

  // 进入解码视图：先淡入档案名，再延迟展示步骤并淡入
  useEffect(() => {
    if (!loading) {
      setDecodingFadeIn(false)
      setAnalysisStepsVisible(false)
      setStepsFadeIn(false)
      return
    }
    const t1 = setTimeout(() => setDecodingFadeIn(true), 40)
    const t2 = setTimeout(() => setAnalysisStepsVisible(true), ANALYSIS_STEPS_DELAY_MS)
    const t3 = setTimeout(() => setStepsFadeIn(true), ANALYSIS_STEPS_DELAY_MS + 80)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [loading])

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
      setError('請先完善性別與出生日期')
      return
    }
    if (needsLocation && !user.birthLocation?.trim()) {
      setError('請先選擇出生地區（用於真太陽時校準）')
      return
    }
    if (user.birthCalendar === 'lunar' && !user.lunarDate) {
      setError('請先完善農曆日期')
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
      invalidateArchivesList()
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
      setError(e instanceof Error ? e.message : '發起失敗')
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
      <div className="px-6 py-8 min-h-[60vh]">
        {/* 表單：未點擊解碼時顯示 */}
        {!loading && (
          <div className="space-y-8 transition-opacity duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-medium tracking-wider">
                為這份「編碼」備註檔案
              </h1>
              <p className="text-sm text-muted-foreground">
                未來更方便查閱
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground tracking-wider">#檔案備註</label>
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
                disabled={!archiveNote.trim()}
                className="w-full h-12 rounded-lg"
              >
                開啟解碼
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                不用擔心，這份編碼對會得到安全的保護
              </p>
            </div>
          </div>
        )}

        {/* 解碼視圖：點擊後描述/輸入/按鈕消失，顯示檔案名 + 正在分析，再展示步驟 */}
        {loading && (
          <div
            className={`transition-opacity duration-500 ease-out ${
              decodingFadeIn ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* 檔案名 + 正在分析 */}
            <section className="text-center space-y-3 mb-8 pt-4">
              <h1 className="text-2xl tracking-[0.2em] font-semibold text-foreground">
                {archiveNote.trim() || '檔案'}
              </h1>
              <p className="text-sm text-muted-foreground tracking-wide">正在分析</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                解碼不會因關閉頁面而中斷，完成後將自動展示報告
              </p>
            </section>

            <Separator className="bg-border mb-6" />

            {/* 分析步驟：延遲出現並淡入 */}
            {analysisStepsVisible && (
              <div
                className={`transition-opacity duration-500 ease-out ${
                  stepsFadeIn ? 'opacity-100' : 'opacity-0'
                }`}
              >
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
                        {isCompleted ? '已完成' : isInProgress ? '進行中…' : step.subLabel ?? '待處理'}
                      </p>
                    </div>
                  </div>
                )
                  })}
                </div>

                {/* 進度百分比 */}
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
                    {loading && currentStep === 5 ? '正在生成命理解讀…' : '分析進度'}
                  </p>
                </div>
              </div>
            )}
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
