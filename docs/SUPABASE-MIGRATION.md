# LifeCode Supabase 迁移方案

> **目标**: 用 Supabase 一站式替代当前的鉴权、API、数据库和部署方案

---

## 📊 Supabase vs 当前架构对比

| 功能模块 | 当前方案 | Supabase 方案 | 优势 |
|---------|---------|--------------|------|
| **鉴权** | 自建邮箱验证码登录 | Supabase Auth（Magic Link） | 开箱即用、安全性高、支持多种登录方式 |
| **数据库** | 内存存储（开发）/ Prisma + PostgreSQL（计划） | Supabase PostgreSQL + Realtime | 自动备份、扩展性强、免费额度充足 |
| **API** | Next.js API Routes | Supabase REST API + Row Level Security (RLS) | 自动生成 CRUD API、权限控制更细粒度 |
| **文件存储** | 无（未来需求） | Supabase Storage | 图片上传（头像、社交名片）、CDN 加速 |
| **实时功能** | 轮询（报告进度） | Supabase Realtime | WebSocket 自动推送、减少服务器压力 |
| **部署** | Vercel（计划） | Vercel + Supabase（分离） | 前端托管 + 后端服务分离、更易扩展 |

---

## ✅ Supabase 可以完全替代的功能

### 1. 鉴权系统 → Supabase Auth

#### 当前实现（自建）
```typescript
// src/app/api/auth/send-code/route.ts
// 发送验证码到邮箱，存储在内存中
// 问题：需要邮件服务、Session 管理、Token 刷新逻辑
```

#### Supabase 方案（Magic Link）
```typescript
// 1. 用户输入邮箱
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 发送 Magic Link
await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://lifecode.app/auth/callback'
  }
})

// 2. 用户点击邮件链接后自动登录（无需验证码输入）
// 3. 获取当前用户
const { data: { user } } = await supabase.auth.getUser()
```

**优势**：
- ✅ 无需自建邮件服务（Supabase 内置发信）
- ✅ 自动处理 Token 刷新、Session 管理
- ✅ 支持多种登录方式（邮箱/手机/社交登录）
- ✅ 内置安全机制（防暴力破解、IP 限流）

---

### 2. 数据库 → Supabase PostgreSQL

#### 当前实现
```typescript
// src/lib/store.ts - 内存存储（临时方案）
// prisma/schema.prisma - Prisma ORM（计划迁移）
```

#### Supabase 方案
**直接使用 Prisma Schema 迁移**：
```bash
# 1. 在 Supabase Dashboard 创建项目，获取 DATABASE_URL
# 格式：postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres

# 2. 更新 .env.local
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# 3. 运行 Prisma 迁移（Schema 无需修改）
npx prisma migrate dev --name init
npx prisma generate

# 4. 替换内存存储为 Prisma Client
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// 所有数据库操作都通过 Prisma
const user = await prisma.user.create({ data: { email, balance: 20 } })
```

**额外优势 - Row Level Security (RLS)**：
```sql
-- Supabase 支持行级权限控制
-- 例：用户只能查看自己的档案
CREATE POLICY "Users can view own archives"
  ON archives FOR SELECT
  USING (auth.uid() = user_id);

-- 自动验证，无需在 API 中手写权限检查
```

---

### 3. API 层 → Supabase REST API + Next.js API Routes（混合）

#### 方案 A：纯 Supabase REST API（适合 CRUD）
```typescript
// 前端直接调用 Supabase，无需自建 API
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 创建档案（自动验证权限）
const { data, error } = await supabase
  .from('archives')
  .insert({
    user_id: user.id,
    name: '我的档案',
    gender: 'male',
    birth_date: '1990-01-01T00:00:00Z',
    birth_location: '中国,北京市'
  })
  .select()
  .single()

// 查询用户档案（RLS 自动过滤）
const { data: archives } = await supabase
  .from('archives')
  .select('*')
  .order('created_at', { ascending: false })
```

#### 方案 B：Next.js API Routes（适合复杂业务逻辑）
保留 Next.js API Routes 处理：
- ✅ LLM 调用（主报告生成）
- ✅ iztro 命盘计算
- ✅ 能量扣除 + 事务处理
- ✅ 第三方支付回调

