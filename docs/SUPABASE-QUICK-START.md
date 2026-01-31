# LifeCode Supabase 快速上手方案（测试环境优先）

> **核心思路**: 直接在 Supabase 上搭建测试环境，边测试边完善，无需等待完整迁移

---

## 🎯 现实情况评估

### 当前功能量级
```
核心功能：
✅ 用户登录（邮箱验证码）
✅ 出生信息录入（1 个表单页）
✅ 档案创建（1 个 API）
✅ 主报告生成（1 个核心 API + LLM 调用）
✅ 报告展示（1 个页面）

数据表：
✅ User（用户）
✅ Archive（档案）
✅ MainReport（主报告）
✅ ReportJob（任务）
✅ Transaction（交易）

API Routes：
✅ /api/auth/* (登录相关，3-4 个)
✅ /api/archives (档案 CRUD，1 个)
✅ /api/report/* (报告相关，3 个)
✅ /api/user/* (用户信息，2 个)
```

**评估结果**: 功能简单，**1-2 天**即可完成 Supabase 基础迁移

---

## ⚡ 快速上手方案（推荐）

### 策略：直接用 Supabase 做测试环境

**优势**：
- ✅ 无需维护两套环境（开发 + 测试）
- ✅ 边测试边完善，发现问题立即修复
- ✅ 测试数据可随时清空重来（Supabase Dashboard）
- ✅ 测试环境免费（500MB 数据库 + 5GB 带宽）
- ✅ 后续直接升级为生产环境（无需重新部署）

**劣势**：
- ⚠️ 无（当前功能简单，没有复杂依赖）

---

## 🚀 2 天快速迁移计划

### Day 1 上午（3 小时）：数据库 + 基础配置

#### Step 1: 创建 Supabase 项目（10 分钟）
```bash
# 1. 访问 https://supabase.com/dashboard
# 2. 点击 "New Project"
# 3. 填写信息：
#    - Name: lifecode-test
#    - Database Password: (自动生成)
#    - Region: Southeast Asia (Singapore) 或 Northeast Asia (Tokyo)
# 4. 等待项目初始化（2-3 分钟）
```

#### Step 2: 配置环境变量（5 分钟）
```bash
# 复制 .env.local.example 为 .env.local
cp .env.local.example .env.local

# 编辑 .env.local，填写 Supabase 凭证（在 Dashboard > Settings > API 查看）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...（仅服务端使用）
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# 保留 LLM 配置
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

#### Step 3: 安装依赖 + 运行迁移（20 分钟）
```bash
# 1. 安装 Supabase SDK
npm install @supabase/supabase-js @supabase/ssr

# 2. 确保 Node.js 版本 >= 20.19（Prisma 要求）
node -v  # 如果 < 20.19，运行：nvm install 22.12.0 && nvm use 22.12.0

# 3. 运行 Prisma 迁移（自动创建表结构）
npx prisma migrate dev --name init
# 输入 migration name: init

# 4. 生成 Prisma Client
npx prisma generate
```

#### Step 4: 验证数据库连接（5 分钟）
```bash
# 在 Supabase Dashboard > SQL Editor 执行：
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# 应该看到：
# - User
# - Archive
# - MainReport
# - ReportJob
# - Transaction
# - Invite
# - RedemptionCode
# - _prisma_migrations
```

#### Step 5: 创建 Prisma 客户端（10 分钟）
```typescript
// 创建 src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

---

### Day 1 下午（4 小时）：替换内存存储为 Prisma

#### 核心改动：`src/lib/store.ts` → `src/lib/db.ts`

**当前痛点**：内存存储重启丢失，无法测试真实场景

**改动范围**：
- ✅ `src/app/api/auth/**/*.ts`（登录相关）
- ✅ `src/app/api/archives/route.ts`（档案 CRUD）
- ✅ `src/app/api/report/**/*.ts`（报告相关）
- ✅ `src/app/api/user/**/*.ts`（用户信息）

**改动示例**（仅改数据访问层，业务逻辑不变）：

```typescript
// ❌ 替换前：src/app/api/archives/route.ts
import { store } from '@/lib/store'

export async function POST(request: Request) {
  // ...
  const archive = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: body.name,
    gender: body.gender,
    birthDate: body.birthDate,
    birthLocation: body.birthLocation,
    createdAt: new Date().toISOString()
  }
  store.archives.set(archive.id, archive)
  return Response.json(archive)
}

// ✅ 替换后
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  // ...
  const archive = await prisma.archive.create({
    data: {
      userId: user.id,
      name: body.name,
      gender: body.gender,
      birthDate: new Date(body.birthDate),
      birthLocation: body.birthLocation,
      birthCalendar: body.birthCalendar,
      birthTimeMode: body.birthTimeMode,
      birthTimeBranch: body.birthTimeBranch,
      lunarDate: body.lunarDate,
      isLeapMonth: body.isLeapMonth
    }
  })
  return Response.json(archive)
}
```

