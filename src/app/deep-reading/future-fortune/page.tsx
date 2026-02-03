'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { getDeepReportCached } from '@/lib/api-cache'
import type { FutureFortuneContent } from '@/lib/types/future-fortune-report'

function FutureFortuneContentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const archiveId = searchParams.get('archiveId')
  const [content, setContent] = useState<FutureFortuneContent | null>(null)
  const [loading, setLoading] = useState(!!archiveId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!archiveId) {
      setLoading(false)
      return
    }
    let cancelled = false
    getDeepReportCached(archiveId, 'future-fortune')
      .then((report) => {
        if (cancelled) return
        if (report?.content) setContent(report.content as unknown as FutureFortuneContent)
        else setError('报告不存在')
      })
      .catch(() => {
        if (!cancelled) setError('加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [archiveId])

  if (!archiveId) {
    return (
      <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-5 py-4">
            <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide">未来运势 · 深度报告</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-5 py-6">
          <p className="text-sm text-muted-foreground text-center">请从深度解读页选择档案并点击「解读」生成报告</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-5 py-4">
            <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide">未来运势 · 深度报告</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-5 py-6">
          <p className="text-sm text-muted-foreground">加载报告中…</p>
        </div>
      </main>
    )
  }

  if (error || !content) {
    return (
      <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-5 py-4">
            <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide">未来运势 · 深度报告</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-4">
          <p className="text-sm text-muted-foreground text-center">
            {error ?? '报告不存在或生成失败'}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            请返回深度解读页，点击「重新生成」免费重试
          </p>
        </div>
      </main>
    )
  }

  const 命格锚点 = content.命格锚点
  const 去年运势复盘 = content.去年运势复盘
  const 本年核心攻略 = content.本年核心攻略
  const 未来三年大势 = content.未来三年大势
  const 流月战术节奏 = content.流月战术节奏

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium tracking-wide">未来运势 · 深度报告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">命 格 锚 点</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground tracking-wider">人生点题</p>
              <p className="text-base font-medium tracking-wider text-foreground pl-3 border-l-2 border-primary">
                {命格锚点.人生点题}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground tracking-wider">时间坐标</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {命格锚点.时间坐标}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground tracking-wider">当前大运</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {命格锚点.当前大运}
              </p>
              <p className="text-xs text-foreground/70 leading-[1.6] pl-3 border-l border-border italic">
                简评：{命格锚点.当前大运简评}
              </p>
            </div>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">去 年 运 势 复 盘</h2>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground tracking-wider">2025年关键词</p>
            <p className="text-sm font-medium text-foreground text-center tracking-wide">
              {去年运势复盘.年份关键词}
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground tracking-wider">深度体感与事件验证</p>
              <p className="text-sm text-foreground/80 leading-[1.8] pl-3 border-l border-border text-justify">
                {去年运势复盘.深度体感与事件验证}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">极有可能发生了以下情况</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
              {去年运势复盘.极有可能发生.map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">本 年 核 心 攻 略</h2>
          {本年核心攻略.副标题 && (
            <p className="text-center text-[11px] text-muted-foreground">{本年核心攻略.副标题}</p>
          )}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium text-foreground tracking-wide text-center">
                2026 年度总象：{本年核心攻略.年度总象标题}
              </p>
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-2">
                <p className="text-xs font-medium text-destructive tracking-wider">警报</p>
                <p className="text-sm text-foreground/90 leading-[1.7]">{本年核心攻略.警报文案}</p>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            <h3 className="text-sm font-medium tracking-wide text-foreground">财富实战</h3>
            <div className="space-y-2 pl-3 border-l border-border">
              <p className="text-xs text-muted-foreground">流年信号</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">{本年核心攻略.财富实战.流年信号}</p>
              <p className="text-xs text-muted-foreground pt-1">行动指南</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">{本年核心攻略.财富实战.行动指南}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium tracking-wide text-foreground">情感实战</h3>
            <div className="space-y-2 pl-3 border-l border-border">
              <p className="text-xs text-muted-foreground">流年信号</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">{本年核心攻略.情感实战.流年信号}</p>
              <p className="text-xs text-muted-foreground pt-1">行动指南</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">{本年核心攻略.情感实战.行动指南}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium tracking-wide text-foreground">事业实战</h3>
            <div className="space-y-2 pl-3 border-l border-border">
              <p className="text-xs text-muted-foreground">流年信号</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">{本年核心攻略.事业实战.流年信号}</p>
              <p className="text-xs text-muted-foreground pt-1">行动指南</p>
              <p className="text-sm text-foreground/80 leading-[1.7]">{本年核心攻略.事业实战.行动指南}</p>
              {本年核心攻略.事业实战.策略补充 && (
                <p className="text-sm text-foreground/80 leading-[1.7] pt-1">
                  {本年核心攻略.事业实战.策略补充}
                </p>
              )}
            </div>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">未 来 三 年 大 势</h2>
          <div className="space-y-4">
            {未来三年大势.map((item) => (
              <div
                key={item.年份标题}
                className={`pl-3 border-l space-y-1 ${
                  item.级别样式 === 'highlight' ? 'border-primary' : 'border-border'
                }`}
              >
                <p className="text-sm font-medium text-foreground tracking-wide">{item.年份标题}</p>
                <span
                  className={`inline-block text-xs px-1.5 py-0.5 rounded mt-1 ${
                    item.级别样式 === 'highlight'
                      ? 'bg-primary/20 text-primary'
                      : item.级别样式 === 'warn'
                        ? 'border border-amber-500/50 text-amber-700'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.级别}
                </span>
                <p className="text-sm text-foreground/80 leading-[1.7] pt-1">{item.描述}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 流 月 战 术 节 奏
          </h2>
          <p className="text-center text-[11px] text-muted-foreground">针对 2026 丙午年的关键月份提醒</p>
          <div className="space-y-4">
            {流月战术节奏.map((item) => (
              <div
                key={item.season}
                className={`pl-3 border-l space-y-1 ${
                  item.variant === 'danger'
                    ? 'border-destructive/50'
                    : item.variant === 'highlight'
                      ? 'border-primary'
                      : 'border-border'
                }`}
              >
                <p className="text-sm font-medium text-foreground tracking-wide">{item.season}</p>
                <p
                  className={`text-xs ${
                    item.variant === 'danger'
                      ? 'text-destructive font-medium'
                      : item.variant === 'highlight'
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                  }`}
                >
                  {item.stems}
                  {item.stars ? ` · ${item.stars}` : ''}
                  {item.summary ? ` ${item.summary}` : ''}
                </p>
                <p className="text-sm text-foreground/80 leading-[1.7] pt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function FutureFortunePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-5 py-4">
            <h1 className="text-lg font-medium tracking-wide">未来运势 · 深度报告</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-5 py-6">
          <p className="text-sm text-muted-foreground">加载中…</p>
        </div>
      </main>
    }>
      <FutureFortuneContentInner />
    </Suspense>
  )
}
