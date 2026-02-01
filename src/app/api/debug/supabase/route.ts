/**
 * Supabase 连接检查（服务端环境变量 + 实际请求）
 * GET /api/debug/supabase
 *
 * 返回：环境变量是否设置、能否连上 Supabase。
 * 若此处 ok 但登录仍 Failed to fetch，说明前端 bundle 里 NEXT_PUBLIC_* 未打进构建，需在 Vercel 配好变量后重新部署。
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const details = {
    urlSet: !!url,
    anonKeySet: !!anonKey,
    urlPreview: url ? `${url.slice(0, 30)}...` : '(未设置)',
  }

  if (!url || !anonKey) {
    return NextResponse.json({
      ok: false,
      message: '服务端未配置 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY',
      details,
      hint: '在 Vercel 项目 Settings → Environment Variables 中添加后，请重新部署（Redeploy）',
    })
  }

  try {
    const supabase = createClient(url, anonKey)
    const { error } = await supabase.auth.getSession()
    if (error) {
      return NextResponse.json({
        ok: false,
        message: 'Supabase 请求失败',
        error: error.message,
        details,
      })
    }
    return NextResponse.json({
      ok: true,
      message: 'Supabase 连接正常',
      details,
      hint: '若登录仍报 Failed to fetch，请确认 Vercel 环境变量已配置并在配置后执行过重新部署',
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : '未知错误'
    return NextResponse.json({
      ok: false,
      message: '连接 Supabase 时出错',
      error: message,
      details,
    })
  }
}
