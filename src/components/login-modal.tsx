'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/lib/context'
import { sendCode, login, setToken, flushPendingInviteRef, getTransactions } from '@/lib/api-client'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { setUser, setBalance, setTransactions } = useAppContext()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async () => {
    if (!email?.trim()) return
    setError('')
    try {
      await sendCode({ email: email.trim() })
      setCodeSent(true)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1))
      }, 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败')
    }
  }

  const handleSubmit = async () => {
    if (!email?.trim() || !code?.trim()) return
    setError('')
    setLoading(true)
    try {
      const { user: apiUser, token } = await login({ email: email.trim(), code: code.trim() })
      setToken(token)
      setUser({
        isLoggedIn: true,
        email: apiUser.email,
        name: apiUser.name ?? email.split('@')[0],
        inviteRef: apiUser.inviteRef,
      })
      setBalance(apiUser.balance)
      await flushPendingInviteRef()
      getTransactions().then((r) => setTransactions(r.transactions)).catch(() => {})
      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = (_provider: string) => {
    setUser({
      isLoggedIn: true,
      email: `user@example.com`,
      name: 'User',
    })
    setBalance(20)
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="sr-only">登录 / 注册</DialogTitle>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">登录 / 注册</h2>
            <p className="text-xs text-muted-foreground mt-2">使用验证码快速登录</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block tracking-wider">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block tracking-wider">
                验证码
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={codeSent ? '输入验证码' : '请先发送验证码'}
                  disabled={!codeSent}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendCode}
                  disabled={!email || countdown > 0}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送'}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            onClick={handleSubmit}
            className="w-full h-11 rounded-lg"
            disabled={!email || !code || loading}
          >
            {loading ? '登录中...' : '登 录'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">或使用以下方式</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <button
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm font-medium">使用 Google 登录</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
