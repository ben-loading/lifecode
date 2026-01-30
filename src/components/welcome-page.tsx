'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { LoginModal } from '@/components/login-modal'
import { SideMenu } from '@/components/side-menu'
import { useAppContext } from '@/lib/context'

export function WelcomePage() {
  const router = useRouter()
  const { user } = useAppContext()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

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
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
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
