'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error.message, error.digest, error.stack)
  }, [error])

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col items-center justify-center px-6">
      <h1 className="text-xl font-medium text-destructive mb-2">页面加载出错</h1>
      <p className="text-sm text-muted-foreground mb-4 text-center break-all">
        {error.message}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground mb-4">ID: {error.digest}</p>
      )}
      <Button onClick={reset} variant="outline" className="rounded-lg">
        重试
      </Button>
    </main>
  )
}
