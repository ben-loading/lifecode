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

  // 优化第5点：已有档案的用户默认跳转到主报告页
  // 注意：只在首次加载时执行一次，避免与"创建新档案"功能冲突
  useEffect(() => {
    const checkAndRedirect = async () => {
      // 如果已经检查过一次，不再自动跳转（避免用户创建新档案后被重置）
      if (!user.isLoggedIn || checkingArchives || hasCheckedOnce || user.currentArchiveId) return
      
      setCheckingArchives(true)
      setHasCheckedOnce(true) // 标记已检查
      try {
        const archives = await listArchivesCached()
        if (archives.length > 0) {
          // 获取最新档案（按创建时间排序，第一个是最新的）
          const latestArchive = archives[0]
          // 设置当前档案到 context
          setUser((prev) => ({
            ...prev,
            currentArchiveId: latestArchive.id,
            archiveName: latestArchive.name,
          }))
          // 跳转到主报告页
          router.replace(`/report?archiveId=${latestArchive.id}`)
        }
      } catch {
        // 如果获取档案失败，继续显示欢迎页
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
        {/* 优化第7点：顶部菜单栏可见性 - 添加 safe-area-inset-top 支持，确保在带灵动岛的 iPhone 等设备上可见 */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between px-5 py-4">
            <button
              onClick={handleMenuClick}
              className="text-foreground hover:opacity-70 transition-opacity"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium text-primary">人生解码</span>
            <div className="w-5" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-medium tracking-wider">人生解码</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              以科学和命理，重新认识自我的蜕程
            </p>
          </div>

          <button
            onClick={handleStartDecode}
            className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-medium tracking-wider hover:opacity-90 transition-opacity"
          >
            开启解码
          </button>

          <p className="text-xs text-muted-foreground">
            不用担心，这份编码对会得到安全的保护
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