**批量替换清单**：
| 文件 | 改动行数 | 难度 |
|------|---------|------|
| `api/auth/send-code/route.ts` | ~10 行 | 简单 |
| `api/auth/verify-code/route.ts` | ~15 行 | 简单 |
| `api/archives/route.ts` | ~20 行 | 简单 |
| `api/report/generate/route.ts` | ~25 行 | 中等 |
| `api/report/[archiveId]/route.ts` | ~10 行 | 简单 |
| `api/report/status/[jobId]/route.ts` | ~5 行 | 简单 |
| `api/user/session/route.ts` | ~10 行 | 简单 |
| **总计** | **~100 行** | **2-3 小时** |

---

### Day 2 上午（3 小时）：Supabase Auth（可选，优先级低）

**判断**：当前自建验证码登录已经能用，可暂时保留

**如果要换成 Supabase Auth（Magic Link）**：
```typescript
// 1. 创建 src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 2. 替换登录逻辑（前端）
const supabase = createClient()
await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})

// 3. 创建回调路由 src/app/auth/callback/route.ts
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

**决策建议**：
- **Day 1 完成后先测试**，确保数据库迁移成功
- **如果自建登录有问题**（如邮件发送不稳定），再换 Supabase Auth
- **如果自建登录能用**，暂时保留（节省 3 小时）

---

### Day 2 下午（3 小时）：测试 + 部署

#### 1. 本地测试（1 小时）
```bash
# 启动开发服务器
npm run dev

# 完整流程测试：
# 1. 访问 http://localhost:3000
# 2. 登录（验证码在终端查看）
# 3. 填写出生信息（测试公历/农历、时辰/具体时间）
# 4. 创建档案（检查 Supabase Dashboard > Table Editor 是否有数据）
# 5. 生成主报告（观察进度动画）
# 6. 查看报告（检查 13 个 Section 是否正常显示）
# 7. 重启服务器，验证数据持久化（再次访问档案/报告）
```

#### 2. Vercel 部署（1 小时）
```bash
# 1. 在 Vercel Dashboard 创建项目
# 2. 关联 GitHub 仓库
# 3. 配置环境变量（同 .env.local）：
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://...
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# 4. 部署（自动触发）
git add .
git commit -m "feat: 迁移到 Supabase 数据库"
git push origin main

