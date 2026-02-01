'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/lib/context'
import { getSupabaseClient } from '@/lib/supabase/client'
import { setToken, flushPendingInviteRef, getTransactions } from '@/lib/api-client'

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

  useEffect(() => {
    if (isOpen) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const keySet = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      console.log('[lifecode] SUPABASE_URL:', url || '(未设置)')
      console.log('[lifecode] SUPABASE_ANON_KEY:', keySet ? '已设置' : '未设置')
    }
  }, [isOpen])

  const handleSendCode = async () => {
    if (!email?.trim()) return
    setError('')
    try {
      const supabase = getSupabaseClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })
      if (err) throw err
      setCodeSent(true)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1))
      }, 1000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '发送失败'
      setError(msg === 'Failed to fetch' ? '网络请求失败，请检查 Supabase 配置或稍后重试' : msg)
    }
  }

  const handleSubmit = async () => {
    if (!email?.trim() || !code?.trim()) return
    if (code.trim().length !== 6) {
      setError('请输入6位数字验证码')
      return
    }
    setError('')
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error: err } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      })
      if (err) throw err
      if (!data.session?.access_token) throw new Error('验证失败')

      setToken(data.session.access_token)

      const apiRes = await fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      })
      const body = await apiRes.json().catch(() => ({}))
      if (!apiRes.ok) {
        const serverMsg = body?.error
        throw new Error(typeof serverMsg === 'string' ? serverMsg : '获取用户信息失败')
      }
      const apiUser = body?.user
      if (!apiUser) throw new Error('获取用户信息失败')

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
      const msg = e instanceof Error ? e.message : '登录失败'
      setError(msg === 'Failed to fetch' ? '网络请求失败，请检查 Supabase 配置或稍后重试' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm mx-auto">
        <DialogTitle className="sr-only">登录 / 注册</DialogTitle>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">登录 / 注册</h2>
            <p className="text-xs text-muted-foreground mt-2">
              使用邮箱验证码登录，验证码将发送至您的邮箱
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block tracking-wider">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block tracking-wider">验证码（6位数字）</label>
              <div className="flex gap-2 min-w-0">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(/^\d*$/.test(e.target.value) ? e.target.value : code)}
                  placeholder={codeSent ? '请输入6位验证码' : '请先发送验证码'}
                  disabled={!codeSent}
                  className="min-w-0 flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendCode}
                  disabled={!email || countdown > 0}
                  className="shrink-0 px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={!email || code.trim().length !== 6 || loading}
          >
            {loading ? '登录中...' : '登 录'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
