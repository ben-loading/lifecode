'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/lib/context'
import { useState } from 'react'
import { createArchive, createReportJob } from '@/lib/api-client'
import { MAIN_REPORT_COST } from '@/lib/costs'
import { LoginModal } from '@/components/login-modal'
import { InsufficientBalanceDialog } from '@/components/insufficient-balance-dialog'

export function ArchivePage() {
  const router = useRouter()
  const { user, setUser, balance, setBalance } = useAppContext()
  const [archiveNote, setArchiveNote] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showInsufficient, setShowInsufficient] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
            {loading ? '发起中…' : '开启解码'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            不用担心，这份编码对会得到安全的保护
          </p>
        </div>
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
