'use client'

import { useState } from 'react'
import { ChevronLeft, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/lib/context'
import { TopUpDialog } from '@/components/topup-dialog'
import { TransactionHistoryDialog } from '@/components/transaction-history-dialog'

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

  const handleCreateNewArchive = () => {
    // 保持登录状态，重置当前档案信息，回到欢迎页让用户重新发起解码
    setUser({
      isLoggedIn: true,
      email: user.email,
      name: user.name,
    })
    onClose()
    router.push('/')
  }

  const handleLogout = () => {
    setUser({ isLoggedIn: false })
    onClose()
    router.push('/')
  }

  return (
    <>
      {/* Overlay - Fixed positioning to cover everything including header */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Menu Panel - Slide animation */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-background border-r border-border z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
          <span className="text-sm font-medium">档案</span>
          <button
            onClick={onClose}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Archive Button */}
        <div className="px-5 py-3">
          <button
            onClick={handleCreateNewArchive}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
          >
            <span>⊕</span>
            <span>创建新档案</span>
          </button>
        </div>

        {/* Archives List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 space-y-3">
          {/* Current Archive */}
          {archiveName && (
            <div className="space-y-2">
              <div className="px-4 py-3 bg-primary/5 border-2 border-primary rounded text-sm font-medium text-foreground">
                {archiveName}
              </div>
            </div>
          )}

          {/* Other Archives (示例占位，将来可接真实档案列表) */}
          <div className="space-y-2 pt-2">
            <div className="px-3 py-2 text-xs text-muted-foreground rounded border border-dashed border-border/60">
              更多历史档案展示将接入后端服务
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-4 mt-4" />

          {/* Menu Items */}
          <div className="space-y-2 text-sm">
            <button
              onClick={() => {
                router.push('/deep-reading')
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
              任务中心
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
        </div>

        {/* Footer - User Info & Billing */}
        {userEmail && (
          <div className="border-t border-border p-5 space-y-4">
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

