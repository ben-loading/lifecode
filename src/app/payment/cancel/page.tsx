'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <XCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">支付已取消</h1>
          <p className="text-sm text-muted-foreground">
            您已取消本次支付，能量未充值
          </p>
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
            onClick={() => router.back()}
            className="flex-1"
          >
            重新支付
          </Button>
        </div>
      </div>
    </div>
  )
}
