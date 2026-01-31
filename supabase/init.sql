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
  
  CONSTRAINT "Archive_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Archive_userId_idx" ON "Archive"("userId");
CREATE INDEX IF NOT EXISTS "Archive_createdAt_idx" ON "Archive"("createdAt");

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
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "RedemptionCode_usedBy_idx" ON "RedemptionCode"("usedBy");

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
