-- 添加标准化出生信息字段，用于同命盘报告复用
-- 执行时间：2026-02-06

-- 添加标准化字段（注意：表名需要使用双引号保持大小写）
ALTER TABLE public."Archive" 
  ADD COLUMN IF NOT EXISTS normalized_birth_date DATE,
  ADD COLUMN IF NOT EXISTS normalized_time_index INTEGER;

-- 创建索引用于快速查询相同命盘
CREATE INDEX IF NOT EXISTS idx_archive_normalized_birth 
  ON public."Archive"(gender, normalized_birth_date, normalized_time_index);

-- 为现有档案填充标准化字段（可选，如果需要可以运行）
-- 注意：这需要调用 normalizeBirthInfo 函数，建议通过后端脚本批量更新
-- UPDATE Archive SET normalized_birth_date = ..., normalized_time_index = ... WHERE normalized_birth_date IS NULL;
