-- ============================================
-- 诊断脚本：检查新用户创建是否成功
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 检查触发器是否存在
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. 检查最近的 auth.users 记录
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. 检查 public."User" 表中是否有对应记录
SELECT 
  u.id,
  u.email,
  u.name,
  u.balance,
  u."inviteRef",
  u."createdAt"
FROM public."User" u
ORDER BY u."createdAt" DESC
LIMIT 5;

-- 4. 找出 auth.users 中存在但 public."User" 中不存在的用户
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- 5. 检查 User 表的 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'User';
