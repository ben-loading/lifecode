'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'

interface ReservationDialogProps {
  isOpen: boolean
  onClose: () => void
  reservationNumber: string
  expiryDate: string
}

export function ReservationDialog({
  isOpen,
  onClose,
  reservationNumber,
  expiryDate,
}: ReservationDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reservationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <div className="space-y-6 py-4">
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground mb-2">预约号</h2>
            <p className="text-xs text-muted-foreground">请妥善保管您的预约号</p>
          </div>

          {/* Reservation Number Display */}
          <div className="text-center py-6 border border-primary/30 rounded-lg bg-primary/5">
            <p className="text-xs text-muted-foreground mb-2">预约号码</p>
            <p className="text-3xl font-bold text-primary tracking-wider">{reservationNumber}</p>
          </div>

          {/* Expiry Date */}
          <div className="text-center py-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">有效期至</p>
            <p className="text-sm font-medium text-foreground">{expiryDate} UTC+8</p>
          </div>

          {/* Copy Button */}
          <Button onClick={handleCopy} className="w-full h-11 rounded-lg" disabled={copied}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? '已复制' : '一键复制预约号'}
          </Button>

          {/* Important Notice */}
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs font-medium text-foreground">重要提示</p>
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li className="flex gap-2">
                <span className="text-primary flex-shrink-0">•</span>
                <span>在Discord发起票务，复制预约号发送至票务频道中，等待咨询师回复安排。</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary flex-shrink-0">•</span>
                <span>若发起票务后24h无咨询师回复，该预约号将会失效，并返还支付的能量。</span>
              </li>
            </ul>
          </div>

          {/* Toast notification */}
          {copied && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              已成功复制预约号
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
