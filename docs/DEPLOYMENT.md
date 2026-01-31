# LifeCode 部署指南

## 一、Supabase 数据库初始化

### 1. 登录 Supabase Dashboard
访问 https://supabase.com/dashboard 并登录

### 2. 执行数据库初始化脚本
1. 进入项目：`erkmeujwxpehyeeosgik`
2. 左侧菜单选择 **SQL Editor**
3. 点击 **New query**
4. 复制 `supabase/init.sql` 文件内容并粘贴
5. 点击 **Run** 执行

### 3. 执行 Supabase Auth 触发器（必需）
在 SQL Editor 中执行 `supabase/migrations/002_supabase_auth_user.sql`，创建新用户自动创建 User 记录的触发器。

### 4. Supabase Auth 配置
在 Supabase Dashboard → Authentication → Providers → Email：
- 启用 Email 提供商
- 可选：自定义邮件模板，将 Magic Link 改为 6 位验证码（在模板中使用 `{{ .Token }}`）

### 5. 验证表结构
执行以下 SQL 验证：

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

应看到以下表：
- Archive
- DeepReport
- Invite
- MainReport
- RedemptionCode
- ReportJob
- Transaction
- User

---

## 二、Vercel 部署

### 1. 安装 Vercel CLI（如未安装）
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 配置环境变量
在 Vercel Dashboard 或通过 CLI 设置：

```bash
# Supabase 配置
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATABASE_URL

# LLM 配置
vercel env add DEEPSEEK_API_KEY
vercel env add LLM_PROVIDER
```

**环境变量值**（从 .env.local 获取）：

| 变量名 | 值 |
|--------|-----|
| NEXT_PUBLIC_SUPABASE_URL | https://erkmeujwxpehyeeosgik.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| SUPABASE_SERVICE_ROLE_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| DATABASE_URL | postgresql://postgres:xxx@db.erkmeujwxpehyeeosgik.supabase.co:5432/postgres?sslmode=require |
| DEEPSEEK_API_KEY | sk-1d315b1d683042a684f8730b4ec732d8 |
| LLM_PROVIDER | deepseek |

### 4. 部署项目
```bash
cd /Users/bd/Documents/selfdev/lifecode
vercel --prod
```

### 5. 访问测试
部署完成后，Vercel 会提供访问链接，如：
- https://lifecode-xxx.vercel.app

---

## 三、本地开发

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 测试 LLM 连接
```bash
npx tsx scripts/simulate-report-generation.ts
```

---

## 四、注意事项

### 当前架构
- **数据存储**：Supabase PostgreSQL（`src/lib/db.ts`）
- **认证**：Supabase Auth（邮箱 OTP 验证码）

### 测试用户
- 任意邮箱登录
- 验证码在终端输出查看：`[mock] send-code for xxx@xxx.com: 123456`
- 测试兑换码：`DEMO50`（50 能量）、`TEST100`（100 能量）
