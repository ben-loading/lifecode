'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppContext } from '@/lib/context'
import { Check } from 'lucide-react'

interface AnalysisStep {
  id: string
  label: string
  completed: boolean
}

export function AnalyzingPage() {
  const router = useRouter()
  const { user } = useAppContext()
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: '1', label: '编码解析｜完成', completed: true },
    { id: '2', label: '采用梦境·数术诊断', completed: false },
    { id: '3', label: '先天命盘解析｜待执行', completed: false },
    { id: '4', label: '全域能量解析｜待执行', completed: false },
    { id: '5', label: '大限定势分析｜待执行', completed: false },
    { id: '6', label: '流年波动解析｜待执行', completed: false },
  ])
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    // Simulate analysis progress
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 6) {
          clearInterval(timer)
          // Navigate to report page after analysis completes
          setTimeout(() => {
            router.push('/report')
          }, 1000)
          return prev
        }
        return prev + 1
      })
    }, 2000)

    return () => clearInterval(timer)
  }, [router])

  useEffect(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step, index) => ({
        ...step,
        completed: index < currentStep,
      }))
    )
  }, [currentStep])

  const completedCount = steps.filter((s) => s.completed).length
  const progress = (completedCount / steps.length) * 100

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-xs text-muted-foreground tracking-wider">人生</p>
            <p className="text-xl font-medium tracking-wider">解码</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-8 space-y-8">
        {/* User Info */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-medium tracking-wider">{user.name || '用户'}</h2>
          <p className="text-xs text-muted-foreground">
            正在为编码中...
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            正在深入解读内在密码，预测流年变化，提供专业建议
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground tracking-wider">分析进度</p>
            <p className="text-sm font-medium text-foreground">
              {completedCount}/{steps.length}
            </p>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Analysis Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                step.completed
                  ? 'bg-primary/10 border border-primary/20'
                  : index === currentStep - 1
                    ? 'bg-background border border-primary/50 animate-pulse'
                    : 'bg-background border border-border'
              }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                ) : index === currentStep - 1 ? (
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-border" />
                )}
              </div>
              <p
                className={`text-sm transition-colors ${
                  step.completed || index === currentStep - 1
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>

        {/* Loading Message */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {currentStep === 6
              ? '分析完成，即将为你呈现结果...'
              : '正在深度分析中，请耐心等待'}
          </p>
        </div>
      </div>
    </main>
  )
}
