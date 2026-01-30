'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'

interface HistoryReport {
  id: string
  title: string
  date: string
  status: 'completed' | 'processing' | 'expired'
  consultantName?: string
}

const mockReports: HistoryReport[] = [
  {
    id: '1',
    title: '职业发展咨询',
    date: '2025/12/15 14:30',
    status: 'completed',
    consultantName: '李明老师',
  },
  {
    id: '2',
    title: '感情运势解读',
    date: '2025/11/08 10:00',
    status: 'completed',
    consultantName: '王芳老师',
  },
  {
    id: '3',
    title: '财富方向指导',
    date: '2025/09/22 16:45',
    status: 'completed',
    consultantName: '张伟老师',
  },
]

export function HistoryReportsPage() {
  const router = useRouter()

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'processing':
        return '进行中'
      case 'expired':
        return '已过期'
      default:
        return ''
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-primary'
      case 'processing':
        return 'text-blue-500'
      case 'expired':
        return 'text-muted-foreground'
      default:
        return ''
    }
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
          <h1 className="text-lg font-medium">历史报告</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        {mockReports.length > 0 ? (
          <div className="space-y-3">
            {mockReports.map((report) => (
              <div
                key={report.id}
                className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  // 这里可以跳转到具体报告详情页
                  console.log('[v0] View report:', report.id)
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground mb-1">{report.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        咨询师：{report.consultantName}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${getStatusColor(report.status)}`}>
                    {getStatusText(report.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">{report.date}</span>
                  <span className="text-xs text-primary font-medium">查看详情 →</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">暂无历史报告</p>
          </div>
        )}
      </div>
    </main>
  )
}
