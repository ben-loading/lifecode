'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [year, setYear] = useState(value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [month, setMonth] = useState(value ? new Date(value).getMonth() + 1 : new Date().getMonth() + 1)
  const [day, setDay] = useState(value ? new Date(value).getDate() : new Date().getDate())
  const [hour, setHour] = useState(value ? new Date(value).getHours() : 12)
  const [minute, setMinute] = useState(value ? new Date(value).getMinutes() : 0)

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  const handleConfirm = () => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    onChange(dateStr)
    setIsOpen(false)
  }

  const formatDisplay = () => {
    if (!value) return '选择日期时间'
    const date = new Date(value)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-left text-sm hover:border-primary transition-colors"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {formatDisplay()}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="space-y-4 py-4">
            <h3 className="text-center text-base font-medium">选择日期时间</h3>

            {/* Date Pickers */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-2">年</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-2">月</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-2">日</label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Pickers */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-2">时</label>
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-2">分</label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                确定
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
