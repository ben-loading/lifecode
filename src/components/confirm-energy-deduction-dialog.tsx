'use client'

import { Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/context-language'

interface ConfirmEnergyDeductionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  reportTitle: string
  required?: number
  /** 当前余额，用于展示对比 */
  currentBalance?: number
}

export function ConfirmEnergyDeductionDialog({
  isOpen,
  onClose,
  onConfirm,
  reportTitle,
  required = 200,
  currentBalance = 0,
}: ConfirmEnergyDeductionDialogProps) {
  const { t } = useLanguage()
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="sr-only">{t('確認扣除能量')}</DialogTitle>
          <div className="space-y-5 py-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-base font-medium text-foreground">{t('確認扣除能量')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('解鎖')} <span className="font-medium text-foreground">{reportTitle}</span> {t('需要消耗')}{' '}
              <span className="font-medium text-foreground">{required}</span> {t('能量')}。
              <br />
              {t('當前餘額')}：<span className="font-medium text-foreground">{currentBalance}</span> {t('能量')}
              <br />
              {t('扣除後餘額')}：<span className="font-medium text-foreground">{currentBalance - required}</span> {t('能量')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-lg border-border"
            >
              {t('取消')}
            </Button>
            <Button onClick={onConfirm} className="flex-1 rounded-lg">
              {t('確認扣除')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
