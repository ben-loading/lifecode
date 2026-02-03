'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAppContext } from '@/lib/context'
import { useMemo, useState, useEffect } from 'react'
import { astro } from 'iztro'
import { Card, CardContent } from '@/components/ui/card'
import { getLongitudeByRegion, getSolarTimeOffsetMinutes } from '@/lib/birth-constants'
import { getArchiveCached, listArchivesCached } from '@/lib/api-cache'
import type { ApiArchive } from '@/lib/types/api'

/** 阳历小时(0-23) 转 iztro 时辰序号 0~12（0=早子 00-01, 12=晚子 23-00） */
function hourToTimeIndex(hour: number): number {
  if (hour === 23) return 12
  return Math.floor((hour + 1) / 2) % 12
}

/** iztro 排盘返回的星盘数据（仅用到的字段） */
interface PalaceItem {
  name: string
  heavenlyStem?: string
  earthlyBranch?: string
  majorStars?: { name: string; brightness?: string }[]
  minorStars?: { name: string }[]
  isBodyPalace?: boolean
}
interface AstrolabeData {
  solarDate?: string
  lunarDate?: string
  chineseDate?: string
  time?: string
  timeRange?: string
  earthlyBranchOfSoulPalace?: string
  earthlyBranchOfBodyPalace?: string
  soul?: string
  body?: string
  fiveElementsClass?: string
  zodiac?: string
  sign?: string
  palaces?: PalaceItem[]
}

/** 方格盘（罗盘式）十二宫位置：上 巳午未申，右 酉戌，下 亥子丑寅，左 卯辰，中心 中宫 */
const 方格盘地支顺序 = ['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'] as const
/** (row, col) 对应地支，共 12 个外格 + 中心 */
const 方格盘布局: { branch: typeof 方格盘地支顺序[number] | '中宫'; row: number; col: number }[] = [
  { branch: '巳', row: 0, col: 0 },
  { branch: '午', row: 0, col: 1 },
  { branch: '未', row: 0, col: 2 },
  { branch: '申', row: 0, col: 3 },
  { branch: '辰', row: 1, col: 0 },
  { branch: '中宫', row: 1, col: 1 },
  { branch: '酉', row: 1, col: 3 },
  { branch: '卯', row: 2, col: 0 },
  { branch: '戌', row: 2, col: 3 },
  { branch: '寅', row: 3, col: 0 },
  { branch: '丑', row: 3, col: 1 },
  { branch: '子', row: 3, col: 2 },
  { branch: '亥', row: 3, col: 3 },
]

function getPalaceByBranch(palaces: PalaceItem[], branch: string): PalaceItem | null {
  return palaces.find((p) => p.earthlyBranch === branch) ?? null
}

