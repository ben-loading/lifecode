'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/lib/context'
import { topup as apiTopup, getTransactions, getSession, createPaymentSession } from '@/lib/api-client'
interface TopUpDialogProps {
  isOpen: boolean
  onClose: () => void
  /** 充值成功並關閉後調用，用於父組件刷新餘額（與服務器一致） */
  onSuccess?: () => void
}

const PRESET_AMOUNTS = [200, 400, 800]

// 价格映射（与后端保持一致）
const ENERGY_PRICES: Record<number, number> = {
  200: 25,
  400: 48,
  800: 92,
}

export function TopUpDialog({ isOpen, onClose, onSuccess }: TopUpDialogProps) {
  const { balance, setBalance, setTransactions } = useAppContext()
  const [selectedAmount, setSelectedAmount] = useState<number>(PRESET_AMOUNTS[0])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setError('')
    setIsProcessing(true)
    try {
      // 检查是否配置了 Stripe（通过环境变量判断）
      const useStripe = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      
      if (useStripe) {
        // 使用 Stripe 支付
        const { url } = await createPaymentSession(selectedAmount)
        if (url) {
          // 跳转到 Stripe Checkout
          window.location.href = url
          return // 不关闭对话框，等待支付完成
        } else {
          throw new Error('無法創建支付會話')
        }
      } else {
        // 模拟支付（开发环境）
        const res = await apiTopup(selectedAmount)
        setBalance(res.balance)
        const list = await getTransactions()
        setTransactions(list.transactions)
        setIsSuccess(true)
        setTimeout(() => {
          setIsSuccess(false)
          onSuccess?.()
          onClose()
        }, 900)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '充值失敗')
      getSession().then((s) => s?.user && setBalance(s.user.balance)).catch(() => {})
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="sr-only">充值能量</DialogTitle>
        <div className="space-y-6 py-4">
          {!isSuccess ? (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-medium text-foreground">充值能量</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">當前餘額</span>
                  <span className="text-sm font-medium text-foreground">{balance} 能量</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">選擇充值檔位</p>
                  <div className="flex gap-2">
                    {PRESET_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          selectedAmount === amount
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-foreground hover:bg-muted/60'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{amount} 能量</span>
                          <span className="text-[10px] opacity-90">HK${ENERGY_PRICES[amount]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">充值金額</span>
                    <span className="text-sm font-medium text-foreground">
                      HK${ENERGY_PRICES[selectedAmount]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">充值後預計餘額</span>
                    <span className="text-sm font-medium text-foreground">
                      {balance + selectedAmount} 能量
                    </span>
                  </div>
                </div>
              </div>

              {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <div className="bg-muted/30 rounded-lg p-3 border border-border">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    當前為開發環境，支付流程為模擬。生產環境將使用 Stripe 支付。
                  </p>
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-lg bg-transparent"
                  disabled={isProcessing}
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-10 rounded-lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '跳轉支付...' : '生成支付連結...') : '確認充值'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm font-medium text-foreground">充值成功</p>
              <p className="text-xs text-muted-foreground">
                你現在有 {balance} 能量。
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

