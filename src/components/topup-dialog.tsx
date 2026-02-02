'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/lib/context'
import { topup as apiTopup, getTransactions, getSession } from '@/lib/api-client'

interface TopUpDialogProps {
  isOpen: boolean
  onClose: () => void
  /** 充值成功并关闭后调用，用于父组件刷新余额（与服务器一致） */
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
      setError(e instanceof Error ? e.message : '充值失败')
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
                <p className="text-xs text-muted-foreground">未来会接入 Stripe / 支付服务</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">当前余额</span>
                  <span className="text-sm font-medium text-foreground">{balance} 能量</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">选择充值档位</p>
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
                  <span className="text-xs text-muted-foreground">充值后预计余额</span>
                  <span className="text-sm font-medium text-foreground">
                    {balance + selectedAmount} 能量
                  </span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  当前为产品设计阶段，支付流程为模拟。未来将接入 Stripe / 第三方支付，所有真实支付都会在此弹窗中发起。
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
                  {isProcessing ? '生成支付链接...' : '确认充值'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm font-medium text-foreground">充值成功（模拟）</p>
              <p className="text-xs text-muted-foreground">
                你现在有 {balance} 能量。后续支付接入时，这里会展示真实订单状态。
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

