'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/lib/context'
import { useState } from 'react'
import { DateTimePicker } from '@/components/date-time-picker'
import { RegionSelect } from '@/components/region-select'
import { SHICHEN_OPTIONS } from '@/lib/birth-constants'

type CalendarType = 'solar' | 'lunar'
type TimeMode = 'datetime' | 'shichen'

export function InputPage() {
  const router = useRouter()
  const { user, setUser } = useAppContext()
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [birthCalendar, setBirthCalendar] = useState<CalendarType>('solar')
  const [birthTimeMode, setBirthTimeMode] = useState<TimeMode>('shichen')
  const [birthDate, setBirthDate] = useState('')
  const [birthLocation, setBirthLocation] = useState('')
  const [birthTimeBranch, setBirthTimeBranch] = useState<number>(6) // 午时
  const [lunarYear, setLunarYear] = useState(new Date().getFullYear())
  const [lunarMonth, setLunarMonth] = useState(1)
  const [lunarDay, setLunarDay] = useState(1)
  const [isLeapMonth, setIsLeapMonth] = useState(false)

  const useShichen = birthTimeMode === 'shichen'
  const useLunar = birthCalendar === 'lunar'
  const showRegion = !useShichen

  const solarDateFilled = Boolean(birthDate && (birthDate.includes('T') || birthDate.length >= 10))
  const solarDateOnlyFilled = Boolean(birthDate && birthDate.length >= 10)
  const lunarDateFilled = lunarYear > 0 && lunarMonth >= 1 && lunarMonth <= 12 && lunarDay >= 1 && lunarDay <= 30
  const dateFilled =
    useLunar
      ? useShichen
        ? lunarDateFilled
        : lunarDateFilled && solarDateFilled
      : useShichen
        ? solarDateOnlyFilled
        : solarDateFilled
  const locationFilled = !showRegion || Boolean(birthLocation?.trim())
  const isComplete = Boolean(gender && dateFilled && locationFilled)

  const handleNext = () => {
    if (!gender || !dateFilled) return
    if (showRegion && !birthLocation?.trim()) return

    const birthDateToStore =
      useLunar && useShichen
        ? `${lunarYear}-${lunarMonth}-${lunarDay}`
        : useLunar && !useShichen
          ? birthDate || `${lunarYear}-${lunarMonth}-${lunarDay}`
          : useShichen
            ? birthDate.includes('T') ? birthDate.slice(0, 10) : birthDate
            : birthDate

    setUser({
      ...user,
      gender: gender as 'male' | 'female',
      birthDate: birthDateToStore,
      birthLocation: showRegion ? (birthLocation || '') : '',
      birthCalendar,
      birthTimeMode,
      ...(useShichen && { birthTimeBranch }),
      ...(useLunar && { lunarDate: `${lunarYear}-${lunarMonth}-${lunarDay}`, isLeapMonth }),
    })
    router.push('/archive')
  }

  const lunarYears = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
  const lunarMonths = Array.from({ length: 12 }, (_, i) => i + 1)
  const lunarDays = Array.from({ length: 30 }, (_, i) => i + 1)

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <button 
            onClick={() => router.back()} 
            className="p-1.5 -ml-1.5 rounded-md hover:bg-muted/50 transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((step) => (
              <div 
                key={step} 
                className={`h-1 rounded-full transition-all duration-300 ${
                  step === 1 ? 'w-6 bg-primary' : 'w-1 bg-border'
                }`} 
              />
            ))}
          </div>
        </div>
      </header>

      <div className="px-5 py-8 space-y-8">
        {/* 標題區 */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-medium tracking-wide">填寫出生信息</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            準確的時間與地點將提升命理解讀的精度
          </p>
        </div>

        {/* 表單區 */}
        <div className="space-y-6">
          {/* 性別 */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-muted-foreground">性別</span>
              <span className="text-xs text-muted-foreground ml-1.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGender('male')}
                className={`h-11 rounded-lg font-medium transition-all ${
                  gender === 'male' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background border border-border text-foreground hover:border-primary'
                }`}
              >
                男
              </button>
              <button
                onClick={() => setGender('female')}
                className={`h-11 rounded-lg font-medium transition-all ${
                  gender === 'female' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background border border-border text-foreground hover:border-primary'
                }`}
              >
                女
              </button>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* 日期时间配置 */}
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-muted-foreground">曆制</span>
                <span className="text-xs text-muted-foreground ml-1.5">*</span>
              </label>
              <div className="inline-flex p-1 bg-muted/30 rounded-lg">
                <button
                  onClick={() => setBirthCalendar('solar')}
                  className={`px-4 h-9 rounded-md text-sm font-medium transition-all ${
                    birthCalendar === 'solar' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  公曆
                </button>
                <button
                  onClick={() => setBirthCalendar('lunar')}
                  className={`px-4 h-9 rounded-md text-sm font-medium transition-all ${
                    birthCalendar === 'lunar' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  農曆
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-muted-foreground">時間方式</span>
                <span className="text-xs text-muted-foreground ml-1.5">*</span>
              </label>
              <div className="inline-flex p-1 bg-muted/30 rounded-lg">
                <button
                  onClick={() => setBirthTimeMode('shichen')}
                  className={`px-4 h-9 rounded-md text-sm font-medium transition-all ${
                    birthTimeMode === 'shichen' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  時辰選擇
                </button>
                <button
                  onClick={() => setBirthTimeMode('datetime')}
                  className={`px-4 h-9 rounded-md text-sm font-medium transition-all ${
                    birthTimeMode === 'datetime' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  具體時間
                </button>
              </div>
              {useShichen && (
                <p className="text-xs text-muted-foreground pl-0.5">
                  時辰模式下無需填寫地區，默認以時辰中點為準
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* 出生日期時間 */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-muted-foreground">
                出生{useLunar ? '農曆' : '公曆'}日期{useShichen ? '與時辰' : '時間'}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">*</span>
            </label>

            {useLunar ? (
              /* 農曆：年/月/日 + 閏月 + 時辰或具體時間 */
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">年</label>
                    <select
                      value={lunarYear}
                      onChange={(e) => setLunarYear(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                    >
                      {lunarYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">月</label>
                    <select
                      value={lunarMonth}
                      onChange={(e) => setLunarMonth(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                    >
                      {lunarMonths.map((m) => (
                        <option key={m} value={m}>{m}月</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">日</label>
                    <select
                      value={lunarDay}
                      onChange={(e) => setLunarDay(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                    >
                      {lunarDays.map((d) => (
                        <option key={d} value={d}>{d}日</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isLeapMonth}
                    onChange={(e) => setIsLeapMonth(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-1 focus:ring-primary/20 transition-shadow"
                  />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">閏月</span>
                </label>
                {useShichen && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">時辰</label>
                    <select
                      value={birthTimeBranch}
                      onChange={(e) => setBirthTimeBranch(Number(e.target.value))}
                      className="w-full h-11 px-4 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                    >
                      {SHICHEN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}（{opt.range}）
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!useShichen && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">具體時刻</label>
                    <DateTimePicker value={birthDate} onChange={setBirthDate} />
                    <p className="text-xs text-muted-foreground mt-2">
                      用於時辰換算與地區校準
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* 公曆 */
              <>
                {useShichen ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">年</label>
                        <select
                          value={birthDate ? new Date(birthDate).getFullYear() : new Date().getFullYear()}
                          onChange={(e) => {
                            const y = Number(e.target.value)
                            const prev = birthDate ? new Date(birthDate) : new Date()
                            setBirthDate(`${y}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`)
                          }}
                          className="w-full h-10 px-3 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                        >
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">月</label>
                        <select
                          value={birthDate ? new Date(birthDate).getMonth() + 1 : new Date().getMonth() + 1}
                          onChange={(e) => {
                            const m = Number(e.target.value)
                            const prev = birthDate ? new Date(birthDate) : new Date()
                            setBirthDate(`${prev.getFullYear()}-${String(m).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`)
                          }}
                          className="w-full h-10 px-3 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                        >
                          {lunarMonths.map((mo) => (
                            <option key={mo} value={mo}>{mo}月</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">日</label>
                        <select
                          value={birthDate ? new Date(birthDate).getDate() : new Date().getDate()}
                          onChange={(e) => {
                            const d = Number(e.target.value)
                            const prev = birthDate ? new Date(birthDate) : new Date()
                            setBirthDate(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
                          }}
                          className="w-full h-10 px-3 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                        >
                          {lunarDays.map((da) => (
                            <option key={da} value={da}>{da}日</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">時辰</label>
                      <select
                        value={birthTimeBranch}
                        onChange={(e) => setBirthTimeBranch(Number(e.target.value))}
                        className="w-full h-11 px-4 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                      >
                        {SHICHEN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}（{opt.range}）
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <DateTimePicker value={birthDate} onChange={setBirthDate} />
                    <p className="text-xs text-muted-foreground">
                      需配合出生地區，用於真太陽時校準
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 出生地區：僅「具體時間」時顯示 */}
          {showRegion && (
            <>
              <div className="h-px bg-border" />
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm text-muted-foreground">出生地區</span>
                  <span className="text-xs text-muted-foreground ml-1.5">*</span>
                </label>
                <RegionSelect
                  value={birthLocation}
                  onChange={setBirthLocation}
                  placeholder="選擇省/市或地區"
                />
                <p className="text-xs text-muted-foreground">
                  用於真太陽時校準，提高排盤精度
                </p>
              </div>
            </>
          )}
        </div>

        {/* 底部操作區 */}
        <div className="pt-2 space-y-4">
          <Button 
            onClick={handleNext} 
            disabled={!isComplete} 
            className="w-full h-12 rounded-lg text-base font-medium transition-all"
          >
            下一步
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            你的信息將被安全加密存儲
          </p>
        </div>
      </div>
    </main>
  )
}
