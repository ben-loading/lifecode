-- ============================================
-- Stripe Webhook 幂等事件表
-- 目标：用数据库唯一约束保证同一支付会话只处理一次
-- 在 Supabase Dashboard -> SQL Editor 中执行
-- ============================================

CREATE TABLE IF NOT EXISTS public."PaymentEvent" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventId" TEXT,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  metadata JSONB,
  error TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_provider_sessionId_key" UNIQUE(provider, "sessionId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_provider_eventId_key"
  ON public."PaymentEvent"(provider, "eventId")
  WHERE "eventId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "PaymentEvent_provider_status_idx"
  ON public."PaymentEvent"(provider, status);

CREATE INDEX IF NOT EXISTS "PaymentEvent_userId_idx"
  ON public."PaymentEvent"("userId");
