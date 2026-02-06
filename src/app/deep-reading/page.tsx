'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DeepReadingPage } from '@/components/deep-reading-page'
import { useAppContext } from '@/lib/context'
import { getArchiveCached, listArchivesCached } from '@/lib/api-cache'

function DeepReadingRouteContent() {
  const router = useRouter()
  const { user, setUser } = useAppContext()
  const searchParams = useSearchParams()
  const archiveIdFromUrl = searchParams.get('archiveId')
  // URL 参数优先，避免刷新时丢失档案状态；无 URL 参数时用 context 的 currentArchiveId
  const effectiveArchiveId = archiveIdFromUrl ?? user.currentArchiveId
  const [archiveDisplayName, setArchiveDisplayName] = useState<string | null>(null)
  const [archiveLoading, setArchiveLoading] = useState(true)

  useEffect(() => {
    // 有 archiveId 时直接拉取档案名
    if (effectiveArchiveId) {
      setArchiveLoading(true)
      let cancelled = false
      getArchiveCached(effectiveArchiveId)
        .then((archive) => {
          if (!cancelled) setArchiveDisplayName(archive.name ?? null)
        })
        .catch(() => {
          if (!cancelled) setArchiveDisplayName(null)
        })
        .finally(() => {
          if (!cancelled) setArchiveLoading(false)
        })
      return () => { cancelled = true }
    }
    // 无 archiveId 时：拉取用户最新档案作为默认档案
    setArchiveLoading(true)
    let cancelled = false
    listArchivesCached()
      .then((archives) => {
        if (cancelled) return
        const latestArchive = archives?.[0] // 列表按创建时间倒序，第一个为最新
        if (latestArchive) {
          setArchiveDisplayName(latestArchive.name ?? null)
          setUser((prev) => ({ ...prev, currentArchiveId: latestArchive.id }))
          // 更新 URL 以保持刷新后能恢复
          router.replace(`/deep-reading?archiveId=${latestArchive.id}`, { scroll: false })
        } else {
          setArchiveDisplayName(null)
        }
      })
      .catch(() => {
        if (!cancelled) setArchiveDisplayName(null)
      })
      .finally(() => {
        if (!cancelled) setArchiveLoading(false)
      })
    return () => { cancelled = true }
  }, [effectiveArchiveId, router, setUser])

  return (
    <DeepReadingPage
      archiveName={archiveDisplayName ?? undefined}
      archiveLoading={archiveLoading}
      archiveId={effectiveArchiveId ?? undefined}
    />
  )
}

export default function DeepReadingRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <DeepReadingRouteContent />
    </Suspense>
  )
}

