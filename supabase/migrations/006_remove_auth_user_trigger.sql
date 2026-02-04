-- ============================================
-- 治本：移除「注册时自动创建 public.User」的触发器
-- 原因：发送验证码时 signInWithOtp 会插入 auth.users，触发器再插 public."User"，
--       若插入失败会报「Database error saving new user」。业务用户改为仅由应用层创建。
-- 流程：发送验证码 → 只创建 auth 用户（无触发器）→ 用户输入验证码登录 → 首次调 getSession/getUserIdFromRequest 时在应用内 createUser。
-- 在 Supabase Dashboard → SQL Editor 中执行（建议在 003/005 之后执行，或直接替代 003/005 作为治本方案）
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- 可选：删除函数（若没有其他地方引用）
-- DROP FUNCTION IF EXISTS public.handle_new_auth_user();
