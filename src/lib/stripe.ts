/**
 * Stripe 支付工具函数
 */

import Stripe from 'stripe'

// 仅在服务端初始化 Stripe（避免在客户端执行）
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (typeof window !== 'undefined') {
    throw new Error('Stripe 只能在服务端使用')
  }
  
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('缺少 STRIPE_SECRET_KEY 环境变量')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  }
  
  return stripeInstance
}

export const stripe = getStripe()

/**
 * 能量到价格的映射（单位：港币 HKD）
 * 可以根据实际需求调整价格策略
 */
export const ENERGY_PRICE_MAP: Record<number, number> = {
  200: 20,   // 200 能量 = HK$20
  500: 38,   // 500 能量 = HK$38
  1000: 68,  // 1000 能量 = HK$68
}

/**
 * 根据能量数量获取价格（港币 HKD）
 */
export function getPriceForEnergy(energy: number): number {
  return ENERGY_PRICE_MAP[energy] || energy * 0.1 // 默认 HK$0.1/能量
}

/**
 * 验证 Stripe Webhook 签名
 */
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('缺少 STRIPE_WEBHOOK_SECRET 环境变量')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
