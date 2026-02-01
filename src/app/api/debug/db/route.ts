import { NextResponse } from 'next/server'
import { getUserById, createUser } from '@/lib/db'

/**
 * 诊断端点：测试数据库连接和用户查询
 * 访问：/api/debug/db?userId=xxx
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
    },
  }

  if (!userId) {
    result.error = 'Missing userId parameter'
    return NextResponse.json(result)
  }

  try {
    // 测试查询用户
    const user = await getUserById(userId)
    result.userFound = !!user
    if (user) {
      result.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        inviteRef: user.inviteRef,
      }
    } else {
      result.user = null
      
      // 尝试创建用户（测试写入权限）
      try {
        const testUser = await createUser({
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          balance: 20,
          inviteRef: 'testref123',
        })
        result.userCreated = true
        result.createdUser = testUser
      } catch (createError) {
        result.createError = createError instanceof Error ? createError.message : String(createError)
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error)
    result.errorStack = error instanceof Error ? error.stack : undefined
  }

  return NextResponse.json(result, { status: result.error ? 500 : 200 })
}
