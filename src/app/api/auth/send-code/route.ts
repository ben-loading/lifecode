/**
 * 已废弃：请使用 Supabase Auth (signInWithOtp)
 * 验证码由 Supabase 自动发送至用户邮箱
 */
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: '已切换至 Supabase Auth，请使用前端发送验证码' },
    { status: 410 }
  )
}
