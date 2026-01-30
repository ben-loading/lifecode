'use client'

import { Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface InsufficientBalanceDialogProps {
  isOpen: boolean
  onClose: () => void
  onGoTopUp?: () => void
  required?: number
  /** 当前余额，用于展示对比 */
  currentBalance?: number
}

export function InsufficientBalanceDialog({
  isOpen,
  onClose,
  onGoTopUp,
  required = 20,
  currentBalance = 0,
}: InsufficientBalanceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="sr-only">能量不足</DialogTitle>
        <div className="space-y-5 py-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-base font-medium text-foreground">能量不足</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              解锁深度报告需要 <span className="font-medium text-foreground">{required}</span> 能量，
              当前余额 <span className="font-medium text-foreground">{currentBalance}</span> 能量。
              请先充值后再试。
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-lg border-border"
            >
              稍后再说
            </Button>
            {onGoTopUp ? (
              <Button onClick={onGoTopUp} className="flex-1 rounded-lg">
                去充值
              </Button>
            ) : (
              <Button onClick={onClose} className="flex-1 rounded-lg">
                知道了
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