**推荐混合方案**：
| 操作 | 使用方案 | 原因 |
|------|---------|------|
| 用户登录/登出 | Supabase Auth | 开箱即用 |
| 档案 CRUD | Supabase REST API | 自动权限控制 |
| 报告生成 | Next.js API Routes | 需要调用 LLM + iztro |
| 交易记录查询 | Supabase REST API | 简单查询 |
| 能量充值 | Next.js API Routes | 需要支付回调 |

---

### 4. 实时功能 → Supabase Realtime

#### 当前实现（轮询）
```typescript
// src/app/report/page.tsx
// 前端每 2 秒轮询 /api/report/status/[jobId]
useEffect(() => {
  const poll = async () => {
    const job = await getReportJobStatus(jobId)
    if (job.status === 'completed') { /* ... */ }
    setTimeout(poll, 2000)
  }
  poll()
}, [jobId])
```

#### Supabase 方案（WebSocket 推送）
```typescript
// 1. 后端更新 ReportJob 状态
await supabase
  .from('report_jobs')
  .update({ status: 'completed' })
  .eq('id', jobId)

// 2. 前端自动接收推送（无需轮询）
const subscription = supabase
  .channel('report-progress')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'report_jobs',
    filter: `id=eq.${jobId}`
  }, (payload) => {
    console.log('Job updated:', payload.new)
    if (payload.new.status === 'completed') {
      // 自动拉取报告
    }
  })
  .subscribe()

// 清理
return () => supabase.removeChannel(subscription)
```

**优势**：
- ✅ 减少 70% 的 API 请求
- ✅ 更快的状态更新（< 100ms 延迟）
- ✅ 节省服务器资源

---

### 5. 文件存储 → Supabase Storage（未来需求）

**适用场景**：
- 用户头像上传
- 社交名片图片生成后存储
- 报告 PDF 导出

```typescript
// 1. 上传文件
const file = event.target.files[0]
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${user.id}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true
  })

// 2. 获取公开 URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${user.id}/avatar.png`)

// 3. 图片自动 CDN 加速（全球节点）
// https://xxx.supabase.co/storage/v1/object/public/avatars/...
```

---

## 🚀 迁移实施步骤

### Phase 1: 数据库迁移（1-2 天）

#### 1.1 创建 Supabase 项目
```bash
# 1. 访问 https://supabase.com/dashboard
# 2. 创建新项目（选择最近的区域，如新加坡/香港）
# 3. 获取项目凭证：
#    - SUPABASE_URL: https://xxx.supabase.co
#    - SUPABASE_ANON_KEY: eyJhbG...
#    - DATABASE_URL: postgresql://postgres:...
```

#### 1.2 运行 Prisma 迁移
```bash
# 更新 .env.local
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres:...@db.xxx.supabase.co:5432/postgres

# 升级 Node.js（如需要）
nvm install 22.12.0
nvm use 22.12.0

# 运行迁移
npm install @supabase/supabase-js
npx prisma migrate dev --name init
npx prisma generate
```

#### 1.3 迁移数据访问层
```typescript
// 创建 src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 替换 src/lib/store.ts 的所有调用
// 例：
// const user = store.users.get(userId)
// 改为：
// const user = await prisma.user.findUnique({ where: { id: userId } })
```

#### 1.4 配置 Row Level Security（可选）
```sql
-- 在 Supabase Dashboard > SQL Editor 执行
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archives"
  ON archives FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own archives"
  ON archives FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 其他表同理
```

---

### Phase 2: 鉴权迁移（2-3 天）

#### 2.1 安装 Supabase Auth
```bash
npm install @supabase/ssr @supabase/supabase-js
```

#### 2.2 创建 Supabase 客户端
```typescript
// src/lib/supabase/client.ts（浏览器端）
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase/server.ts（服务端）
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
}
```

#### 2.3 实现登录流程
```typescript
// src/app/api/auth/login/route.ts（保留或简化）
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { email } = await request.json()
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  })
  
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ message: 'Check your email for the login link' })
}

// src/app/auth/callback/route.ts（处理 Magic Link 回调）
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  return NextResponse.redirect(new URL('/', request.url))
}
```

#### 2.4 更新前端 Context
```typescript
// src/lib/context.tsx（简化版）
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
    
    // 监听鉴权状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  // ... 其他状态管理
}
```

---

### Phase 3: API 重构（3-5 天）

#### 3.1 CRUD 操作迁移到前端
```typescript
// 前端直接调用（无需 API Routes）
// src/lib/api/archives.ts
import { createClient } from '@/lib/supabase/client'

