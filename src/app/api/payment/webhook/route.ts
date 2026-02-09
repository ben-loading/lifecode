import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe, verifyWebhookSignature } from '@/lib/stripe'
import { updateUserBalance, createTransaction, getTransactionsByUserId } from '@/lib/db'

/**
 * POST /api/payment/webhook
 * Stripe Webhook 处理
 * 处理支付成功事件，更新用户余额
 */
export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('[payment/webhook] 缺少签名')
    return NextResponse.json({ error: '缺少签名' }, { status: 400 })
  }

  try {
    // 验证 webhook 签名
    const event = await verifyWebhookSignature(body, signature)
    console.log(`[payment/webhook] 收到事件: ${event.type}, id: ${event.id}`)

    // 处理支付成功事件
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const sessionId = session.id

      console.log(`[payment/webhook] 支付会话完成: sessionId=${sessionId}, payment_status=${session.payment_status}`)

      // 检查支付状态
      if (session.payment_status !== 'paid') {
        console.warn(`[payment/webhook] 支付状态不是 paid: ${session.payment_status}`)
        return NextResponse.json({ received: true, message: '支付状态不是 paid，跳过处理' })
      }

      // 从 metadata 中获取用户信息和能量数量
      const userId = session.metadata?.userId
      const energy = session.metadata?.energy ? parseInt(session.metadata.energy, 10) : null
      const amount = session.metadata?.amount ? parseFloat(session.metadata.amount) : null

      console.log(`[payment/webhook] Metadata: userId=${userId}, energy=${energy}, amount=${amount}`)

      if (!userId || !energy || energy <= 0) {
        console.error('[payment/webhook] 缺少必要的 metadata:', { userId, energy, sessionId })
        return NextResponse.json({ error: '缺少必要的支付信息' }, { status: 400 })
      }

      // 幂等性检查：检查是否已经处理过这个支付会话
      // 通过检查交易记录中是否已有相同 sessionId 的交易
      const recentTransactions = await getTransactionsByUserId(userId)
      const existingTransaction = recentTransactions.find(
        (tx) => tx.description.includes(sessionId) || tx.description.includes(`Stripe 充值：${energy} 能量`)
      )

      if (existingTransaction) {
        console.log(`[payment/webhook] 支付会话已处理过，跳过: sessionId=${sessionId}, transactionId=${existingTransaction.id}`)
        return NextResponse.json({ received: true, message: '支付会话已处理过' })
      }

      // 更新用户余额
      console.log(`[payment/webhook] 开始更新余额: userId=${userId}, energy=${energy}`)
      await updateUserBalance(userId, energy)
      console.log(`[payment/webhook] 余额更新成功: userId=${userId}, energy=${energy}`)

      // 创建交易记录（包含 sessionId 用于幂等性检查）
      await createTransaction(userId, {
        type: 'topup',
        amount: energy,
        description: `Stripe 充值：${energy} 能量（HK$${amount?.toFixed(2) || 'N/A'}）[${sessionId}]`,
      })

      console.log(`[payment/webhook] 支付成功处理完成: userId=${userId}, energy=${energy}, sessionId=${sessionId}`)
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[payment/webhook] 处理失败:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    const errorStack = e instanceof Error ? e.stack : undefined
    console.error('[payment/webhook] 错误详情:', { errorMessage, errorStack })
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
