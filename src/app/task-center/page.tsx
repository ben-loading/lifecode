'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ExternalLink, Gift } from 'lucide-react'
import { useAppContext } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { redeemCode as apiRedeemCode, getTransactions } from '@/lib/api-client'
import { useLanguage } from '@/lib/context-language'

const DISCORD_INVITE_URL = 'https://discord.gg/your-server' // 可后续改为真实 Discord 邀请链接

export default function TaskCenterPage() {
  const router = useRouter()
  const { balance, setBalance, setTransactions, earnRecords, addEarnRecord } = useAppContext()
  const { t } = useLanguage()
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleRedeem = async () => {
    const code = redeemCode.trim()
    if (!code) {
      setRedeemStatus('error')
      return
    }
    setRedeemStatus('loading')
    try {
      const res = await apiRedeemCode(code)
      setBalance(res.balance)
      addEarnRecord({
        id: `earn_${Date.now()}`,
        amount: res.amount,
        reason: `${t('兌換碼')}（${code.slice(0, 6)}***）`,
        createdAt: new Date().toISOString(),
      })
      setRedeemCode('')
      setRedeemStatus('success')
      getTransactions().then((r) => setTransactions(r.transactions)).catch(() => {})
      setTimeout(() => setRedeemStatus('idle'), 2000)
    } catch {
      setRedeemStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium tracking-wide">{t('活動中心')}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {/* 当前积分 */}
        <div className="flex items-baseline justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
          <span className="text-sm text-muted-foreground">{t('當前能量')}</span>
          <span className="text-xl font-medium text-foreground">{balance}</span>
        </div>

        {/* 优化第9点：暂时隐藏邀请任务模块 */}

        {/* 任务二：Discord 活动 + 兑换码 */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('參與 Discord 活動')}</h2>
          <Card className="border-border shadow-none">
            <CardContent className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('加入 Discord 社群參與活動，獲取積分兌換碼後在此處兌換。')}
              </p>
              <Button
                onClick={() => window.open(DISCORD_INVITE_URL, '_blank')}
                className="w-full gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {t('加入 Discord')}
              </Button>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{t('兌換碼')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder={t('請輸入兌換碼')}
                    className="flex-1 px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={handleRedeem}
                    disabled={redeemStatus === 'loading' || !redeemCode.trim()}
                    variant="outline"
                    className="shrink-0 border-border"
                  >
                    {redeemStatus === 'loading' ? t('兌換中…') : redeemStatus === 'success' ? t('兌換成功') : t('兌換')}
                  </Button>
                </div>
                {redeemStatus === 'error' && (
                  <p className="text-xs text-destructive">{t('兌換失敗，請檢查兌換碼或稍後重試。')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-border" />

        {/* 积分获得记录（与充值记录分开） */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground tracking-wide">{t('積分獲得記錄')}</h2>
          <div className="rounded-lg border border-border bg-muted/10 overflow-hidden">
            {earnRecords.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                {t('暫無記錄。使用兌換碼後，將在此展示。')}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {earnRecords.map((r) => {
                  const date = new Date(r.createdAt)
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Gift className="w-4 h-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{r.reason}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-primary shrink-0 ml-2">
                        +{r.amount}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
