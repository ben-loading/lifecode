'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/lib/context'
import { useState } from 'react'
import { DateTimePicker } from '@/components/date-time-picker'
import { RegionSelect } from '@/components/region-select'

export function InputPage() {
  const router = useRouter()
  const { user, setUser } = useAppContext()
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [birthLocation, setBirthLocation] = useState('')

  const handleNext = () => {
    if (gender && birthDate && birthLocation) {
      setUser({
        ...user,
        gender: gender as 'male' | 'female',
        birthDate,
        birthLocation,
      })
      router.push('/archive')
    }
  }

  const isComplete = gender && birthDate && birthLocation

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="text-foreground hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <div className="px-6 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-medium tracking-wider">写下独一无二的"编码"</h1>
          <p className="text-sm text-muted-foreground">开启重生认识自我的蜕程</p>
        </div>

        <div className="space-y-6">
          {/* Gender Selection */}
          <div className="space-y-3">
            <label className="text-xs text-muted-foreground tracking-wider">#性别</label>
            <div className="flex gap-3">
              <button
                onClick={() => setGender('male')}
                className={`flex-1 h-11 rounded-lg font-medium tracking-wider transition-all ${
                  gender === 'male'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border text-foreground hover:border-primary'
                }`}
              >
                男
              </button>
              <button
                onClick={() => setGender('female')}
                className={`flex-1 h-11 rounded-lg font-medium tracking-wider transition-all ${
                  gender === 'female'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border text-foreground hover:border-primary'
                }`}
              >
                女
              </button>
            </div>
          </div>

          {/* Birth Date */}
          <div className="space-y-3">
            <label className="text-xs text-muted-foreground tracking-wider">#出生日期时间</label>
            <DateTimePicker value={birthDate} onChange={setBirthDate} />
          </div>

          {/* Birth Location：带搜索的下拉框，value 用于后端获取经纬度 */}
          <div className="space-y-3">
            <label className="text-xs text-muted-foreground tracking-wider">#出生地区</label>
            <RegionSelect
              value={birthLocation}
              onChange={setBirthLocation}
              placeholder="请选择省/市或地区"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleNext}
            disabled={!isComplete}
            className="w-full h-12 rounded-lg"
          >
            下一步
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            不用担心，这份编码对会得到安全的保护
          </p>
        </div>
      </div>
    </main>
  )
}
