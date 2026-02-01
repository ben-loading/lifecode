-- ============================================
-- 修复「Database error saving new user」
-- 1. 触发器跳过无 email 的用户（如部分 OAuth）
-- 2. inviteRef 更唯一，减少冲突
-- 3. 若表启用了 RLS，需确保触发器能插入（见下方说明）
-- 在 Supabase SQL Editor 中执行
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref TEXT;
BEGIN
  -- 无 email 时跳过（部分 OAuth 可能暂未带 email）
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  -- inviteRef 含用户 id，避免唯一约束冲突
  ref := substr(md5(NEW.id::text || random()::text || clock_timestamp()::text), 1, 12);

  INSERT INTO public."User" (id, email, name, balance, "inviteRef")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)),
    20,
    ref
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不要导致 auth 注册回滚（可选：记入日志表）
    RAISE WARNING 'handle_new_auth_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 确保触发器存在
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================
-- 若仍报错，请检查：
-- 1. Supabase Dashboard → Logs → Postgres：看具体报错
-- 2. public."User" 若启用了 RLS：需有策略允许插入，或由 postgres 执行本迁移（postgres 默认绕过 RLS）
-- ============================================
