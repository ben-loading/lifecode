import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { verifyWebhookSignature } from '@/lib/stripe'
import {
  updateUserBalance,
  createTransaction,
  getTransactionsByUserId,
  getUserById,
  createPaymentEventProcessing,
  getPaymentEventBySession,
  retryFailedPaymentEvent,
  completePaymentEvent,
} from '@/lib/db'

// 确保路由配置正确，允许 POST 请求
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// 明确允许所有 HTTP 方法
export const maxDuration = 30

function webhookError(code: string, status = 400) {
  return NextResponse.json(
    {
      error: 'WEBHOOK_ERROR',
      code,
    },
    { status }
  )
}

/**
 * GET /api/payment/webhook
 * 用于 Stripe Webhook 配置验证（可选）
 */
export async function GET() {
  return NextResponse.json({ message: 'Stripe Webhook endpoint is active' })
}

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
    return webhookError('MISSING_SIGNATURE', 400)
  }

  try {
    const event = await verifyWebhookSignature(body, signature)
    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true, processed: false })
    }

    const session = event.data.object as Stripe.Checkout.Session
    const sessionId = session.id
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, message: '支付未完成，跳过处理' })
    }

    let userId = session.metadata?.userId || session.client_reference_id
    const energy = session.metadata?.energy ? parseInt(session.metadata.energy, 10) : null
    const amount = session.metadata?.amount ? parseFloat(session.metadata.amount) : null

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return webhookError('INVALID_USER_ID', 400)
    }
    if (!energy || energy <= 0) {
      return webhookError('INVALID_ENERGY', 400)
    }
    userId = userId.trim()

    // 先占位幂等事件。若已存在则根据状态决定跳过或重试。
    const claimed = await createPaymentEventProcessing({
      provider: 'stripe',
      eventType: event.type,
      eventId: event.id,
      sessionId,
      userId,
      metadata: {
        energy,
        amount: amount ?? null,
        currency: session.currency ?? null,
      },
    })
    if (!claimed) {
      const existing = await getPaymentEventBySession('stripe', sessionId)
      if (existing?.status === 'processed') {
        return NextResponse.json({ received: true, message: '支付会话已处理' })
      }
      if (existing?.status === 'processing') {
        return NextResponse.json({ received: true, message: '支付会话处理中' })
      }
      const resumed = await retryFailedPaymentEvent('stripe', sessionId)
      if (!resumed) {
        return NextResponse.json({ received: true, message: '支付会话已处理' })
      }
    }

    try {
      const user = await getUserById(userId)
      if (!user) {
        console.error('[payment/webhook] user not found for session:', sessionId)
        await completePaymentEvent({
          provider: 'stripe',
          sessionId,
          status: 'failed',
          error: '用户不存在',
        })
        return webhookError('USER_NOT_FOUND', 404)
      }

      // 兜底幂等：若历史已有该 sessionId 交易，直接标记 processed 并返回成功
      const recentTransactions = await getTransactionsByUserId(userId)
      const existingTransaction = recentTransactions.find((tx) => tx.description.includes(`[${sessionId}]`))
      if (existingTransaction) {
        await completePaymentEvent({
          provider: 'stripe',
          sessionId,
          status: 'processed',
        })
        return NextResponse.json({ received: true, message: '支付会话已处理' })
      }

      await updateUserBalance(userId, energy)
      await createTransaction(userId, {
        type: 'topup',
        amount: energy,
        description: `Stripe 充值：${energy} 能量（HK$${amount?.toFixed(2) || 'N/A'}）[${sessionId}]`,
      })
      await completePaymentEvent({
        provider: 'stripe',
        sessionId,
        status: 'processed',
      })
      return NextResponse.json({ received: true, processed: true })
    } catch (processError) {
      const message = processError instanceof Error ? processError.message : String(processError)
      await completePaymentEvent({
        provider: 'stripe',
        sessionId,
        status: 'failed',
        error: message,
      })
      throw processError
    }
  } catch (e) {
    console.error('[payment/webhook] 处理失败:', e)
    return webhookError('PROCESSING_FAILED', 400)
  }
}
