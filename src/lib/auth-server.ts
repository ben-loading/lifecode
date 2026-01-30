import { store } from '@/lib/store'

export function getUserIdFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  return store.tokens.get(token) ?? null
}
