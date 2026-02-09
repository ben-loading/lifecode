import { NextResponse } from 'next/server'
import { getTransactionsByUserId, getUserById } from '@/lib/db'

/**
 * GET /api/payment/webhook/debug
 * 调试工具：检查最近的支付交易记录
 * 用于排查 webhook 处理问题
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '缺少 userId 参数' }, { status: 400 })
    }

    // 获取用户信息
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 获取最近的交易记录
    const transactions = await getTransactionsByUserId(userId)
    const stripeTransactions = transactions.filter((tx) => 
      tx.description.includes('Stripe 充值') || tx.description.includes('[cs_')
    )

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance,
      },
      allTransactions: transactions.slice(0, 10), // 最近 10 条
      stripeTransactions: stripeTransactions.slice(0, 10), // 最近 10 条 Stripe 交易
      totalStripeTransactions: stripeTransactions.length,
    })
  } catch (e) {
    console.error('[payment/webhook/debug]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '查询失败' },
      { status: 500 }
    )
  }
}
