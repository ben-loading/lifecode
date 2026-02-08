'use client'

import { Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/context-language'

interface InsufficientBalanceDialogProps {
  isOpen: boolean
  onClose: () => void
  onGoTopUp?: () => void
  required?: number
  /** 當前餘額，用於展示對比 */
  currentBalance?: number
}

export function InsufficientBalanceDialog({
  isOpen,
  onClose,
  onGoTopUp,
  required = 20,
  currentBalance = 0,
}: InsufficientBalanceDialogProps) {
  const { t } = useLanguage()
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="sr-only">{t('能量不足')}</DialogTitle>
        <div className="space-y-5 py-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-base font-medium text-foreground">{t('能量不足')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('解鎖深度報告需要')} <span className="font-medium text-foreground">{required}</span> {t('能量')}，
              {t('當前餘額')} <span className="font-medium text-foreground">{currentBalance}</span> {t('能量')}。
              {t('請先充值後再試。')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-lg border-border"
            >
              {t('稍後再說')}
            </Button>
            {onGoTopUp ? (
              <Button onClick={onGoTopUp} className="flex-1 rounded-lg">
                {t('去充值')}
              </Button>
            ) : (
              <Button onClick={onClose} className="flex-1 rounded-lg">
                {t('知道了')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
