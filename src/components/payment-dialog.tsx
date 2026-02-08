'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentBalance: number
  amount: number
}

export function PaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  currentBalance,
  amount,
}: PaymentDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    // 模拟支付处理
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsProcessing(false)
    setIsSuccess(true)
    
    // 显示成功状态1秒后关闭
    setTimeout(() => {
      onConfirm()
      setIsSuccess(false)
      onClose()
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <div className="space-y-6 py-4">
          {!isSuccess ? (
            <>
              <div className="text-center">
                <h2 className="text-lg font-medium text-foreground mb-2">確認支付</h2>
                <p className="text-xs text-muted-foreground">真人1對1諮詢預約</p>
              </div>

              <div className="space-y-4">
                {/* Balance Info */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">當前餘額</span>
                  <span className="text-sm font-medium text-foreground">{currentBalance} 能量</span>
                </div>

                {/* Payment Amount */}
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">支付金額</span>
                  <span className="text-lg font-semibold text-primary">{amount} 能量</span>
                </div>

                {/* After Balance */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">支付後餘額</span>
                  <span className="text-sm font-medium text-foreground">
                    {currentBalance - amount} 能量
                  </span>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ⚠️ 重要提示：此為虛擬服務費用，支付後不可退換。確認預約後，請在Discord票務頻道提交您的預約號。
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-11 rounded-lg bg-transparent"
                  disabled={isProcessing}
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-11 rounded-lg"
                  disabled={isProcessing || currentBalance < amount}
                >
                  {isProcessing ? '處理中...' : '確認支付'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">支付成功</h3>
              <p className="text-sm text-muted-foreground">正在生成預約號...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
