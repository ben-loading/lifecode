'use client'

import { DeepReadingPage } from '@/components/deep-reading-page'
import { useAppContext } from '@/lib/context'

export default function DeepReadingRoute() {
  const { user } = useAppContext()

  return <DeepReadingPage archiveName={user.archiveName} />
}

