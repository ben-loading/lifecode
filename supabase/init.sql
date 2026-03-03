-- ============================================
-- LifeCode 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 启用必要扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 用户表 ====================
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  balance INTEGER NOT NULL DEFAULT 20,
  "inviteRef" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);
CREATE INDEX IF NOT EXISTS "User_inviteRef_idx" ON "User"("inviteRef");

-- ==================== 档案表 ====================
CREATE TABLE IF NOT EXISTS "Archive" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "birthLocation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- 出生信息扩展字段
  "birthCalendar" TEXT,      -- 'solar' | 'lunar'
  "birthTimeMode" TEXT,      -- 'datetime' | 'shichen'
  "birthTimeBranch" INTEGER, -- 0-12 时辰序号
  "lunarDate" TEXT,          -- 农历日期 YYYY-M-D
  "isLeapMonth" BOOLEAN,     -- 是否闰月
  
  -- 标准化字段（用于同命盘报告复用）
  normalized_birth_date DATE,        -- 标准化后的公历日期 YYYY-MM-DD
  normalized_time_index INTEGER,    -- 标准化后的时辰序号 0-12
  
  CONSTRAINT "Archive_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Archive_userId_idx" ON "Archive"("userId");
CREATE INDEX IF NOT EXISTS "Archive_createdAt_idx" ON "Archive"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_archive_normalized_birth" 
  ON "Archive"(gender, normalized_birth_date, normalized_time_index);

-- ==================== 主报告表 ====================
CREATE TABLE IF NOT EXISTS "MainReport" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "archiveId" TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  "lifeScriptTitle" TEXT,
  "baziDisplay" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "MainReport_archiveId_fkey" FOREIGN KEY ("archiveId") 
    REFERENCES "Archive"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MainReport_archiveId_idx" ON "MainReport"("archiveId");
CREATE INDEX IF NOT EXISTS "MainReport_createdAt_idx" ON "MainReport"("createdAt");

-- ==================== 深度报告表 ====================
CREATE TABLE IF NOT EXISTS "DeepReport" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "archiveId" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  content JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "DeepReport_archiveId_fkey" FOREIGN KEY ("archiveId") 
    REFERENCES "Archive"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DeepReport_archiveId_reportType_key" UNIQUE("archiveId", "reportType")
);

CREATE INDEX IF NOT EXISTS "DeepReport_archiveId_idx" ON "DeepReport"("archiveId");

-- ==================== 交易记录表 ====================
CREATE TABLE IF NOT EXISTS "Transaction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction"(type);

-- ==================== 支付事件幂等表 ====================
CREATE TABLE IF NOT EXISTS "PaymentEvent" (
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
  ON "PaymentEvent"(provider, "eventId")
  WHERE "eventId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "PaymentEvent_provider_status_idx" ON "PaymentEvent"(provider, status);
CREATE INDEX IF NOT EXISTS "PaymentEvent_userId_idx" ON "PaymentEvent"("userId");

-- ==================== 邀请记录表 ====================
CREATE TABLE IF NOT EXISTS "Invite" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "inviterId" TEXT NOT NULL,
  "inviteeId" TEXT NOT NULL,
  "isValid" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "Invite_inviterId_fkey" FOREIGN KEY ("inviterId") 
    REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Invite_inviteeId_fkey" FOREIGN KEY ("inviteeId") 
    REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Invite_inviterId_inviteeId_key" UNIQUE("inviterId", "inviteeId")
);

CREATE INDEX IF NOT EXISTS "Invite_inviterId_idx" ON "Invite"("inviterId");
CREATE INDEX IF NOT EXISTS "Invite_inviteeId_idx" ON "Invite"("inviteeId");

-- ==================== 兑换码表 ====================
CREATE TABLE IF NOT EXISTS "RedemptionCode" (
  code TEXT PRIMARY KEY,
  amount INTEGER NOT NULL,
  "usedBy" TEXT,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);

CREATE INDEX IF NOT EXISTS "RedemptionCode_usedBy_idx" ON "RedemptionCode"("usedBy");

-- ==================== 会话表 ====================
CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"(token);
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- ==================== 验证码表 ====================
CREATE TABLE IF NOT EXISTS "VerificationCode" (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  "expiresAt" BIGINT NOT NULL
);

-- ==================== 报告生成任务表 ====================
CREATE TABLE IF NOT EXISTS "ReportJob" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "archiveId" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "currentStep" INTEGER,
  "totalSteps" INTEGER,
  "stepLabel" TEXT,
  error TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ReportJob_archiveId_idx" ON "ReportJob"("archiveId");
CREATE INDEX IF NOT EXISTS "ReportJob_status_idx" ON "ReportJob"(status);
CREATE INDEX IF NOT EXISTS "ReportJob_createdAt_idx" ON "ReportJob"("createdAt");

-- ==================== 深度报告生成任务表 ====================
CREATE TABLE IF NOT EXISTS "DeepReportJob" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "archiveId" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "currentStep" INTEGER,
  "totalSteps" INTEGER,
  "stepLabel" TEXT,
  error TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeepReportJob_archiveId_fkey" FOREIGN KEY ("archiveId")
    REFERENCES "Archive"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DeepReportJob_archiveId_idx" ON "DeepReportJob"("archiveId");
