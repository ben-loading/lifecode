'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAppContext } from '@/lib/context'

/** 消費記錄描述展示：深度報告英文 slug → 繁體中文（僅前端展示，不動後端/數據庫） */
const DEEP_REPORT_DISPLAY_LABELS: Record<string, string> = {
  'future-fortune': '未來運勢',
  'career-path': '仕途探索',
  'wealth-road': '財富之路',
  'love-marriage': '愛情姻緣',
}

function formatTransactionDescription(description: string): string {
  const prefix = '深度報告：'
  if (!description.startsWith(prefix)) return description
  const slug = description.slice(prefix.length)
  const label = DEEP_REPORT_DISPLAY_LABELS[slug]
  return label ? `${prefix}${label}` : description
}

interface TransactionHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function TransactionHistoryDialog({
  isOpen,
  onClose,
}: TransactionHistoryDialogProps) {
  const { transactions, balance } = useAppContext()
  const list = Array.isArray(transactions) ? transactions : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="sr-only">充值與消費記錄</DialogTitle>
        <div className="space-y-4 py-3 max-h-[420px] flex flex-col">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-medium text-foreground">充值與消費記錄</h2>
            <p className="text-xs text-muted-foreground">
              當前餘額：<span className="font-medium text-foreground">{balance ?? 0}</span> 能量
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {list.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-6">
                暫無記錄。完成一次充值或消費後，會在這裡看到流水。
              </p>
            ) : (
              list.map((tx) => {
                const date = new Date(tx.createdAt)
                const label =
                  tx.type === 'topup' ? '充值' : '消費'
                const sign = tx.type === 'topup' ? '+' : '-'

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-background"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-1.5 py-0.5 rounded-full border text-[10px] ${
                            tx.type === 'topup'
                              ? 'border-emerald-500 text-emerald-600'
                              : 'border-amber-600 text-amber-700'
                          }`}
                        >
                          {label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-snug">
                        {formatTransactionDescription(tx.description)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          tx.type === 'topup' ? 'text-emerald-600' : 'text-amber-700'
                        }`}
                      >
                        {sign}
                        {tx.amount}
                      </p>
                      <p className="text-[10px] text-muted-foreground">能量</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <p className="text-[10px] text-muted-foreground text-center pt-1">
            支付網關接入後，這裡將展示來自 Stripe / 第三方支付的真實訂單記錄。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

