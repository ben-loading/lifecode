-- ============================================
-- 修复「Database error saving new user」
-- 原因：发送验证码时 signInWithOtp 会创建 auth.users 记录，触发器向 public."User" 插入时失败导致 Auth 报错。
-- 1. 触发器跳过无 email 的用户（如部分 OAuth）
-- 2. inviteRef 更唯一；显式写入 createdAt/updatedAt，避免表结构缺省值导致失败
-- 3. 任何插入异常都被捕获，仅打 WARNING，不令 auth 注册回滚
-- 4. 若表启用了 RLS，请再执行 005_rls_allow_trigger_insert.sql
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref TEXT;
  ts TIMESTAMP(3);
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  ts := CURRENT_TIMESTAMP;
  ref := substr(md5(NEW.id::text || random()::text || clock_timestamp()::text), 1, 12);

  INSERT INTO public."User" (id, email, name, balance, "inviteRef", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    LOWER(TRIM(NEW.email)),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)),
    20,
    ref,
    ts,
    ts
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_auth_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 若仍报错，请执行 supabase/migrations/005_rls_allow_trigger_insert.sql
