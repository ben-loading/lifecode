'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { LoginModal } from '@/components/login-modal'
import { SideMenu } from '@/components/side-menu'
import { useAppContext } from '@/lib/context'
import { listArchivesCached } from '@/lib/api-cache'

export function WelcomePage() {
  const router = useRouter()
  const { user, setUser } = useAppContext()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [checkingArchives, setCheckingArchives] = useState(false)
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false) // 标记是否已检查过一次

  // 優化第5點：已有檔案的用戶默認跳轉到主報告頁
  // 注意：只在首次加載時執行一次，避免與「創建新檔案」功能衝突
  useEffect(() => {
    const checkAndRedirect = async () => {
      // 如果已經檢查過一次，不再自動跳轉（避免用戶創建新檔案後被重置）
      if (!user.isLoggedIn || checkingArchives || hasCheckedOnce || user.currentArchiveId) return
      
      setCheckingArchives(true)
      setHasCheckedOnce(true) // 標記已檢查
      try {
        const archives = await listArchivesCached()
        if (archives.length > 0) {
          // 獲取最新檔案（按創建時間排序，第一個是最新的）
          const latestArchive = archives[0]
          // 設置當前檔案到 context
          setUser((prev) => ({
            ...prev,
            currentArchiveId: latestArchive.id,
            archiveName: latestArchive.name,
          }))
          // 跳轉到主報告頁
          router.replace(`/report?archiveId=${latestArchive.id}`)
        }
      } catch {
        // 如果獲取檔案失敗，繼續顯示歡迎頁
      } finally {
        setCheckingArchives(false)
      }
    }
    
    checkAndRedirect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.isLoggedIn])

  const handleMenuClick = () => {
    if (user.isLoggedIn) {
      setShowMenu(true)
    } else {
      setShowLoginModal(true)
    }
  }

  const handleStartDecode = () => {
    if (!user.isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    router.push('/input')
  }

  return (
    <>
      <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
        {/* Header */}
        {/* 優化第7點：頂部菜單欄可見性 - 添加 safe-area-inset-top 支持，確保在帶靈動島的 iPhone 等設備上可見 */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-5 py-4">
            <button
              onClick={handleMenuClick}
              className="text-foreground hover:opacity-70 transition-opacity"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium text-primary">人生解碼</span>
            <div className="w-5" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-medium tracking-wider">人生解碼</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              以科學和命理，重新認識自我的蛻程
            </p>
          </div>

          <button
            onClick={handleStartDecode}
            className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium tracking-wider hover:opacity-90 transition-opacity"
          >
            開啟解碼
          </button>

          <p className="text-xs text-muted-foreground">
            不用擔心，這份編碼對會得到安全的保護
          </p>
        </div>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false)
          router.push('/input')
        }}
      />
      <SideMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        archiveName={user.archiveName}
        userEmail={user.email}
      />
    </>
  )
}
