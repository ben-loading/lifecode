-- ============================================
-- 认证相关表：Session、VerificationCode
-- 在 Supabase SQL Editor 中执行
-- ============================================

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