export async function createArchive(data: CreateArchiveData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('未登录')
  
  const { data: archive, error } = await supabase
    .from('archives')
    .insert({
      user_id: user.id,
      name: data.name,
      gender: data.gender,
      birth_date: data.birthDate,
      birth_location: data.birthLocation,
      birth_calendar: data.birthCalendar,
      birth_time_mode: data.birthTimeMode,
      birth_time_branch: data.birthTimeBranch,
      lunar_date: data.lunarDate,
      is_leap_month: data.isLeapMonth
    })
    .select()
    .single()
  
  if (error) throw error
  return archive
}

export async function getArchives() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('archives')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

#### 3.2 保留复杂业务逻辑在 API Routes
```typescript
// src/app/api/report/generate/route.ts（保留）
// 功能：扣除能量 + 创建任务 + 调用 LLM
import { createClient } from '@/lib/supabase/server'
import { generateMainReport } from '@/lib/services/report-service'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return Response.json({ error: '未登录' }, { status: 401 })
  
  const { archiveId } = await request.json()
  
  // 1. 查询档案
  const { data: archive } = await supabase
    .from('archives')
    .select('*')
    .eq('id', archiveId)
    .eq('user_id', user.id)
    .single()
  
  if (!archive) return Response.json({ error: '档案不存在' }, { status: 404 })
  
  // 2. 扣除能量（事务）
  const { data: userRecord, error: balanceError } = await supabase.rpc('deduct_balance', {
    user_id: user.id,
    amount: 20
  })
  
  if (balanceError) return Response.json({ error: '能量不足' }, { status: 400 })
  
  // 3. 创建任务
  const { data: job } = await supabase
    .from('report_jobs')
    .insert({
      archive_id: archiveId,
      status: 'running',
      current_step: 0,
      total_steps: 6
    })
    .select()
    .single()
  
  // 4. 异步生成报告（后台任务）
  generateMainReport(archiveId)
    .then(async (report) => {
      await supabase.from('report_jobs').update({ status: 'completed' }).eq('id', job.id)
      await supabase.from('main_reports').insert({
        archive_id: archiveId,
        content: report
      })
    })
    .catch(async (error) => {
      await supabase.from('report_jobs').update({
        status: 'failed',
        error: error.message
      }).eq('id', job.id)
    })
  
  return Response.json({ jobId: job.id })
}
```

---

### Phase 4: 实时推送（1 天）

```typescript
// src/app/report/page.tsx
// 替换轮询为 Realtime 订阅
useEffect(() => {
  if (!jobId) return
  
  const supabase = createClient()
  const subscription = supabase
    .channel(`job-${jobId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'report_jobs',
      filter: `id=eq.${jobId}`
    }, (payload) => {
      const job = payload.new as ReportJob
      if (job.status === 'completed') {
        setIsAnalyzing(false)
        setCurrentStep(6)
        // 拉取报告
        fetchReport()
      } else if (job.status === 'failed') {
        setGenerationError(job.error || '报告生成失败')
        setIsAnalyzing(false)
      }
    })
    .subscribe()
  
  return () => {
    supabase.removeChannel(subscription)
  }
}, [jobId])
```

---

### Phase 5: 部署配置（1 天）

#### 5.1 Vercel 部署（前端 + API）
```bash
# 1. 在 Vercel Dashboard 创建项目
# 2. 关联 GitHub 仓库
# 3. 配置环境变量：
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...(仅服务端)
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...

# 4. 部署（自动触发）
git push origin main
```

#### 5.2 Supabase 邮件配置
```bash
# Supabase Dashboard > Authentication > Email Templates
# 自定义 Magic Link 邮件模板（中文化）

主题：LifeCode 登录验证
内容：
您好，

点击下方链接登录 LifeCode：

{{ .ConfirmationURL }}

此链接 1 小时内有效。如果您没有请求登录，请忽略此邮件。

