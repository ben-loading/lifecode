/**
 * 服务端环境变量检查（不暴露具体值）
 * GET /api/debug/env
 *
 * 用于确认 Vercel 部署后，服务端是否能看到配置的环境变量。
 * 若某项为 false，说明该变量未生效，需在 Vercel 中配置并重新部署。
 */

import { NextResponse } from 'next/server'
import { ensureLLMConfigured } from '@/lib/services/llm-service'

export async function GET() {
  const env = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    // LLM（主报告生成依赖）
    LLM_PROVIDER: process.env.LLM_PROVIDER || '(未设置)',
    DEEPSEEK_API_KEY: !!process.env.DEEPSEEK_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  }

  const allSupabase =
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY

  let llmOk = false
  let llmError: string | null = null
  try {
    ensureLLMConfigured()
    llmOk = true
  } catch (e) {
    llmError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    message: '服务端环境变量检查（仅显示是否设置，不暴露值）',
    env,
    summary: {
      supabase: allSupabase ? '已配置' : '缺少 Supabase 变量',
      llm: llmOk ? '已配置，主报告可生成' : llmError ?? 'LLM 未配置',
    },
    hint: '若某项为 false 或 LLM 未配置，请在 Vercel → Settings → Environment Variables 中配置对应变量，保存后必须重新部署（Redeploy）才会生效。',
  })
}
