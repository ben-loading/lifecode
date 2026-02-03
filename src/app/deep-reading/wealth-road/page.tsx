'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { getDeepReportCached } from '@/lib/api-cache'
import type { WealthRoadContent } from '@/lib/types/wealth-road-report'

function Stars({ n }: { n: number }) {
  return (
    <span className="text-primary tracking-wide" aria-label={`推荐指数 ${n} 星`}>
      {Array.from({ length: 5 }, (_, i) => (i < n ? '★' : '☆')).join('')}
    </span>
  )
}

const CHART_STROKE = '#8B6F47'
const CHART_FILL = '#A0826D'
const CHART_GRID = '#D4A574'

function WealthRoadContentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const archiveId = searchParams.get('archiveId')
  const [content, setContent] = useState<WealthRoadContent | null>(null)
  const [loading, setLoading] = useState(!!archiveId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!archiveId) {
      setLoading(false)
      return
    }
    let cancelled = false
    getDeepReportCached(archiveId, 'wealth-road')
      .then((report) => {
        if (cancelled) return
        if (report?.content) setContent(report.content as unknown as WealthRoadContent)
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
            <h1 className="text-lg font-medium tracking-wide">财富之路 · 深度报告</h1>
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
            <h1 className="text-lg font-medium tracking-wide">财富之路 · 深度报告</h1>
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
            <h1 className="text-lg font-medium tracking-wide">财富之路 · 深度报告</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-4">
          <p className="text-sm text-muted-foreground text-center">{error ?? '报告不存在或生成失败'}</p>
          <p className="text-xs text-muted-foreground text-center">请返回深度解读页，点击「重新生成」免费重试</p>
        </div>
      </main>
    )
  }

  const 财富格局总定调 = content.财富格局总定调
  const 投资理财 = content.投资理财
  const 大运财富列表 = content.大运财富列表
  const 年度财运推演 = content.年度财运推演
  const 财富漏洞与动荡 = content.财富漏洞与动荡
  const 财富年度总结 = content.财富年度总结

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium tracking-wide">财富之路 · 深度报告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">财 富 格 局 总 定 调</h2>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">财富能量级</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {财富格局总定调.财富能量级}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              简评：{财富格局总定调.财富能量级简评}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">核心驱动引擎</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {财富格局总定调.核心驱动引擎}
            </p>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            投 资 理 财 与 资 产 配 置
          </h2>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground tracking-wider">投资风格评级</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {投资理财.投资风格评级}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {投资理财.投资风格说明}
            </p>
          </div>
          <p className="text-xs text-muted-foreground tracking-wider">适合的资产种类</p>
          <div className="space-y-5">
            {(投资理财.适合的资产种类 || []).map((item, index) => (
              <Card key={index} className="border-border bg-muted/10 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">{item.名称}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>推荐指数</span>
                    <Stars n={item.推荐指数} />
                  </p>
                  <p className="text-sm text-foreground/85 leading-[1.75] font-medium">{item.建议}</p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">逻辑支撑</p>
                    <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
                      {item.逻辑支撑}
                    </p>
                  </div>
                  {item.操作策略 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">操作策略</p>
                      <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
                        {item.操作策略}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">避坑指南</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-destructive/50">
              {投资理财.避坑指南}
            </p>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            人 生 大 运 财 富 量 化 曲 线
          </h2>
          <div className="space-y-6">
            {大运财富列表.map((运) => (
              <div key={运.区间} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground tracking-wide">
                    {运.区间}（{运.岁数}）：{运.干支} 运
                  </p>
                  <span className="text-xs text-muted-foreground">{运.宫位}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">财富总评分</p>
                  <p className="text-base font-medium text-primary">{运.财富总评分} / 100</p>
                </div>
                <Card className="border-border bg-white/60 shadow-none">
                  <CardContent className="p-2 pb-2">
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart
                        data={(运.趋势波动指数 || []).map((v, i) => ({ 年: `${i + 1}`, 值: v }))}
                        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} strokeOpacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="年"
                          tick={{ fontSize: 10, fill: CHART_STROKE }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 10]}
                          tick={{ fontSize: 10, fill: CHART_STROKE }}
                          axisLine={false}
                          tickLine={false}
                          width={20}
                        />
                        <Area
                          type="monotone"
                          dataKey="值"
                          stroke={CHART_STROKE}
                          fill={CHART_FILL}
                          fillOpacity={0.25}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-center text-muted-foreground mt-1">趋势波动指数</p>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground">核心策略</p>
                <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary font-medium">
                  {运.核心策略}
                </p>
                <p className="text-xs text-muted-foreground">关键解读</p>
                <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                  {运.关键解读}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 年 度 财 运 深 度 推 演
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">2026求财重心</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {年度财运推演.求财重心}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">财运能量流（按农历月份）</p>
            <p className="text-xs text-muted-foreground">总体趋势：{年度财运推演.总体趋势}</p>
            <Card className="border-border bg-white/60 shadow-none">
              <CardContent className="p-2 pb-2">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={(年度财运推演.财运能量流 || []).map((值, i) => ({ 月: `${i + 1}月`, 值 }))}
                    margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} strokeOpacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="月"
                      tick={{ fontSize: 9, fill: CHART_STROKE }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 10, fill: CHART_STROKE }}
                      axisLine={false}
                      tickLine={false}
                      width={20}
                    />
                    <Bar dataKey="值" fill={CHART_FILL} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">进财爆发月</p>
            <div className="pl-3 border-l border-primary space-y-1">
              <p className="text-sm font-medium text-foreground">
                {(年度财运推演.进财爆发月 || ['', ''])[0]}
              </p>
              <p className="text-sm text-foreground/80 leading-[1.75]">
                {(年度财运推演.进财爆发月 || ['', ''])[1]}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">破财高危月</p>
            <div className="pl-3 border-l border-destructive/50 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {(年度财运推演.破财高危月 || ['', ''])[0]}
              </p>
              <p className="text-sm text-foreground/80 leading-[1.75]">
                {(年度财运推演.破财高危月 || ['', ''])[1]}
              </p>
            </div>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            财 富 漏 洞 与 动 荡 分 析
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">最大的耗财黑洞</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {财富漏洞与动荡.最大的耗财黑洞}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">2026特定风险</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-destructive/50">
              {财富漏洞与动荡.二零二六特定风险}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">止损方案</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
              {(财富漏洞与动荡.止损方案 || []).map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            财 富 年 度 总 结
          </h2>
          <p className="text-sm text-foreground/80 leading-[1.8] pl-3 border-l-2 border-primary">
            {财富年度总结.正文}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-xs text-muted-foreground">财运评分</span>
            <span className="text-sm text-foreground/80">
              现金流 <strong className="text-foreground">{财富年度总结.现金流评分} 分</strong>
              {' · '}
              资产置换机遇 <strong className="text-primary">{财富年度总结.资产置换机遇评分} 分</strong>
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
            {财富年度总结.最终建议}
          </p>
        </section>
      </div>
    </main>
  )
}

export default function WealthRoadPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center gap-3 px-5 py-4">
              <h1 className="text-lg font-medium tracking-wide">财富之路 · 深度报告</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center px-5 py-6">
            <p className="text-sm text-muted-foreground">加载中…</p>
          </div>
        </main>
      }
    >
      <WealthRoadContentInner />
    </Suspense>
  )
}
