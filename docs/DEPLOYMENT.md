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

### 3. 验证表结构
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
- **数据存储**：内存存储（`src/lib/store.ts`）
- **数据库**：已准备好 Supabase 表结构，但 API 尚未切换到数据库
- **认证**：使用内存 Token，非 Supabase Auth

### 后续迁移
1. 将 API Routes 中的 `store` 调用替换为 Supabase 查询
2. 启用 Supabase Auth 替换当前的邮箱验证码登录
3. 启用 Row Level Security (RLS) 保护数据

### 测试用户
- 任意邮箱登录
- 验证码在终端输出查看：`[mock] send-code for xxx@xxx.com: 123456`
- 测试兑换码：`DEMO50`（50 能量）、`TEST100`（100 能量）
