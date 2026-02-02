'use client'

import { useState, useEffect } from 'react'
import { DeepReadingPage } from '@/components/deep-reading-page'
import { useAppContext } from '@/lib/context'
import { getArchive } from '@/lib/api-client'

export default function DeepReadingRoute() {
  const { user } = useAppContext()
  const currentArchiveId = user.currentArchiveId
  const [archiveDisplayName, setArchiveDisplayName] = useState<string | null>(null)
  const [archiveLoading, setArchiveLoading] = useState(true)

  useEffect(() => {
    if (!currentArchiveId) {
      setArchiveDisplayName(null)
      setArchiveLoading(false)
      return
    }
    setArchiveLoading(true)
    let cancelled = false
    getArchive(currentArchiveId)
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
  }, [currentArchiveId])

  return (
    <DeepReadingPage
      archiveName={archiveDisplayName ?? undefined}
      archiveLoading={archiveLoading}
    />
  )
}

