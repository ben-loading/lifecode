import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe, verifyWebhookSignature } from '@/lib/stripe'
import { updateUserBalance, createTransaction } from '@/lib/db'

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
    return NextResponse.json({ error: '缺少签名' }, { status: 400 })
  }

  try {
    // 验证 webhook 签名
    const event = await verifyWebhookSignature(body, signature)

    // 处理支付成功事件
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // 从 metadata 中获取用户信息和能量数量
      const userId = session.metadata?.userId
      const energy = session.metadata?.energy ? parseInt(session.metadata.energy, 10) : null
      const amount = session.metadata?.amount ? parseFloat(session.metadata.amount) : null

      if (!userId || !energy || energy <= 0) {
        console.error('[payment/webhook] 缺少必要的 metadata:', { userId, energy })
        return NextResponse.json({ error: '缺少必要的支付信息' }, { status: 400 })
      }

      // 更新用户余额
      await updateUserBalance(userId, energy)

      // 创建交易记录
      await createTransaction(userId, {
        type: 'topup',
        amount: energy,
        description: `Stripe 充值：${energy} 能量（HK$${amount?.toFixed(2) || 'N/A'}）`,
      })

      console.log(`[payment/webhook] 支付成功: userId=${userId}, energy=${energy}`)
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[payment/webhook]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Webhook 处理失败' },
      { status: 400 }
    )
  }
}
