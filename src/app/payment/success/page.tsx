'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppContext } from '@/lib/context'
import { getSession } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setBalance } = useAppContext()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // 支付成功后，刷新用户余额
    const refreshBalance = async () => {
      try {
        const session = await getSession()
        if (session?.user) {
          setBalance(session.user.balance)
        }
      } catch (e) {
        console.error('[payment/success] 刷新余额失败:', e)
      } finally {
        setLoading(false)
      }
    }

    refreshBalance()
  }, [setBalance])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="max-w-sm w-full text-center space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">處理中...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">支付成功</h1>
              <p className="text-sm text-muted-foreground">
                能量已成功充值到您的帳戶
              </p>
              {sessionId && (
                <p className="text-xs text-muted-foreground mt-2">
                  訂單號：{sessionId.slice(0, 20)}...
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1"
              >
                返回首頁
              </Button>
              <Button
                onClick={() => router.push('/task-center')}
                className="flex-1"
              >
                查看餘額
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">載入中...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
