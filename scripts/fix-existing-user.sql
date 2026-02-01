-- ============================================
-- 修复已存在的 Supabase Auth 用户
-- 为他们在 public."User" 表中创建记录
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 为所有 auth.users 中存在但 public."User" 中不存在的用户创建记录
INSERT INTO public."User" (id, email, name, balance, "inviteRef")
SELECT 
  au.id::text,
  au.email,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''), 
    split_part(au.email, '@', 1)
  ) as name,
  20 as balance,
  substr(md5(au.id::text || random()::text || clock_timestamp()::text), 1, 12) as inviteRef
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
WHERE u.id IS NULL
  AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 验证：显示刚才创建的用户
SELECT 
  u.id,
  u.email,
  u.name,
  u.balance,
  u."inviteRef",
  u."createdAt"
FROM public."User" u
ORDER BY u."createdAt" DESC
LIMIT 10;