LifeCode 团队
```

---

## 💰 成本估算

### Supabase 免费套餐（足够前期使用）
| 资源 | 免费额度 | 付费阈值 |
|------|---------|---------|
| 数据库 | 500MB | $25/月（8GB） |
| 带宽 | 5GB/月 | $0.09/GB |
| 存储空间 | 1GB | $0.021/GB/月 |
| Auth 用户数 | 无限制 | $0.00325/MAU（活跃用户）|
| Realtime 连接 | 200 并发 | $10/月（500 并发） |

**估算**：
- 前 1000 个用户：**完全免费**
- 10,000 用户：**约 $25-50/月**（主要是数据库存储）
- LLM 成本：**$0.05-0.1/次**（主要成本来源）

### 对比自建方案
| 方案 | 月成本 | 开发时间 | 维护成本 |
|------|--------|---------|---------|
| **自建**（VPS + PostgreSQL + Redis + 邮件服务） | $50-100 | 2-3 周 | 高 |
| **Supabase**（一站式） | $0-50 | 3-5 天 | 极低 |

---

## 📋 迁移 Checklist

### 数据库
- [ ] 创建 Supabase 项目
- [ ] 配置 DATABASE_URL
- [ ] 运行 Prisma 迁移
- [ ] 配置 RLS 策略
- [ ] 测试 CRUD 操作

### 鉴权
- [ ] 安装 Supabase Auth SDK
- [ ] 实现 Magic Link 登录
- [ ] 创建回调路由
- [ ] 更新前端 Context
- [ ] 测试登录/登出流程
- [ ] 自定义邮件模板

### API
- [ ] 迁移档案 CRUD 到前端
- [ ] 保留报告生成 API
- [ ] 实现能量扣除 RPC
- [ ] 测试权限控制
- [ ] 优化错误处理

### 实时功能
- [ ] 替换轮询为 Realtime
- [ ] 测试 WebSocket 连接
- [ ] 优化断线重连

### 部署
- [ ] Vercel 配置环境变量
- [ ] 测试生产环境
- [ ] 配置自定义域名
- [ ] 设置 CORS 策略

---

## 🎯 推荐迁移策略

### 方案 A：渐进式迁移（推荐）
**优势**：风险低、可回滚
```
Week 1: 数据库迁移（Prisma → Supabase PostgreSQL）
Week 2: 鉴权迁移（自建 → Supabase Auth）
Week 3: API 重构（CRUD → 前端直调，保留复杂逻辑）
Week 4: 实时推送（轮询 → Realtime）
```

### 方案 B：一次性迁移
**优势**：快速上线、架构统一
```
Day 1-2: 数据库 + 鉴权
Day 3-4: API 重构
Day 5: 实时推送 + 部署
Day 6-7: 测试 + 修复
```

---

## 🔒 安全建议

### 1. 环境变量管理
```bash
# .env.local（开发）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...（公开密钥，可暴露）

# Vercel（生产）
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...（私钥，仅服务端）
DATABASE_URL=postgresql://...（私钥）
```

### 2. Row Level Security（必须）
```sql
-- 确保所有表都启用 RLS
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users access own data"
  ON archives FOR ALL
  USING (auth.uid()::text = user_id);
```

### 3. API 限流
```typescript
// Supabase 自动限流，可在 Dashboard 配置
// 或使用 Vercel Edge Config 自定义规则
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s') // 10 次/10 秒
})
```

---

## 📚 参考资源

- **Supabase 官方文档**: https://supabase.com/docs
- **Next.js + Supabase 集成**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Prisma + Supabase**: https://supabase.com/docs/guides/integrations/prisma
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Realtime**: https://supabase.com/docs/guides/realtime

---

## 🚀 总结

### Supabase 一站式方案的核心优势

1. **开发效率提升 60%**
   - 鉴权、数据库、API 开箱即用
   - 无需自建邮件服务、Session 管理
   - RLS 自动处理权限，减少手写代码

2. **运维成本降低 80%**
   - 自动备份、监控、日志
   - 无需维护服务器、数据库
   - 免费额度足够前期使用

3. **性能优化**
   - Realtime 替代轮询，减少 70% API 请求
   - 全球 CDN 加速（Storage）
   - 连接池优化（PostgreSQL）

4. **扩展性**
   - 垂直扩展：一键升级配置
   - 水平扩展：支持读写分离、多副本
   - 未来可接入 Edge Functions（Serverless）

### 迁移时间估算
- **数据库 + 鉴权**: 3-5 天
- **API 重构**: 3-5 天
- **实时推送 + 部署**: 2 天
- **总计**: **1-2 周**（兼职开发）

### 下一步行动
1. 创建 Supabase 项目（5 分钟）
2. 运行 Prisma 迁移（30 分钟）
3. 测试数据库连接（10 分钟）
4. 实现 Magic Link 登录（2 小时）
5. 逐步替换 API Routes（按模块）

**建议**：先完成数据库迁移（Phase 1），确保数据持久化后再进行鉴权和 API 重构。
