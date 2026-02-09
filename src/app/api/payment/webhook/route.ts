import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe, verifyWebhookSignature } from '@/lib/stripe'
import { updateUserBalance, createTransaction, getTransactionsByUserId, getUserById } from '@/lib/db'

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

      console.log(`[payment/webhook] 支付会话完成: sessionId=${sessionId}`)
      console.log(`[payment/webhook] 支付状态: ${session.payment_status}`)
      console.log(`[payment/webhook] 支付金额: ${session.amount_total ? session.amount_total / 100 : 'N/A'} ${session.currency?.toUpperCase() || ''}`)
      console.log(`[payment/webhook] Metadata:`, JSON.stringify(session.metadata, null, 2))
      console.log(`[payment/webhook] Client reference ID: ${session.client_reference_id}`)

      // 检查支付状态
      if (session.payment_status !== 'paid') {
        console.warn(`[payment/webhook] 支付状态不是 paid: ${session.payment_status}`)
        return NextResponse.json({ received: true, message: '支付状态不是 paid，跳过处理' })
      }

      // 从 metadata 或 client_reference_id 中获取用户信息
      // 优先使用 metadata.userId，如果没有则使用 client_reference_id
      const userId = session.metadata?.userId || session.client_reference_id
      const energy = session.metadata?.energy ? parseInt(session.metadata.energy, 10) : null
      const amount = session.metadata?.amount ? parseFloat(session.metadata.amount) : null

      console.log(`[payment/webhook] 提取的信息: userId=${userId}, energy=${energy}, amount=${amount}`)
      
      // 如果没有 userId，尝试从 client_reference_id 获取
      if (!userId && session.client_reference_id) {
        console.log(`[payment/webhook] 使用 client_reference_id 作为 userId: ${session.client_reference_id}`)
      }

      if (!userId || !energy || energy <= 0) {
        console.error('[payment/webhook] 缺少必要的 metadata:', { userId, energy, sessionId })
        return NextResponse.json({ error: '缺少必要的支付信息' }, { status: 400 })
      }

      // 幂等性检查：检查是否已经处理过这个支付会话
      // 只检查 sessionId，避免误判（用户可能多次充值相同金额）
      const recentTransactions = await getTransactionsByUserId(userId)
      const existingTransaction = recentTransactions.find(
        (tx) => tx.description.includes(`[${sessionId}]`)
      )

      if (existingTransaction) {
        console.log(`[payment/webhook] 支付会话已处理过，跳过: sessionId=${sessionId}, transactionId=${existingTransaction.id}`)
        return NextResponse.json({ received: true, message: '支付会话已处理过' })
      }

      console.log(`[payment/webhook] 幂等性检查通过，准备处理支付: sessionId=${sessionId}`)

      // 验证用户是否存在
      const { getUserById } = await import('@/lib/db')
      const userBefore = await getUserById(userId)
      if (!userBefore) {
        console.error(`[payment/webhook] 用户不存在: userId=${userId}`)
        return NextResponse.json({ error: '用户不存在' }, { status: 404 })
      }
      const balanceBefore = userBefore.balance
      console.log(`[payment/webhook] 用户当前余额: ${balanceBefore}`)

      // 更新用户余额
      console.log(`[payment/webhook] 开始更新余额: userId=${userId}, energy=${energy}, 当前余额=${balanceBefore}`)
      try {
        await updateUserBalance(userId, energy)
        
        // 验证余额是否真的更新了
        const userAfter = await getUserById(userId)
        const balanceAfter = userAfter?.balance || 0
        console.log(`[payment/webhook] 余额更新后验证: 更新前=${balanceBefore}, 更新后=${balanceAfter}, 期望=${balanceBefore + energy}`)
        
        if (balanceAfter !== balanceBefore + energy) {
          console.error(`[payment/webhook] 余额更新验证失败: 期望=${balanceBefore + energy}, 实际=${balanceAfter}`)
          throw new Error(`余额更新验证失败: 期望=${balanceBefore + energy}, 实际=${balanceAfter}`)
        }
        
        console.log(`[payment/webhook] 余额更新成功并验证通过: userId=${userId}, energy=${energy}, 新余额=${balanceAfter}`)
      } catch (balanceError) {
        console.error(`[payment/webhook] 余额更新失败:`, balanceError)
        const errorDetails = balanceError instanceof Error ? balanceError.message : String(balanceError)
        console.error(`[payment/webhook] 错误堆栈:`, balanceError instanceof Error ? balanceError.stack : 'N/A')
        return NextResponse.json({ 
          error: `余额更新失败: ${errorDetails}`,
          userId,
          energy,
          balanceBefore 
        }, { status: 500 })
      }

      // 创建交易记录（包含 sessionId 用于幂等性检查）
      try {
        await createTransaction(userId, {
          type: 'topup',
          amount: energy,
          description: `Stripe 充值：${energy} 能量（HK$${amount?.toFixed(2) || 'N/A'}）[${sessionId}]`,
        })
        console.log(`[payment/webhook] 交易记录创建成功: userId=${userId}, energy=${energy}`)
      } catch (txError) {
        console.error(`[payment/webhook] 交易记录创建失败:`, txError)
        // 交易记录创建失败不影响余额更新，但记录错误
        // 注意：如果余额已更新但交易记录未创建，可能导致重复充值
        // 这里选择继续，因为余额已经更新成功
      }

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
