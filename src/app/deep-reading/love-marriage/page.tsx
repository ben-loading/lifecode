'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { getDeepReportCached } from '@/lib/api-cache'
import { useLanguage } from '@/lib/context-language'
import type { LoveMarriageContent } from '@/lib/types/love-marriage-report'

function Stars({ n }: { n: number }) {
  return (
    <span className="text-primary tracking-wide" aria-label={`${n} 星`}>
      {Array.from({ length: 5 }, (_, i) => (i < n ? '★' : '☆')).join('')}
    </span>
  )
}

const CHART_FILL = '#A0826D'

function LoveMarriageContentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const archiveId = searchParams.get('archiveId')
  const [content, setContent] = useState<LoveMarriageContent | null>(null)
  const [loading, setLoading] = useState(!!archiveId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!archiveId) {
      setLoading(false)
      return
    }
    let cancelled = false
    getDeepReportCached(archiveId, 'love-marriage')
      .then((report) => {
        if (cancelled) return
        if (report?.content) setContent(report.content as unknown as LoveMarriageContent)
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
            <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide">{t('愛情姻緣 · 深度報告')}</h1>
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
            <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide">{t('愛情姻緣 · 深度報告')}</h1>
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
            <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide">{t('愛情姻緣 · 深度報告')}</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-4">
          <p className="text-sm text-muted-foreground text-center">{error ?? t('報告不存在或生成失敗')}</p>
          <p className="text-xs text-muted-foreground text-center">{t('請返回深度解讀頁，點擊「重新生成」免費重試')}</p>
        </div>
      </main>
    )
  }

  const 核心情感模式 = content.核心情感模式
  const 正缘画像 = content.正缘画像
  const 大运情感列表 = content.大运情感列表
  const 年度情感推演 = content.年度情感推演
  const 流月情感 = content.流月情感
  const 关键时间点 = content.关键时间点
  const 情感年度总结 = content.情感年度总结

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button onClick={() => router.back()} className="text-foreground hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium tracking-wide">愛情姻緣 · 深度報告</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            核 心 情 感 模 式 與 死 穴
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">命理解析</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {核心情感模式.命理解析}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">你的博弈地位</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {核心情感模式.博弈地位}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {核心情感模式.博弈地位简评}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">情感死穴/痛點</p>
            <ul className="space-y-3 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
              {(核心情感模式.情感死穴 || []).map((item, i) => (
                <li key={i}>· {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">終 身 正 緣 畫 像</h2>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">外貌/氣質特徵</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {正缘画像.外貌气质}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">職業/圈層</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {正缘画像.职业圈层}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">相遇高頻地標</p>
            {正缘画像.地标前言 && (
              <p className="text-xs text-muted-foreground/90 pl-3 border-l border-border mb-3">
                {正缘画像.地标前言}
              </p>
            )}
            <div className="relative space-y-0 pl-1">
              {(正缘画像.相遇高频地标 || []).map((地标, i) => (
                <div key={i} className="relative flex gap-3 py-4 first:pt-1 last:pb-0">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="rounded-full bg-primary/12 text-primary p-2.5 border-2 border-primary/25 shadow-sm" aria-hidden>
                      <MapPin className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    {i < (正缘画像.相遇高频地标?.length ?? 0) - 1 && (
                      <div className="w-px min-h-[16px] mt-1 border-l border-dashed border-primary/25" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 rounded-lg border border-border/80 bg-card/50 px-3 py-2.5 shadow-sm">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">地標 {i + 1}</p>
                    <p className="text-sm font-medium text-foreground flex flex-wrap items-center gap-2">
                      {地标.名称}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-normal">
                        {地标.五行标签}
                      </span>
                    </p>
                    <p className="text-xs text-foreground/75 leading-[1.6] mt-1.5">{地标.简注}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">互動劇本</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {正缘画像.互动剧本}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {正缘画像.互动剧本说明}
            </p>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            人 生 大 運 情 感 質 量 曲 線
          </h2>
          <div className="space-y-6">
            {大运情感列表.map((运, index) => (
              <div key={`${运.区间}-${运.岁数}-${index}`} className="space-y-3">
                <p className="text-sm font-medium text-foreground tracking-wide">
                  {运.区间}（{运.岁数}）：{运.干支} 运
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">幸福指數</p>
                  <p className="text-base font-medium text-primary">{运.幸福指数} / 100</p>
                </div>
                <Card className="border-border bg-white/60 shadow-none overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-muted-foreground">幸福指數</span>
                      <span className="text-[10px] text-muted-foreground">0 — 100</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{ width: `${运.幸福指数}%`, backgroundColor: CHART_FILL }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground">情感狀態關鍵詞</p>
                <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary font-medium">
                  {运.情感状态关键词}
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

        <section className="space-y-6">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 年 度 情 感 深 度 推 演
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p className="text-xs text-muted-foreground">流年天干</p>
            <p className="text-foreground/90">{年度情感推演.流年天干}</p>
            <p className="text-xs text-muted-foreground">流年地支</p>
            <p className="text-foreground/90">{年度情感推演.流年地支}</p>
          </div>
          <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
            {年度情感推演.核心象义}
          </p>
          <Card className="border-border bg-muted/10 shadow-none">
            <CardContent className="p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">如果你目前單身（獵愛指南）</p>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">脫單概率</p>
                <p className="text-sm font-medium text-foreground">{年度情感推演.单身.脱单概率}</p>
              </div>
              <p className="text-xs text-muted-foreground">命理依據</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {年度情感推演.单身.命理依据}
              </p>
              <p className="text-xs text-muted-foreground">艷遇/邂逅座標</p>
              <p className="text-sm text-foreground/80 pl-3 border-l border-primary">
                {年度情感推演.单身.艳遇坐标}
              </p>
              <p className="text-xs text-muted-foreground">避坑警示</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
                {年度情感推演.单身.避坑警示}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/10 shadow-none">
            <CardContent className="p-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">如果你已有伴侶（防變指南）</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">第三者入侵指數</p>
                <Stars n={年度情感推演.有伴侣.第三者入侵指数} />
              </div>
              <p className="text-xs text-muted-foreground">命理依據</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {年度情感推演.有伴侣.命理依据}
              </p>
              <p className="text-xs text-muted-foreground">潛在危險來源</p>
              <p className="text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
                {年度情感推演.有伴侣.潜在危险来源}
              </p>
              <p className="text-xs text-muted-foreground">維穩手段</p>
              <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-border">
                {(年度情感推演.有伴侣.维稳手段 || []).map((item, i) => (
                  <li key={i}>· {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            2026 流 月 情 感 風 向 標
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">激情燃燒月（利約會）</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
              {流月情感.激情燃烧月.月份}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {流月情感.激情燃烧月.说明}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">信任危機月（防爭吵/防抓包）</p>
            <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-destructive/50">
              {流月情感.信任危机月.月份}
            </p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
              {流月情感.信任危机月.说明}
            </p>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            關 鍵 時 間 點 預 測
          </h2>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">容易結婚/定終身的年份</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-primary">
              {(关键时间点.容易结婚年份 || []).map((item, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{item.年份}</span>：{item.说明}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">容易分手/婚變的年份</p>
            <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7] pl-3 border-l border-destructive/50">
              {(关键时间点.容易分手年份 || []).map((item, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{item.年份}</span>：{item.说明}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-4">
          <h2 className="text-center text-xs tracking-widest text-muted-foreground uppercase">
            情 感 年 度 總 結
          </h2>
          <p className="text-sm font-medium text-foreground pl-3 border-l-2 border-primary">
            {情感年度总结.正文}
          </p>
          <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-border">
            {情感年度总结.说明}
          </p>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground tracking-wider">軍師建議</p>
            <p className="text-sm text-foreground/80 leading-[1.75] pl-3 border-l border-primary font-medium">
              {情感年度总结.军师建议}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function LoveMarriagePageLoading() {
  const { t } = useLanguage()
  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <h1 className="text-lg font-medium tracking-wide">{t('愛情姻緣 · 深度報告')}</h1>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-6">
        <p className="text-sm text-muted-foreground">{t('載入中…')}</p>
      </div>
    </main>
  )
}

export default function LoveMarriagePage() {
  return (
    <Suspense fallback={<LoveMarriagePageLoading />}>
      <LoveMarriageContentInner />
    </Suspense>
  )
}
