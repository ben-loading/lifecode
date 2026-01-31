/**
 * Supabase 浏览器端客户端
 * 用于客户端组件中的数据访问
 */

import { createBrowserClient } from '@supabase/ssr'

function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    // 在构建期间或环境变量未设置时，返回占位值以避免构建失败
    // 实际运行时会使用正确的环境变量
    if (typeof window === 'undefined') {
      return {
        url: 'https://placeholder.supabase.co',
        anonKey: 'placeholder-key'
      }
    }
    throw new Error('Supabase environment variables not set')
  }
  
  return { url, anonKey }
}

export function createClient() {
  const { url, anonKey } = getEnvVars()
  return createBrowserClient(url, anonKey)
}

// 单例模式，避免重复创建
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