CREATE INDEX IF NOT EXISTS "DeepReportJob_reportType_idx" ON "DeepReportJob"("reportType");
CREATE INDEX IF NOT EXISTS "DeepReportJob_status_idx" ON "DeepReportJob"(status);
CREATE INDEX IF NOT EXISTS "DeepReportJob_createdAt_idx" ON "DeepReportJob"("createdAt");

-- ==================== 报告任务原子启动函数 ====================
CREATE OR REPLACE FUNCTION public.start_main_report_job(
  p_user_id TEXT,
  p_archive_id TEXT,
  p_cost INTEGER,
  p_step_label TEXT,
  p_charge BOOLEAN
)
RETURNS TABLE(job_id TEXT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('main:' || p_archive_id));

  IF EXISTS (
    SELECT 1
    FROM public."ReportJob"
    WHERE "archiveId" = p_archive_id
      AND status IN ('running', 'processing')
  ) THEN
    RETURN QUERY SELECT NULL::TEXT, 'JOB_ALREADY_RUNNING'::TEXT;
    RETURN;
  END IF;

  IF p_charge THEN
    UPDATE public."User"
    SET balance = balance - p_cost,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = p_user_id
      AND balance >= p_cost;

    IF NOT FOUND THEN
      IF EXISTS (SELECT 1 FROM public."User" WHERE id = p_user_id) THEN
        RETURN QUERY SELECT NULL::TEXT, 'INSUFFICIENT_BALANCE'::TEXT;
      ELSE
        RETURN QUERY SELECT NULL::TEXT, 'USER_NOT_FOUND'::TEXT;
      END IF;
      RETURN;
    END IF;

    INSERT INTO public."Transaction"(id, "userId", type, amount, description, "createdAt")
    VALUES (gen_random_uuid()::TEXT, p_user_id, 'consume', p_cost, '主報告生成', CURRENT_TIMESTAMP);
  END IF;

  v_job_id := gen_random_uuid()::TEXT;
  INSERT INTO public."ReportJob"(
    id, "archiveId", status, "currentStep", "totalSteps", "stepLabel", "createdAt", "updatedAt"
  ) VALUES (
    v_job_id, p_archive_id, 'running', 0, 6, p_step_label, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  RETURN QUERY SELECT v_job_id, 'OK'::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_deep_report_job(
  p_user_id TEXT,
  p_archive_id TEXT,
  p_report_type TEXT,
  p_cost INTEGER,
  p_step_label TEXT,
  p_charge BOOLEAN
)
RETURNS TABLE(job_id TEXT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('deep:' || p_archive_id || ':' || p_report_type));

  IF EXISTS (
    SELECT 1
    FROM public."DeepReport"
    WHERE "archiveId" = p_archive_id
      AND "reportType" = p_report_type
  ) THEN
    RETURN QUERY SELECT NULL::TEXT, 'REPORT_ALREADY_EXISTS'::TEXT;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public."DeepReportJob"
    WHERE "archiveId" = p_archive_id
      AND "reportType" = p_report_type
      AND status IN ('running', 'processing')
  ) THEN
    RETURN QUERY SELECT NULL::TEXT, 'JOB_ALREADY_RUNNING'::TEXT;
    RETURN;
  END IF;

  IF p_charge THEN
    UPDATE public."User"
    SET balance = balance - p_cost,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = p_user_id
      AND balance >= p_cost;

    IF NOT FOUND THEN
      IF EXISTS (SELECT 1 FROM public."User" WHERE id = p_user_id) THEN
        RETURN QUERY SELECT NULL::TEXT, 'INSUFFICIENT_BALANCE'::TEXT;
      ELSE
        RETURN QUERY SELECT NULL::TEXT, 'USER_NOT_FOUND'::TEXT;
      END IF;
      RETURN;
    END IF;

    INSERT INTO public."Transaction"(id, "userId", type, amount, description, "createdAt")
    VALUES (
      gen_random_uuid()::TEXT,
      p_user_id,
      'consume',
      p_cost,
      '深度報告：' || p_report_type,
      CURRENT_TIMESTAMP
    );
  END IF;

  v_job_id := gen_random_uuid()::TEXT;
  INSERT INTO public."DeepReportJob"(
    id, "archiveId", "reportType", status, "currentStep", "totalSteps", "stepLabel", "createdAt", "updatedAt"
  ) VALUES (
    v_job_id, p_archive_id, p_report_type, 'running', 0, 4, p_step_label, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  RETURN QUERY SELECT v_job_id, 'OK'::TEXT;
END;
$$;

-- ==================== 初始数据 ====================
-- 插入测试兑换码
INSERT INTO "RedemptionCode" (code, amount) VALUES 
  ('DEMO50', 50),
  ('TEST100', 100)
ON CONFLICT (code) DO NOTHING;

-- ==================== Row Level Security (RLS) ====================
-- 注意：当前使用内存存储模式，RLS 暂不启用
-- 生产环境启用时需要配合 Supabase Auth

-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Archive" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "MainReport" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "DeepReport" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 执行完成提示
-- ============================================
SELECT 'LifeCode 数据库初始化完成！' as message;