export default function ZiweiChartPage() {
  const router = useRouter()
  const { user } = useAppContext()
  const [archive, setArchive] = useState<ApiArchive | null>(null)
  const [loading, setLoading] = useState(true)

  // 命盘资料从当前档案（数据库）拉取，刷新/二次登录后仍能正确展示
  // 切换档案或重新加载时先清空 archive，避免未加载前显示上一档案的命盘
  useEffect(() => {
    if (!user.isLoggedIn) {
      setArchive(null)
      setLoading(false)
      return
    }
    setArchive(null)
    setLoading(true)
    const load = async () => {
      try {
        if (user.currentArchiveId) {
          const a = await getArchiveCached(user.currentArchiveId)
          setArchive(a)
          return
        }
        const list = await listArchivesCached()
        if (list?.length) setArchive(list[0])
        else setArchive(null)
      } catch {
        const list = await listArchivesCached().catch(() => [])
        if (list?.length) setArchive(list[0])
        else setArchive(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.isLoggedIn, user.currentArchiveId])

  const astrolabe = useMemo((): AstrolabeData | null => {
    if (!archive?.birthDate || !archive?.gender) return null
    try {
      astro.config({ yearDivide: 'exact', horoscopeDivide: 'exact' })
      const genderStr = archive.gender === 'male' ? '男' : '女'
      const useLunar = archive.birthCalendar === 'lunar'
      const useShichen = archive.birthTimeMode === 'shichen'
      let timeIndex: number
      let solarStr: string

      if (useShichen && archive.birthTimeBranch != null) {
        timeIndex = Math.max(0, Math.min(12, archive.birthTimeBranch))
        const [y, m, d] = archive.birthDate.slice(0, 10).split('-').map(Number)
        solarStr = `${y}-${m}-${d}`
      } else {
        const date = new Date(archive.birthDate)
        let hour = date.getHours()
        const minute = date.getMinutes()
        const y = date.getFullYear()
        const m = date.getMonth() + 1
        const d = date.getDate()
        solarStr = `${y}-${m}-${d}`
        if (archive.birthLocation?.trim()) {
          const longitude = getLongitudeByRegion(archive.birthLocation)
          const offsetMin = getSolarTimeOffsetMinutes(longitude, solarStr)
          const totalMinutes = hour * 60 + minute + offsetMin
          const adjusted = ((totalMinutes % 1440) + 1440) % 1440
          hour = Math.floor(adjusted / 60) % 24
        }
        timeIndex = hourToTimeIndex(hour)
      }

      if (useLunar && archive.lunarDate?.trim()) {
        return astro.byLunar(
          archive.lunarDate.trim(),
          timeIndex,
          genderStr,
          archive.isLeapMonth ?? false,
          true,
          'zh-CN'
        ) as unknown as AstrolabeData
      }
      return astro.bySolar(solarStr, timeIndex, genderStr, true, 'zh-CN') as unknown as AstrolabeData
    } catch {
      return null
    }
  }, [archive?.birthDate, archive?.gender, archive?.birthCalendar, archive?.birthTimeMode, archive?.birthTimeBranch, archive?.lunarDate, archive?.isLeapMonth, archive?.birthLocation])

  const isEmpty = !archive || !archive.birthDate || !archive.gender

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
          <h1 className="text-lg font-medium tracking-wide">紫微斗数命盘</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">加载命盘资料中…</p>
          </div>
        ) : !user.isLoggedIn ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-sm text-muted-foreground">请先登录后再查看命盘。</p>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-primary font-medium underline"
            >
              返回首页
            </button>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-sm text-muted-foreground">
              暂无档案或档案未填写出生信息。请先选择档案或创建档案并填写出生日期、时间与地区。
            </p>
            <button
              onClick={() => router.push('/input')}
              className="text-sm text-primary font-medium underline"
            >
              去填写出生信息
            </button>
            <button
              onClick={() => router.push('/archive')}
              className="block mx-auto mt-2 text-sm text-muted-foreground hover:text-foreground"
            >
              查看档案列表
            </button>
          </div>
        ) : !astrolabe ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">排盘失败，请检查出生日期与时间。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 基础信息：命盘概要，紧凑卡片 */}
            <div className="rounded-lg border border-primary/20 bg-gradient-to-b from-primary/[0.05] to-transparent overflow-hidden">
              <div className="px-3 py-1.5 border-b border-primary/10 bg-primary/5">
                <h2 className="text-[11px] font-semibold tracking-widest text-primary uppercase">
                  命盘概要
                </h2>
              </div>
              <div className="px-3 py-2.5 space-y-2.5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">阳历</span>
                    <span className="font-medium text-foreground truncate">{astrolabe.solarDate ?? '—'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">农历</span>
                    <span className="font-medium text-foreground truncate">{astrolabe.lunarDate ?? '—'}</span>
                  </div>
                  <div className="col-span-2 flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">四柱</span>
                    <span className="font-medium tracking-wide text-foreground">{astrolabe.chineseDate ?? '—'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">时辰</span>
                    <span className="font-medium text-foreground">{astrolabe.time ?? '—'} {astrolabe.timeRange ?? ''}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">五行局</span>
                    <span className="font-medium text-foreground">{astrolabe.fiveElementsClass ?? '—'}</span>
                  </div>
                </div>
                <div className="h-px bg-border/80" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">命宫</span>
                    <span className="font-medium text-primary">{astrolabe.earthlyBranchOfSoulPalace ?? '—'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">身宫</span>
                    <span className="font-medium text-primary">{astrolabe.earthlyBranchOfBodyPalace ?? '—'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">命主</span>
                    <span className="font-medium text-foreground">{astrolabe.soul ?? '—'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">身主</span>
                    <span className="font-medium text-foreground">{astrolabe.body ?? '—'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">生肖</span>
                    <span className="font-medium text-foreground">{astrolabe.zodiac ?? '—'}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">星座</span>
                    <span className="font-medium text-foreground">{astrolabe.sign ?? '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 十二宫：方格盘，占主要视觉 */}
            <div className="space-y-1.5">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                十二宫位 · 方格盘
              </h2>
              <div className="grid grid-cols-4 grid-rows-4 gap-px w-full max-w-[420px] mx-auto aspect-square bg-border rounded-lg overflow-hidden border border-border">
                {方格盘布局.map((item) => {
                  if (item.branch === '中宫') {
                    return (
                      <div
                        key="中宫"
                        className="bg-muted/30 flex items-center justify-center border border-border/60"
                        style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}
                      >
                        <span className="text-sm font-medium text-muted-foreground tracking-wider">中宫</span>
                      </div>
                    )
                  }
                  const palace = getPalaceByBranch(astrolabe.palaces ?? [], item.branch)
                  return (
                    <div
                      key={item.branch}
                      className={`flex flex-col border border-border/80 min-h-0 ${
                        palace?.isBodyPalace ? 'bg-primary/10 border-primary/50' : 'bg-card'
                      }`}
                      style={{
                        gridRow: item.row + 1,
                        gridColumn: item.col + 1,
                      }}
                    >
                      <div className="px-1.5 py-1 border-b border-border/60 flex items-center justify-between gap-0.5 shrink-0">
                        <span className="text-[10px] font-semibold text-foreground truncate">
                          {palace?.name ?? item.branch}
                        </span>
                        <span className="text-[9px] text-muted-foreground shrink-0">
                          {palace ? `${palace.heavenlyStem ?? ''}${palace.earthlyBranch}` : item.branch}
                        </span>
                      </div>
                      <div className="p-1 flex-1 overflow-auto min-h-0">
                        {palace?.majorStars && palace.majorStars.length > 0 && (
                          <div className="flex flex-wrap gap-0.5">
                            {palace.majorStars.map((s) => (
                              <span
                                key={s.name}
                                className="text-[9px] px-1 py-0.5 rounded bg-primary/15 text-primary font-medium"
                              >
                                {s.name}{s.brightness ? `(${s.brightness})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                        {palace?.minorStars && palace.minorStars.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {palace.minorStars.map((s) => (
                              <span
                                key={s.name}
                                className="text-[8px] px-0.5 py-0 rounded bg-muted/80 text-muted-foreground"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                上 巳午未申 · 右 酉戌 · 下 亥子丑寅 · 左 卯辰
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
