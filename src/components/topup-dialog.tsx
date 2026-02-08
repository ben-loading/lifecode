'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/lib/context'
import { topup as apiTopup, getTransactions, getSession } from '@/lib/api-client'
interface TopUpDialogProps {
  isOpen: boolean
  onClose: () => void
  /** 充值成功並關閉後調用，用於父組件刷新餘額（與服務器一致） */
  onSuccess?: () => void
}

const PRESET_AMOUNTS = [200, 500, 1000]

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
    } catch (e) {
      setError(e instanceof Error ? e.message : '充值失敗')
      getSession().then((s) => s?.user && setBalance(s.user.balance)).catch(() => {})
    } finally {
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
                <p className="text-xs text-muted-foreground">未來會接入 Stripe / 支付服務</p>
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
                        {amount} 能量
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">充值後預計餘額</span>
                  <span className="text-sm font-medium text-foreground">
                    {balance + selectedAmount} 能量
                  </span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  當前為產品設計階段，支付流程為模擬。未來將接入 Stripe / 第三方支付，所有真實支付都會在此彈窗中發起。
                </p>
              </div>

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
                  {isProcessing ? '生成支付連結...' : '確認充值'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm font-medium text-foreground">充值成功（模擬）</p>
              <p className="text-xs text-muted-foreground">
                你現在有 {balance} 能量。後續支付接入時，這裡會展示真實訂單狀態。
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

