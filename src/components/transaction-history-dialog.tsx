'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAppContext } from '@/lib/context'

/** 消费记录描述展示：深度报告英文 slug → 中文（仅前端展示，不动后端/数据库） */
const DEEP_REPORT_DISPLAY_LABELS: Record<string, string> = {
  'future-fortune': '未来运势',
  'career-path': '仕途探索',
  'wealth-road': '财富之路',
  'love-marriage': '爱情姻缘',
}

function formatTransactionDescription(description: string): string {
  const prefix = '深度报告：'
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
        <DialogTitle className="sr-only">充值与消费记录</DialogTitle>
        <div className="space-y-4 py-3 max-h-[420px] flex flex-col">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-medium text-foreground">充值与消费记录</h2>
            <p className="text-xs text-muted-foreground">
              当前余额：<span className="font-medium text-foreground">{balance ?? 0}</span> 能量
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {list.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-6">
                暂无记录。完成一次充值或消费后，会在这里看到流水。
              </p>
            ) : (
              list.map((tx) => {
                const date = new Date(tx.createdAt)
                const label =
                  tx.type === 'topup' ? '充值' : '消费'
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
            支付网关接入后，这里将展示来自 Stripe / 第三方支付的真实订单记录。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

