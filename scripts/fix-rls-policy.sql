-- ============================================
-- 选项 A：临时禁用 User 表的 RLS（最简单）
-- ============================================
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 选项 B：保持 RLS，但添加触发器插入策略（推荐）
-- ============================================
-- 如果你想保持 RLS 开启，执行以下语句：

-- 1. 允许 service_role 和触发器插入
CREATE POLICY "Allow trigger insert" ON public."User"
  FOR INSERT
  WITH CHECK (true);

-- 2. 允许用户查看和更新自己的数据
CREATE POLICY "Users can view own data" ON public."User"
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON public."User"
  FOR UPDATE
  USING (auth.uid()::text = id);
