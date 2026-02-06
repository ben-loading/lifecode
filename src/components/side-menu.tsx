'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, LogOut, FileText } from 'lucide-react'

import { useRouter } from 'next/navigation'
import { useAppContext } from '@/lib/context'
import { clearToken } from '@/lib/api-client'
import { listArchivesCached } from '@/lib/api-cache'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { ApiArchive } from '@/lib/types/api'
import { TopUpDialog } from '@/components/topup-dialog'
import { TransactionHistoryDialog } from '@/components/transaction-history-dialog'
import { toast } from 'sonner'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
  archiveName?: string
  userEmail?: string
}

export function SideMenu({ isOpen, onClose, archiveName, userEmail }: SideMenuProps) {
  const router = useRouter()
  const { user, setUser, balance } = useAppContext()
  const [showTopUp, setShowTopUp] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [archiveList, setArchiveList] = useState<ApiArchive[]>([])
  const [archiveListLoading, setArchiveListLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !userEmail) {
      setArchiveListLoading(false)
      return
    }
    setArchiveListLoading(true)
    listArchivesCached()
      .then((list) => setArchiveList(list ?? []))
      .catch(() => setArchiveList([]))
      .finally(() => setArchiveListLoading(false))
  }, [isOpen, userEmail])

  const handleCreateNewArchive = () => {
    setUser((prev) => ({
      ...prev,
      archiveName: undefined,
      currentArchiveId: undefined,
      archiveNote: undefined,
    }))
    // 仅清空当前档案选择，保留登录态与账号信息；旧档案仍在后端，下次打开侧栏会重新拉取列表
    onClose()
    router.push('/')
  }

  const handleSelectArchive = (archive: ApiArchive) => {
    setUser((prev) => ({
      ...prev,
      currentArchiveId: archive.id,
      archiveName: archive.name,
    }))
    onClose()
    router.push(`/report?archiveId=${archive.id}`)
  }

  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut()
    clearToken()
    setUser({ isLoggedIn: false })
    onClose()
    router.push('/')
  }

  return (
    <>
      {/* Overlay - 覆盖整页（含顶部人生解码栏），保持一致性 */}
      <div
        className={`fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Menu Panel - Slide animation，在蒙层之上 */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-background border-r border-border z-[70] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header - Fixed Position */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background shrink-0">
          <span className="text-sm font-medium">档案</span>
          <button
            onClick={onClose}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Archive Button */}
        <div className="px-5 py-3 shrink-0">
          <button
            onClick={handleCreateNewArchive}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
          >
            <span>⊕</span>
            <span>创建新档案</span>
          </button>
        </div>

        {/* Archives List - Scrollable, Fixed Height (约4个档案的高度: 每个档案约3.5rem，4个约14rem) */}
        <div className="px-5 overflow-y-auto shrink-0" style={{ height: '14rem', maxHeight: '14rem' }}>
          {archiveListLoading ? (
            <div className="px-3 py-4 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">加载档案列表中…</p>
            </div>
          ) : archiveList.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground rounded border border-dashed border-border/60">
              暂无档案，创建新档案后将在此展示
            </div>
          ) : (
            <div className="space-y-2">
              {archiveList.map((archive) => {
                const isCurrent = archive.id === user.currentArchiveId
                return (
                  <button
                    key={archive.id}
                    type="button"
                    onClick={() => handleSelectArchive(archive)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                      isCurrent
                        ? 'bg-primary/5 border-2 border-primary text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{archive.name || archive.id}</span>
                    {isCurrent && <span className="text-[10px] text-primary shrink-0">当前</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border shrink-0" />

        {/* Menu Items - Fixed Position */}
        <div className="px-5 py-3 space-y-2 text-sm shrink-0">
          <button
            onClick={async () => {
              // 优化第6点：无档案时深度解读入口 - 检查是否有档案
              if (archiveList.length === 0 && !archiveListLoading) {
                toast.error('请先创建档案进行解码开启')
                onClose()
                return
              }
              const archiveId = user.currentArchiveId
              router.push(archiveId ? `/deep-reading?archiveId=${archiveId}` : '/deep-reading')
              onClose()
            }}
            className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
          >
            深度解读
          </button>
          <button
            onClick={() => {
              router.push('/task-center')
              onClose()
            }}
            className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
          >
            活动中心
          </button>
          <button
            onClick={() => {
              window.open('https://discord.gg/your-server', '_blank')
              onClose()
            }}
            className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
          >
            Discord 社群
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
          >
            联系客服
          </button>
        </div>

        {/* Spacer - Push footer to bottom */}
        <div className="flex-1" />

        {/* Footer - User Info & Billing - Fixed at Bottom */}
        {userEmail && (
          <div className="border-t border-border p-5 space-y-4 shrink-0">
            {/* Email */}
            <span className="text-sm text-foreground truncate block">{userEmail}</span>

            {/* Energy Display */}
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-medium text-foreground">{balance}</p>
              <p className="text-xs text-muted-foreground">能量</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowTopUp(true)}
                className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              >
                充值
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex-1 px-3 py-2 border border-border text-foreground rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors"
              >
                记录
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TopUpDialog isOpen={showTopUp} onClose={() => setShowTopUp(false)} />
      <TransactionHistoryDialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  )
}

