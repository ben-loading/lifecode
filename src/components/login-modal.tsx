'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TermsDialog } from '@/components/terms-dialog'
import { ServiceTermsDialog } from '@/components/service-terms-dialog'
import { useAppContext } from '@/lib/context'
import { getSupabaseClient } from '@/lib/supabase/client'
import { setToken, flushPendingInviteRef, getTransactions } from '@/lib/api-client'

/** 简单邮箱格式：含 @ 且 @ 后含至少一个点，前后无空白 */
function isValidEmail(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

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
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [showServiceTermsDialog, setShowServiceTermsDialog] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const keySet = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      console.log('[lifecode] SUPABASE_URL:', url || '(未设置)')
      console.log('[lifecode] SUPABASE_ANON_KEY:', keySet ? '已设置' : '未设置')
    } else {
      // 關閉時重置狀態
      setAgreeTerms(false)
      setEmail('')
      setCode('')
      setCodeSent(false)
      setError('')
    }
  }, [isOpen])

  const handleSendCode = async () => {
    const trimmed = email?.trim()
    if (!trimmed) return
    if (!isValidEmail(trimmed)) {
      setError('請輸入有效的郵箱地址')
      return
    }
    setError('')
    try {
      const supabase = getSupabaseClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      })
      if (err) throw err
      setCodeSent(true)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1))
      }, 1000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '發送失敗'
      setError(msg === 'Failed to fetch' ? '網絡請求失敗，請檢查 Supabase 配置或稍後重試' : msg)
    }
  }

  const handleSubmit = async () => {
    const trimmed = email?.trim()
    if (!trimmed || !code?.trim()) return
    if (!isValidEmail(trimmed)) {
      setError('請輸入有效的郵箱地址')
      return
    }
    if (code.trim().length !== 6) {
      setError('請輸入6位數字驗證碼')
      return
    }
    if (!agreeTerms) {
      setError('請先閱讀並同意用戶協議和數據協議')
      return
    }
    setError('')
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error: err } = await supabase.auth.verifyOtp({
        email: trimmed,
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
        throw new Error(typeof serverMsg === 'string' ? serverMsg : '獲取用戶信息失敗')
      }
      const apiUser = body?.user
      if (!apiUser) throw new Error('獲取用戶信息失敗')

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
      const msg = e instanceof Error ? e.message : '登錄失敗'
      setError(msg === 'Failed to fetch' ? '網絡請求失敗，請檢查 Supabase 配置或稍後重試' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm
          overflow-hidden p-4 sm:p-6 mx-auto
"
      >
        <DialogTitle className="sr-only">登錄 / 註冊</DialogTitle>
        <div className="space-y-5 py-2 min-w-0 overflow-hidden">
          <div className="text-center min-w-0">
            <h2 className="text-lg font-medium text-foreground break-words">登錄 / 註冊</h2>
            <p className="text-xs text-muted-foreground mt-2 break-words px-1">
              使用郵箱驗證碼登錄，驗證碼將發送至您的郵箱
            </p>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="min-w-0">
              <label className="text-xs text-muted-foreground mb-2 block tracking-wider">郵箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error === '請輸入有效的郵箱地址') setError('')
                }}
                placeholder="your@email.com"
                className="w-full min-w-0 px-3 py-2 border border-border rounded-lg bg-background outline-none box-border"
              />
              {email.trim() && !isValidEmail(email.trim()) && (
                <p className="text-xs text-destructive mt-1">請輸入有效的郵箱地址</p>
              )}
            </div>

            <div className="min-w-0">
              <label className="text-xs text-muted-foreground mb-2 block tracking-wider">驗證碼（6位數字）</label>
              {/* 移動端豎排、桌面端橫排，避免「發送」被裁切 */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 min-w-0">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(/^\d*$/.test(e.target.value) ? e.target.value : code)}
                  placeholder={codeSent ? '請輸入6位驗證碼' : '請先發送驗證碼'}
                  disabled={!codeSent}
                  className="w-full min-w-0 flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none disabled:opacity-50 disabled:cursor-not-allowed box-border"
                />
                <button
                  onClick={handleSendCode}
                  disabled={!email.trim() || !isValidEmail(email.trim()) || countdown > 0}
                  className="w-full sm:w-auto sm:shrink-0 px-4 py-2.5 border border-border rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `${countdown}s` : codeSent ? '重新發送' : '發送'}
                </button>
              </div>
            </div>

            {/* 協議勾選框 */}
            <div className="min-w-0">
              <label className="flex items-start gap-2 cursor-pointer group">
                <Checkbox
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1 leading-relaxed">
                  我已閱讀並同意
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowTermsDialog(true)
                    }}
                    className="text-primary hover:underline mx-1"
                  >
                    用戶協議
                  </button>
                  、
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPrivacyDialog(true)
                    }}
                    className="text-primary hover:underline mx-1"
                  >
                    數據協議
                  </button>
                  和
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowServiceTermsDialog(true)
                    }}
                    className="text-primary hover:underline mx-1"
                  >
                    服務協議
                  </button>
                </span>
              </label>
            </div>
          </div>
          {error && <p className="text-xs text-destructive break-words">{error}</p>}
          <Button
            onClick={handleSubmit}
            className="w-full min-w-0 h-11 rounded-lg"
            disabled={!email.trim() || !isValidEmail(email.trim()) || code.trim().length !== 6 || !agreeTerms || loading}
          >
            {loading ? '登錄中...' : '登 錄'}
          </Button>
        </div>
      </DialogContent>

      {/* 協議彈窗 */}
      <TermsDialog
        isOpen={showTermsDialog}
        onClose={() => setShowTermsDialog(false)}
        type="terms"
      />
      <TermsDialog
        isOpen={showPrivacyDialog}
        onClose={() => setShowPrivacyDialog(false)}
        type="privacy"
      />
      <ServiceTermsDialog
        isOpen={showServiceTermsDialog}
        onClose={() => setShowServiceTermsDialog(false)}
      />
    </Dialog>
  )
}
