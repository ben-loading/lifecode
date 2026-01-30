'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { REGION_GROUPS, getRegionLabelByValue, type RegionGroup } from '@/lib/region-options'
import { cn } from '@/lib/utils'

const inputBaseClass =
  'w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors'

interface RegionSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/** 按关键词过滤分组：只保留 label 或 groupLabel 包含关键词的选项 */
function filterGroups(groups: RegionGroup[], keyword: string): RegionGroup[] {
  const k = keyword.trim().toLowerCase()
  if (!k)
    return groups
  return groups
    .map((g) => ({
      groupLabel: g.groupLabel,
      options: g.options.filter(
        (o) => o.label.toLowerCase().includes(k) || o.value.toLowerCase().includes(k)
      ),
    }))
    .filter((g) => g.options.length > 0)
}

export function RegionSelect({
  value,
  onChange,
  placeholder = '请选择省/市或地区',
  disabled = false,
  className,
}: RegionSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const displayLabel = value ? getRegionLabelByValue(value) : ''
  const filteredGroups = useMemo(() => filterGroups(REGION_GROUPS, search), [search])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (v: string) => {
    onChange(v)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          inputBaseClass,
          'flex items-center justify-between gap-2 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          open && 'ring-2 ring-primary border-primary'
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="选择出生地区"
      >
        <span className={cn(displayLabel ? 'text-foreground' : 'text-muted-foreground')}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
          role="listbox"
        >
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索省/市或地区..."
                className={cn(
                  inputBaseClass,
                  'pl-9 py-2.5 text-sm focus:ring-primary'
                )}
                autoFocus
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div
            ref={listRef}
            className="max-h-[min(280px,60vh)] overflow-y-auto overscroll-contain"
          >
            {filteredGroups.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                未找到匹配地区
              </div>
            ) : (
              filteredGroups.map(({ groupLabel, options }) => (
                <div key={groupLabel} className="py-1">
                  <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider sticky top-0 bg-popover/95 backdrop-blur-sm">
                    {groupLabel}
                  </div>
                  {options.map(({ value: optValue, label }) => (
                    <button
                      key={optValue}
                      type="button"
                      role="option"
                      aria-selected={value === optValue}
                      onClick={() => handleSelect(optValue)}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-sm rounded-md transition-colors',
                        value === optValue
                          ? 'bg-primary/15 text-primary font-medium'
                          : 'text-foreground hover:bg-muted/80'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
