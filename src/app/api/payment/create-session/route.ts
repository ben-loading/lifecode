import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth-server'
import { unauthorized, badRequest, serverError } from '@/lib/api-utils'
import { parseJsonBody } from '@/lib/api-utils'
import { stripe, getPriceForEnergy } from '@/lib/stripe'

/**
 * POST /api/payment/create-session
 * 创建 Stripe Checkout Session
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return unauthorized()

    const body = await parseJsonBody<{ energy: number }>(request)
    if (body == null) return badRequest('請求體無效')

    const { energy } = body
    if (!energy || typeof energy !== 'number' || energy <= 0) {
      return badRequest('能量數量無效')
    }

    // 获取价格
    const amount = getPriceForEnergy(energy)
    const amountInCents = Math.round(amount * 100) // Stripe 使用分为单位

    // 获取当前域名（用于返回 URL）
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'
    const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/payment/cancel`

    // 创建 Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'hkd', // 使用港币
            product_data: {
              name: `${energy} 能量`,
              description: '人生解碼 - 能量充值',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, // 用于在 webhook 中识别用户
      metadata: {
        userId,
        energy: energy.toString(),
        amount: amount.toString(),
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (e) {
    console.error('[payment/create-session]', e)
    return serverError()
  }
}
