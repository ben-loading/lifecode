/**
 * 服务端 API 工具：安全解析 body、统一错误响应，避免 request.json() 抛错导致 500
 */

import { NextResponse } from 'next/server'

export async function parseJsonBody<T = unknown>(request: Request): Promise<T | null> {
  try {
    const text = await request.text()
    if (!text?.trim()) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function unauthorized(message = '未登录') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function serverError(message = '请求异常') {
  return NextResponse.json({ error: message }, { status: 500 })
}
