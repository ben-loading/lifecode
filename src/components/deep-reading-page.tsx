'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { PaymentDialog } from '@/components/payment-dialog'
import { ReservationDialog } from '@/components/reservation-dialog'

type TabType = '深度报告' | '真人1V1' | 'AI解答'

const deepReports = [
  {
    id: 1,
    slug: 'future-fortune',
    title: '未来运势',
    description: '验证前年，深度分析未来5年明年的整体运势及趋势。',
    energy: 200,
  },
  {
    id: 2,
    slug: 'career-path',
    title: '仕途探索',
    description: '全方位剖析事业发展，深度探索职业生涯，打工？创业？延展创业当老板？',
    energy: 200,
  },
  {
    id: 3,
    slug: 'wealth-road',
    title: '财富之路',
    description: '深度剖析个人财富格局和能力，正财、偏财、投资如何配置？',
    energy: 200,
  },
  {
    id: 4,
    slug: 'love-marriage',
    title: '爱情姻缘',
    description: '撮合个人的爱情场景，提升个人的感情处理方式，感知另一半。',
    energy: 200,
  },
]

export function DeepReadingPage({ archiveName }: { archiveName?: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('深度报告')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReservationDialog, setShowReservationDialog] = useState(false)
  const [hasReservation, setHasReservation] = useState(false)
  const [currentBalance] = useState(5000) // 模拟当前能量余额
  const [reservationNumber] = useState('123456')
  const [expiryDate] = useState('2026/01/28 14:00')

  const handlePayment = () => {
    setShowPaymentDialog(true)
  }

  const handlePaymentConfirm = () => {
    setHasReservation(true)
    setShowPaymentDialog(false)
  }

  const handleViewReservation = () => {
    setShowReservationDialog(true)
  }

  const handleViewHistory = () => {
    router.push('/deep-reading/consult-history')
  }

  const handleJoinDiscord = () => {
    window.open('https://discord.gg/your-server', '_blank')
  }

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">深度解读</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-8 px-5 pb-3 border-b border-border">
          {(['深度报告', '真人1V1', 'AI解答'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {/* Archive Info */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">解读档案</p>
            <p className="text-sm font-medium text-foreground">#{archiveName || 'KC小可爱'}</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            ↗
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === '深度报告' && (
          <div className="space-y-3">
            {deepReports.map((report) => (
              <div
                key={report.id}
                className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-3">
                  {/* Title */}
                  <h3 className="text-sm font-medium text-foreground">{report.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-primary font-medium">{report.energy}能量</span>
                    <button
                      onClick={() => router.push(`/deep-reading/${report.slug}`)}
                      className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      解锁并查看
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === '真人1V1' && (
          <div className="space-y-4">
            {/* Consultation Intro Card */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">用温度化解心中的迷茫</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  加入人生编码Discord社区。在生理期前通过支付能力完成预约。咨询服务将以文字进行，咨询师完成后，咨询师会将解答大过程记录在你专属的记录档案，你可以随时查询。
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleViewHistory}
                  className="flex-1 px-3 py-2 border border-border text-foreground rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors"
                >
                  查看历史报告
                </button>
                <button
                  onClick={handleJoinDiscord}
                  className="flex-1 px-3 py-2 border border-border text-foreground rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors"
                >
                  加入Discord
                </button>
                {!hasReservation ? (
                  <button
                    onClick={handlePayment}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    2000能量 预约
                  </button>
                ) : (
                  <button
                    onClick={handleViewReservation}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    查看预约号
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'AI解答' && (
          <div className="space-y-4">
            {/* AI Card */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">AI智能解答</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  基于你的运势数据，获得AI实时智能解答和建议指导
                </p>
              </div>

              {/* Input Section */}
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="输入你的问题..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
                <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  提问
                </button>
              </div>

              {/* Tips */}
              <p className="text-xs text-muted-foreground pt-1">
                每次提问消耗20能量
              </p>
            </div>

            {/* Example Questions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">常见问题</p>
              {[
                '我的财运在哪个方面最好？',
                '如何改善我的人际关系？',
                '今年的职业发展方向是什么？',
              ].map((question, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <p className="text-sm text-foreground">{question}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handlePaymentConfirm}
        currentBalance={currentBalance}
        amount={2000}
      />

      {/* Reservation Dialog */}
      <ReservationDialog
        isOpen={showReservationDialog}
        onClose={() => setShowReservationDialog(false)}
        reservationNumber={reservationNumber}
        expiryDate={expiryDate}
      />
    </main>
  )
}
