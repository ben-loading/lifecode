-- 为 RedemptionCode 表添加 createdAt 和 note 字段
-- 执行日期：2026-02-06

-- 添加 createdAt 字段（如果不存在）
ALTER TABLE public."RedemptionCode" 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 添加 note 字段（如果不存在）
ALTER TABLE public."RedemptionCode" 
ADD COLUMN IF NOT EXISTS "note" TEXT;

-- 为已存在的记录设置默认创建时间（使用当前时间，实际应该根据业务需求调整）
UPDATE public."RedemptionCode" 
SET "createdAt" = NOW() 
WHERE "createdAt" IS NULL;

-- 创建索引以提高查询性能（按创建时间排序）
CREATE INDEX IF NOT EXISTS "idx_redemption_code_created_at" 
ON public."RedemptionCode"("createdAt" DESC);

-- 创建索引以提高查询性能（按使用状态查询）
CREATE INDEX IF NOT EXISTS "idx_redemption_code_used_by" 
ON public."RedemptionCode"("usedBy") 
WHERE "usedBy" IS NOT NULL;
