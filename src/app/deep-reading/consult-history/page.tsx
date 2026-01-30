'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const mockConsultHistory = [
  {
    id: 'R-20250118-001',
    topic: '职业转型是否合适？',
    createdAt: '2025-01-18T14:20:00Z',
    status: '已完成',
  },
  {
    id: 'R-20241202-007',
    topic: '婚姻关系的未来三年',
    createdAt: '2024-12-02T10:05:00Z',
    status: '已完成',
  },
  {
    id: 'R-20241110-003',
    topic: '是否适合现在创业？',
    createdAt: '2024-11-10T19:30:00Z',
    status: '已完成',
  },
] as const

export default function ConsultHistoryPage() {
  const router = useRouter()

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
          <h1 className="text-lg font-medium tracking-wide">真人1V1 · 历史报告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          当咨询师在后台为你上传总结文案后，对应的预约号会在这里生成一条历史报告记录。
        </p>

        <div className="space-y-3 pt-2">
          {mockConsultHistory.map((item) => {
            const date = new Date(item.createdAt)
            return (
              <button
                key={item.id}
                onClick={() => router.push(`/deep-reading/consult-history/${item.id}`)}
                className="w-full text-left border border-border rounded-lg px-4 py-3 hover:border-primary/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">预约号 {item.id}</p>
                    <p className="text-sm text-foreground/90 line-clamp-1">{item.topic}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.status}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}

