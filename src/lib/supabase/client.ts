/**
 * Supabase 浏览器端客户端
 * 用于客户端组件中的数据访问
 */

import { createBrowserClient } from '@supabase/ssr'

function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // 构建或运行时未配置时使用占位值，避免客户端抛错导致白屏
    // 配置好 Vercel 环境变量并重新部署后，登录等功能会正常
    return {
      url: url || 'https://placeholder.supabase.co',
      anonKey: anonKey || 'placeholder-key',
    }
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
