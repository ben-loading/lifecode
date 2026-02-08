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
import { useLanguage } from '@/lib/context-language'
import type { CareerPathContent } from '@/lib/types/career-path-report'

const CHART_STROKE = '#8B6F47'
const CHART_FILL = '#A0826D'
const CHART_GRID = '#D4A574'

function CareerPathContentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const archiveId = searchParams.get('archiveId')
  const [content, setContent] = useState<CareerPathContent | null>(null)
  const [loading, setLoading] = useState(!!archiveId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!archiveId) {
      setLoading(false)
      return
    }
    let cancelled = false
    getDeepReportCached(archiveId, 'career-path')
      .then((report) => {
        if (cancelled) return
        if (report?.content) setContent(report.content as unknown as CareerPathContent)
        else setError(t('報告不存在'))
      })
      .catch(() => {
        if (!cancelled) setError(t('載入失敗'))
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
            <button
              onClick={() => router.back()}
              className="text-foreground hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide">{t('仕途探索 · 深度報告')}</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-5 py-6">
          <p className="text-sm text-muted-foreground text-center">{t('請從深度解讀頁選擇檔案並點擊「解讀」生成報告')}</p>
        </div>
      </main>
    )
  }

  if (loading) {
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
            <h1 className="text-lg font-medium tracking-wide">{t('仕途探索 · 深度報告')}</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-5 py-6">
          <p className="text-sm text-muted-foreground">{t('載入報告中…')}</p>
        </div>
      </main>
    )
  }

  if (error || !content) {
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
            <h1 className="text-lg font-medium tracking-wide">{t('仕途探索 · 深度報告')}</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-4">
          <p className="text-sm text-muted-foreground text-center">
            {error ?? t('報告不存在或生成失敗')}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            {t('請返回深度解讀頁，點擊「重新生成」免費重試')}
          </p>
        </div>
      </main>
    )
  }

  const 长期战略 = content.长期战略
  const 大运列表 = content.大运列表
  const 年度事业重心 = content.年度事业重心
  const 流月走势 = content.流月走势
  const 动荡预警 = content.动荡预警
  const 助力分析 = content.助力分析
  const 事业年度总结 = content.事业年度总结

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
          <h1 className="text-lg font-medium tracking-wide">仕途探索 · 深度報告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* 1. 长期战略：赛道与模式定位 */}
        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            長 期 戰 略：賽 道 與 模 式 定 位
          </h2>
          {长期战略.副标题 && (
            <p className="text-center text-[11px] text-muted-foreground">
              {长期战略.副标题}
            </p>
          )}

          <Card className="border-primary/30 bg-primary/5 shadow-none">
            <CardContent className="p-5 space-y-5">
              <p className="text-sm font-medium text-foreground tracking-wide">
                最强赛道 A · {长期战略.最强赛道A.标签}
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">行業領域</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l-2 border-primary">
                    {长期战略.最强赛道A.行业领域}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">上限高度</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.最强赛道A.上限高度}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">發展路徑</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.最强赛道A.发展路径}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">理由</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.最强赛道A.理由}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/20 shadow-none">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm font-medium text-foreground tracking-wide">
                次选赛道 B · {长期战略.次选赛道B.标签}
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">行業領域</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.次选赛道B.行业领域}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground tracking-wider">簡評</p>
                  <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                    {长期战略.次选赛道B.简评}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-background shadow-none">
            <CardContent className="p-5 space-y-5">
              <p className="text-sm font-medium text-foreground tracking-wide">
                模式選擇：打工 VS 創業
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>打工 {长期战略.模式选择.打工胜率}%</span>
                  <span>創業 {长期战略.模式选择.创业胜率}%</span>
                </div>
                <div className="h-7 rounded-full overflow-hidden flex bg-muted">
                  <div
                    className="h-full bg-muted-foreground/25 flex items-center justify-end pr-2"
                    style={{ width: `${长期战略.模式选择.打工胜率}%` }}
                  />
                  <div
                    className="h-full bg-primary flex items-center justify-start pl-2"
                    style={{ width: `${长期战略.模式选择.创业胜率}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-muted-foreground tracking-wider">角色定位</p>
                <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                  {长期战略.模式选择.角色定位}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground tracking-wider">深度解析</p>
                <p className="text-sm text-foreground/85 leading-[1.75] pl-3 border-l border-border">
                  {长期战略.模式选择.深度解析}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-border" />

        {/* 2. 人生大运事业能量曲线 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            人 生 大 運 事 業 能 量 曲 線
          </h2>
          <div className="space-y-6">
            {大运列表.map((运, index) => (
              <div key={`${运.区间}-${运.岁数}-${index}`} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground tracking-wide">
                    {运.区间}（{运.岁数}）：{运.干支} 运
                  </p>
                  <span className="text-xs text-muted-foreground">{运.宫位}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">事業總評分</p>
                  <p className="text-base font-medium text-primary">{运.事业总评分} / 100</p>
                </div>
                <Card className="border-border bg-white/60 shadow-none">
                  <CardContent className="p-2 pb-2">
                    <ResponsiveContainer width="100%" height={140}>
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
                    <p className="text-[10px] text-center text-muted-foreground mt-1">趨勢波動指數</p>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground">核心策略</p>
                <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary font-medium">
                  {运.核心策略}
                </p>
                <p className="text-xs text-muted-foreground">關鍵解讀</p>
                <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                  {运.关键解读}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 3. 年度事业重心与行动指南 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 年 度 事 業 重 心 與 行 動 指 南
          </h2>
          {年度事业重心.副标题 && (
            <p className="text-center text-[11px] text-muted-foreground">
              {年度事业重心.副标题}
            </p>
          )}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground tracking-wider">年度關鍵詞</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {年度事业重心.年度关键词}
            </p>
            <p className="text-xs text-muted-foreground tracking-wider">核心戰略</p>
            <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
              {年度事业重心.核心战略}
            </p>
            <p className="text-xs text-muted-foreground tracking-wider">行動指南</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
              {(年度事业重心.行动指南 || []).map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* 4. 流月走势与关键节点 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 流 月 走 勢 與 關 鍵 節 點
          </h2>
          <p className="text-xs text-muted-foreground tracking-wider">事業能量流</p>
          <Card className="border-border bg-white/60 shadow-none">
            <CardContent className="p-2 pb-2">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={(流月走势.事业能量流 || []).map((值, i) => ({
                    月: `${i + 1}月`,
                    值,
                  }))}
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
          <p className="text-xs text-muted-foreground tracking-wider">挑戰關鍵流月（防守期）</p>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
            {(流月走势.挑战关键流月 || []).map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground tracking-wider">高能關鍵流月（進攻期）</p>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary">
            {(流月走势.高能关键流月 || []).map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
        </section>

        <Separator className="bg-border" />

        {/* 5. 动荡预警与回避方案 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            動 盪 預 警 與 回 避 方 案
          </h2>
          <p className="text-xs text-muted-foreground tracking-wider">可能出現的動盪事件</p>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
            {(动荡预警.可能出现的动荡事件 || []).map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground tracking-wider">回避與止損方案</p>
          <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary">
            {动荡预警.回避与止损方案}
          </p>
        </section>

        <Separator className="bg-border" />

        {/* 6. 助力分析与化解建议 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            助 力 分 析 與 化 解 建 議
          </h2>
          <p className="text-xs text-muted-foreground tracking-wider">核心助力來源</p>
          <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
            {助力分析.核心助力来源}
          </p>
          <p className="text-xs text-muted-foreground tracking-wider">增運建議</p>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
            {(助力分析.增运建议 || []).map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
        </section>

        <Separator className="bg-border" />

        {/* 7. 事业年度总结 */}
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            事 業 年 度 總 結
          </h2>
          <p className="text-sm text-foreground/80 leading-[1.8] pl-3 border-l-2 border-primary">
            {事业年度总结.正文}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xs text-muted-foreground">評分</p>
            <p className="text-lg font-medium text-primary">{事业年度总结.评分} / 100</p>
          </div>
        </section>
      </div>
    </main>
  )
}

function CareerPathPageLoading() {
  const { t } = useLanguage()
  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <h1 className="text-lg font-medium tracking-wide">{t('仕途探索 · 深度報告')}</h1>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-6">
        <p className="text-sm text-muted-foreground">{t('載入中…')}</p>
      </div>
    </main>
  )
}

export default function CareerPathPage() {
  return (
    <Suspense fallback={<CareerPathPageLoading />}>
      <CareerPathContentInner />
    </Suspense>
  )
}