# 5. 等待构建完成（3-5 分钟）
# 6. 访问 Vercel 提供的 URL（如 lifecode.vercel.app）
```

#### 3. 生产环境测试（1 小时）
```bash
# 在 Vercel 部署的 URL 上重复本地测试流程
# 重点检查：
# - 登录是否正常
# - 数据是否持久化
# - LLM 是否能正常调用
# - 报告是否正常生成
```

---

## 📋 2 天迁移 Checklist

### Day 1（7 小时）
- [ ] **上午（3h）**
  - [ ] 创建 Supabase 项目（10min）
  - [ ] 配置环境变量（5min）
  - [ ] 安装依赖 + 运行迁移（20min）
  - [ ] 验证数据库连接（5min）
  - [ ] 创建 Prisma 客户端（10min）
  - [ ] ☕ 休息（10min）

- [ ] **下午（4h）**
  - [ ] 替换 `api/auth/**` 为 Prisma（30min）
  - [ ] 替换 `api/archives` 为 Prisma（30min）
  - [ ] 替换 `api/report/**` 为 Prisma（1h）
  - [ ] 替换 `api/user/**` 为 Prisma（30min）
  - [ ] 本地测试（1h）
  - [ ] ☕ 休息（30min）

### Day 2（6 小时）
- [ ] **上午（3h，可选）**
  - [ ] 实现 Supabase Auth（2h）
  - [ ] 测试 Magic Link 登录（30min）
  - [ ] ☕ 休息（30min）

- [ ] **下午（3h）**
  - [ ] 完整流程测试（1h）
  - [ ] Vercel 部署（1h）
  - [ ] 生产环境测试（1h）

---

## 🎯 迁移后立即可用的功能

### 核心功能（100% 可用）
- ✅ 用户登录（邮箱验证码 or Magic Link）
- ✅ 档案创建（数据持久化）
- ✅ 主报告生成（LLM + iztro）
- ✅ 报告展示（13 个 Section）
- ✅ 能量系统（扣除/充值）
- ✅ 交易记录（查询/创建）

### 额外获得的能力
- ✅ 数据持久化（重启不丢失）
- ✅ 多设备登录（Session 同步）
- ✅ 数据备份（Supabase 自动每日备份）
- ✅ SQL 查询（Dashboard > SQL Editor）
- ✅ 实时监控（Dashboard > Logs）
- ✅ API 日志（Dashboard > API Logs）

---

## 🔧 测试环境使用建议

### 1. 数据隔离（测试 vs 生产）

**方案 A：单项目 + 表前缀**（推荐，快速）
```sql
-- 测试表
CREATE TABLE test_archives (...);
CREATE TABLE test_users (...);

-- 生产表
CREATE TABLE prod_archives (...);
CREATE TABLE prod_users (...);
```

**方案 B：双项目**（标准，但成本翻倍）
```
Supabase 项目 1: lifecode-test（测试）
Supabase 项目 2: lifecode-prod（生产）
```

**当前阶段建议**：用方案 A（单项目），因为：
- 免费额度足够（500MB）
- 测试数据量很小（< 10MB）
- 可随时清空测试表（`DELETE FROM test_users`）

---

### 2. 测试数据管理

```sql
-- 在 Supabase Dashboard > SQL Editor 执行

-- 清空测试数据（保留表结构）
TRUNCATE TABLE archives CASCADE;
TRUNCATE TABLE main_reports CASCADE;
TRUNCATE TABLE report_jobs CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- 插入测试用户
INSERT INTO users (id, email, name, balance, created_at, updated_at)
VALUES 
  ('test-user-1', 'test1@lifecode.app', '测试用户1', 100, NOW(), NOW()),
  ('test-user-2', 'test2@lifecode.app', '测试用户2', 50, NOW(), NOW());

-- 查询统计
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'archives', COUNT(*) FROM archives
UNION ALL
SELECT 'main_reports', COUNT(*) FROM main_reports;
```

---

### 3. 监控与调试

**Dashboard 常用功能**：
| 位置 | 功能 | 用途 |
|------|------|------|
| **Table Editor** | 查看/编辑数据 | 验证数据是否正确写入 |
| **SQL Editor** | 执行 SQL | 批量清空、查询统计 |
| **API Logs** | 查看 API 请求 | 调试权限错误、性能问题 |
| **Database > Logs** | 查看 SQL 日志 | 定位慢查询 |
| **Auth > Users** | 管理用户 | 查看登录用户列表 |

---

## 💡 关键决策：是否迁移鉴权？

### 场景 A：保留自建验证码登录（推荐测试环境）

**理由**：
- ✅ 已经能用，无需改动
- ✅ 节省 3 小时开发时间
- ✅ 验证码在终端输出，方便测试

**改动量**：
- 数据访问层：`store` → `prisma`
- 其他逻辑：**完全不变**

**适用场景**：
- 测试环境
- 快速验证功能
- 团队内部使用

---

### 场景 B：迁移到 Supabase Auth（推荐生产环境）

**理由**：
- ✅ 更安全（JWT 自动刷新）
- ✅ 更专业（Magic Link 无需输入验证码）
- ✅ 更稳定（Supabase 邮件服务可靠）
- ✅ 更易扩展（支持社交登录、手机号登录）

**改动量**：
- 新增 Supabase 客户端
- 替换 `api/auth/**`
- 更新前端 Context
- 创建回调路由

**适用场景**：
- 生产环境
- 对外开放
- 需要多种登录方式

---

## 🚀 推荐策略：测试环境直接用 Supabase

### 阶段 1：快速启动（Day 1-2）
```
✅ Supabase 数据库（替代内存存储）
✅ 保留自建验证码登录
✅ Vercel 部署
✅ 基础测试
```

### 阶段 2：功能完善（Week 2-3）
```
✅ 迁移到 Supabase Auth（Magic Link）
✅ 添加 Row Level Security（权限控制）
✅ 实现 Realtime 推送（替代轮询）
✅ 深度测试
```

### 阶段 3：生产就绪（Week 4）
```
✅ 自定义邮件模板（中文化）
✅ 配置自定义域名
✅ 性能优化
✅ 监控告警
```

---

## 📊 时间对比

| 方案 | 开发时间 | 测试时间 | 总计 |
|------|---------|---------|------|
| **方案 A：完整迁移后再测试** | 1-2 周 | 3-5 天 | 2-3 周 |
| **方案 B：边测试边迁移**（推荐） | 2 天 | 边测边改 | **1 周** |

**时间节省**：60%

---

## ✅ 结论

### 当前最优方案：直接用 Supabase 做测试环境

**核心理由**：
1. **功能简单**：只有 5-6 个核心 API，迁移成本低
2. **测试需求**：需要数据持久化，内存存储无法满足
3. **时间效率**：2 天完成基础迁移，边测试边完善
4. **成本低**：免费额度足够测试使用
5. **平滑升级**：测试环境可直接升级为生产环境

**行动计划**：
- **Day 1**：数据库迁移（Prisma + Supabase PostgreSQL）
- **Day 2**：部署测试（Vercel + 完整流程验证）
- **Week 2+**：功能完善（Auth + Realtime + 优化）

**下一步**：
1. 创建 Supabase 项目（10 分钟）
2. 运行 Prisma 迁移（30 分钟）
3. 开始替换数据访问层（3-4 小时）

需要我提供具体的代码替换示例吗？
