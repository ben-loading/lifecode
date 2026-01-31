/**
 * 已废弃：请使用 Supabase Auth (signInWithOtp + verifyOtp)
 * 保留此路由仅用于兼容，实际登录由前端直接调用 Supabase
 */
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: '请使用 Supabase Auth 登录，已切换至邮箱验证码方式' },
    { status: 410 }
  )
}
