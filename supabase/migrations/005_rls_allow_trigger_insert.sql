-- ============================================
-- 解决 RLS 导致「Database error saving new user」
-- 当 public."User" 启用了 RLS 时，触发器插入可能被拒绝。本迁移添加一条允许插入的策略。
-- 若你更希望关闭 RLS，可改为执行：ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

DROP POLICY IF EXISTS "Allow trigger insert" ON public."User";
CREATE POLICY "Allow trigger insert" ON public."User"
  FOR INSERT
  WITH CHECK (true);
