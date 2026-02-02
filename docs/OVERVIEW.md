# LifeCode 项目技术文档

**最后更新**: 2026-02-01

## 1. 项目定位、功能与核心业务流程

### 1.1 项目定位与核心价值
LifeCode 是一个基于紫微斗数与八字命理的智能命理解读平台，结合 `iztro` 库进行排盘计算和 LLM（大型语言模型，如 GPT-4o / DeepSeek）生成个性化报告。

**核心价值**：
- **精准排盘**：融合节气四柱八字与紫微斗数双核算法。
- **真太阳时校准**：基于地理位置对出生时间进行修正。
- **智能解读**：LLM 生成 13 个维度的个性化命理报告。
- **现代体验**：简约设计、流畅交互、实时进度反馈。

### 1.2 核心功能
- **用户系统**：邮箱验证码登录、能量管理（充值、兑换、邀请奖励）、交易记录。
- **档案管理**：创建、列表、选择用户个人档案，存储出生信息。
- **出生信息输入**：支持公历/农历、具体时间/时辰选择，包含真太阳时校准。
- **命盘展示**：紫微斗数命盘可视化。
- **主报告生成**：通过 LLM 生成 13 个维度的深度命理报告。
- **深度报告**：4 类深度报告（如事业、财富、情感、流年），需额外解锁。

### 1.3 核心业务流程

#### 主报告生成流程概述
用户在档案页创建档案并点击“开启解码”后，系统会执行一系列步骤来生成主报告，最终展示给用户。

```mermaid
graph TD
    A[用户在档案页点击"开启解码"] --> B{前端调用 /api/archives POST};
    B --> C{创建档案 (Archive)};
    C --> D{前端调用 /api/report/generate POST};
    D --> E{API扣除用户能量};
    E --> F{API创建报告任务 (ReportJob)};
    F --> G{API触发后台生成进程 (runReportJobInRequest)};
    G --> H{后台进程: 调用 iztro 计算命盘};
    H --> I{后台进程: 构建 LLM Prompt (System/User)};
    I --> J{后台进程: 调用 LLM API (OpenAI/DeepSeek)};
    J --> K{后台进程: Zod验证 LLM 输出};
    K --> L{后台进程: 保存主报告 (MainReport)};
    L --> M{后台进程: 更新任务状态为 "completed"};
    M --> N{前端轮询 /api/report/status/[jobId]};
    N --> O{轮询发现任务完成};
    O --> P{前端跳转至 /report?jobId=xxx&archiveId=yyy};
    P --> Q{前端获取主报告数据 (/api/report/[archiveId])};
    Q --> R{主报告页面展示报告内容};
```

**关键时机与触发器**：
-   **能量扣除**: 在 [src/app/api/report/generate/route.ts](src/app/api/report/generate/route.ts) 中，API 会在确认用户能量充足且非重试生成时，调用 `updateUserBalance(userId, -MAIN_REPORT_COST)` 扣除 `MAIN_REPORT_COST` (20 能量)。
-   **邀请奖励**: 在 [src/app/api/report/generate/route.ts](src/app/api/report/generate/route.ts) 的 `processInvitesOnMainReportComplete` 函数中，当被邀请用户的主报告成功生成后，会调用 `setInviteValid` 验证邀请，并为邀请人增加 `INVITE_REWARD` (20 能量)，有 `INVITE_MAX_COUNT` 上限。
-   **LLM 配置检查**: 在 [src/lib/services/llm-service.ts](src/lib/services/llm-service.ts) 中，`ensureLLMConfigured()` 会在 LLM 调用前被 `generate/route.ts` 调用，以防止在配置不完整时扣费并尝试生成。
-   **Job 状态更新**: `ReportJob` 的状态 (`pending`, `running`, `processing`, `completed`, `failed`) 在 `runReportJobInRequest` 进程中逐步更新，前端轮询这些状态以展示进度。
-   **真太阳时校准**: 在 [src/lib/birth-constants.ts](src/lib/birth-constants.ts) 中，结合出生地区经度与均时差 (Equation of Time) 对出生时间进行校准，确保命盘计算准确性。
-   **Zod 验证**: LLM 输出在 [src/lib/services/report-validator.ts](src/lib/services/report-validator.ts) 中通过 Zod Schema 进行验证，确保数据符合标准化字段定义。

### 1.4 产品结构与数据结构

#### 产品结构 (Next.js App Router)
-   **根路由**：`/` ([src/app/page.tsx](src/app/page.tsx) - 欢迎页)
-   **认证**：登录弹窗 ([src/components/login-modal.tsx](src/components/login-modal.tsx))
-   **输入页**：`/input` ([src/app/input/page.tsx](src/app/input/page.tsx) - 出生信息录入)
-   **档案页**：`/archive` ([src/app/archive/page.tsx](src/app/archive/page.tsx) - 档案备注，触发报告生成)
-   **报告页**：`/report` ([src/app/report/page.tsx](src/app/report/page.tsx) - 主报告展示，含分析动画)
-   **命盘页**：`/chart` ([src/app/chart/page.tsx](src/app/chart/page.tsx) - 紫微斗数排盘可视化)
-   **深度报告**：`/deep-reading` ([src/app/deep-reading/page.tsx](src/app/deep-reading/page.tsx)), `/deep-reading/career-path` 等 (深度报告列表与详情)
-   **用户中心**：`/history-reports` ([src/app/history-reports/page.tsx](src/app/history-reports/page.tsx) - 历史报告列表), `/task-center` ([src/app/task-center/page.tsx](src/app/task-center/page.tsx) - 任务中心)

#### 数据结构 (Supabase PostgreSQL)
核心表定义在 [supabase/init.sql](supabase/init.sql)。

-   `User` (用户表): `id`, `email`, `name`, `balance`, `inviteRef`, `createdAt`, `updatedAt`
-   `Archive` (档案表): `id`, `userId`, `name`, `gender`, `birthDate`, `birthLocation`, `birthCalendar`, `birthTimeMode`, `birthTimeBranch`, `lunarDate`, `isLeapMonth`, `createdAt`, `updatedAt`
-   `MainReport` (主报告表): `id`, `archiveId` (UNIQUE), `content` (JSONB), `lifeScriptTitle`, `baziDisplay`, `createdAt`, `updatedAt`
-   `DeepReport` (深度报告表): `id`, `archiveId`, `reportType`, `content` (JSONB), `createdAt`, `updatedAt`
-   `Transaction` (交易记录表): `id`, `userId`, `type` (`topup`/`consume`), `amount`, `description`, `createdAt`
-   `Invite` (邀请记录表): `id`, `inviterId`, `inviteeId`, `isValid`, `createdAt`
-   `RedemptionCode` (兑换码表): `code` (PRIMARY KEY), `amount`, `usedBy`, `usedAt`, `createdAt`
-   `ReportJob` (报告生成任务表): `id`, `archiveId`, `status` (`pending`/`running`/`processing`/`completed`/`failed`), `currentStep`, `totalSteps`, `stepLabel`, `error`, `completedAt`, `createdAt`, `updatedAt`

## 2. 依赖库、环境与第三方服务

### 2.1 前端依赖 ([package.json](package.json))
-   **框架**: `next` (16.1.6), `react` (19.2.3), `react-dom` (19.2.3)
-   **样式**: `tailwindcss` (4.1.9), `autoprefixer`, `postcss`, `clsx`, `tailwind-merge`, `tailwindcss-animate`
-   **UI 组件**: `@radix-ui/react-*` (各种 Radix UI primitives), `lucide-react` (Icons), `sonner` (Toasts), `vaul` (Dialogs), `input-otp` (OTP 输入)
-   **数据/日期**: `date-fns` (4.1.0), `react-day-picker`
-   **图表**: `recharts` (2.15.4)
-   **工具**: `zod` (3.25.76 - 验证), `@hookform/resolvers`, `react-hook-form`
-   **天文计算**: `iztro` (2.5.7 - 紫微斗数排盘)
-   **Vercel**: `@vercel/analytics` (1.3.1 - 部署分析)
-   **Supabase**: `@supabase/supabase-js`, `@supabase/ssr`

### 2.2 后端依赖 (Next.js API Routes, [package.json](package.json))
-   **框架**: `next` (16.1.6)
-   **Supabase**: `@supabase/supabase-js` (通过 `SUPABASE_SERVICE_ROLE_KEY` 与 DB 交互)
-   **LLM**: `openai` (6.17.0 - 支持 OpenAI 和 DeepSeek)
-   **工具**: `zod` (验证), `iztro` (命盘计算)

### 2.3 开发环境
-   **Node.js**: `^20` (推荐 20.19+ 或 22.12+，Prisma 7.x 要求 Node.js v20.19+，当前项目 v21.4.0 符合)
-   **TypeScript**: `^5`
-   **包管理器**: `npm`
-   **Linting**: `eslint`
-   **测试**: `tsx` (用于运行 `scripts/` 里的 TypeScript 工具)

### 2.4 第三方服务
-   **数据库与认证**: [Supabase](https://supabase.com) (PostgreSQL 数据库, Auth 服务)。
-   **部署**: [Vercel](https://vercel.com) (Frontend & Next.js API Routes)。
-   **LLM (AI)**: [OpenAI](https://openai.com) (GPT 模型) 或 [DeepSeek](https://platform.deepseek.com) (DeepSeek 模型)。通过环境变量 `LLM_PROVIDER`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY` 配置。
-   **SMTP (邮件发送)**: Supabase Auth 的邮件发送功能依赖外部 SMTP 服务商，推荐 [Resend](https://resend.com), [Brevo](https://app.brevo.com), [SendGrid](https://sendgrid.com) 或 AWS SES。

## 3. 前后端接口结构与配置项说明

### 3.1 前端 API 客户端 ([src/lib/api-client.ts](src/lib/api-client.ts))
所有前端请求通过统一的 `request` 函数封装，自动携带 `Authorization` token，处理 401 错误，并解析后端返回的错误信息。

**核心 API 列表**:
-   `sendCode(body: SendCodeBody)`: `POST /api/auth/send-code` - 发送邮箱验证码。
-   `login(body: LoginBody)`: `POST /api/auth/login` - 验证码登录。
-   `getSession()`: `GET /api/auth/session` - 获取当前用户 session (含基础用户信息)。
-   `getMe()`: `GET /api/users/me` - 获取当前用户完整信息。
-   `listArchives()`: `GET /api/archives` - 获取用户档案列表。
-   `createArchive(body: CreateArchiveBody)`: `POST /api/archives` - 创建档案。
-   `getArchive(archiveId: string)`: `GET /api/archives/[archiveId]` - 获取单个档案详情。
-   `createReportJob(body: CreateReportJobBody)`: `POST /api/report/generate` - 发起主报告生成任务（同步执行）。
-   `createReportJobRetry(archiveId: string)`: `POST /api/report/generate` - 重新生成主报告（不扣能量）。
-   `getReportJobStatus(jobId: string)`: `GET /api/report/status/[jobId]` - 获取报告任务状态。
-   `getMainReport(archiveId: string)`: `GET /api/report/[archiveId]` - 获取主报告内容。
-   `getReportArchiveStatus(archiveId: string)`: `GET /api/report/archive/[archiveId]/status` - 按档案 ID 查询报告或进行中任务。
-   `getBalance()`: `GET /api/energy/balance` - 获取用户能量余额。
-   `topup(amount: number)`: `POST /api/energy/topup` - 充值能量。
-   `redeemCode(code: string)`: `POST /api/energy/redeem` - 兑换码充值。
-   `unlockDeepReport(archiveId, reportType)`: `POST /api/report/deep/unlock` - 解锁深度报告。
-   `recordInvite(inviteRef)`: `POST /api/invite/record` - 记录邀请关系。

### 3.2 后端 API 路由 ([src/app/api/**/route.ts](src/app/api/report/generate/route.ts))
-   **`src/app/api/auth/*`**: 认证相关，包括发送验证码 (`send-code`), 登录 (`login`), 获取用户 session (`session`)。
-   **`src/app/api/archives/*`**: 档案相关，包括创建档案 (`/`) 和获取特定档案 (`/[id]`)。
-   **`src/app/api/report/generate/route.ts`**: **核心主报告生成接口**。接收 `archiveId` 和 `retry` 标志。扣费、创建 `ReportJob`，并同步执行 `runReportJobInRequest`（含 LLM 调用）。
    -   配置项：`maxDuration = 300` ([src/app/api/report/generate/route.ts](src/app/api/report/generate/route.ts) 中定义)。
-   **`src/app/api/report/[archiveId]/route.ts`**: 获取特定档案的主报告内容。
-   **`src/app/api/report/archive/[archiveId]/status/route.ts`**: 获取档案的报告状态（是否有报告、是否有进行中任务）。
-   **`src/app/api/report/job/[jobId]/route.ts`**: 更新报告任务状态（Worker 回写）。
-   **`src/app/api/report/status/[jobId]/route.ts`**: 获取报告任务的详细状态（供前端轮询）。
-   **`src/app/api/report/next-job/route.ts`**: **Worker 领取任务接口**（在采用外部 Worker 架构时使用）。
-   **`src/app/api/energy/*`**: 能量相关，包括余额 (`balance`), 充值 (`topup`), 兑换 (`redeem`)。
-   **`src/app/api/invite/record/route.ts`**: 记录邀请关系。
-   **`src/app/api/users/me/route.ts`**: 获取当前用户详细信息。
-   **`src/app/api/debug/*`**: 调试接口，用于查看环境变量 (`env`), 内存存储 (`store`), Supabase 连接 (`supabase`), 数据库状态 (`db`)。

### 3.3 配置项说明 ([.env.local.example](.env.local.example))

| 变量名 | 必填 | 说明 |
| :------------------------- | :--- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LLM_PROVIDER`             | 否   | LLM 厂商，可选 `openai` 或 `deepseek`。未填则自动检测：有 `DEEPSEEK_API_KEY` 用 DeepSeek，否则用 OpenAI。 |
| `OPENAI_API_KEY`           | 否   | OpenAI API Key。                                                                                                                                                                 |
| `DEEPSEEK_API_KEY`         | 否   | DeepSeek API Key。                                                                                                                                                               |
| `DATABASE_URL`             | 否   | PostgreSQL 连接字符串。**当前开发环境使用内存存储，此项可选。** 迁移到 PostgreSQL 时必填。                                                                                          |
| `NEXT_PUBLIC_SUPABASE_URL` | 是   | Supabase 项目 URL (前端和后端都会用，`NEXT_PUBLIC_` 前缀表示可暴露给前端)。                                                                                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是   | Supabase `anon` public key (前端用)。                                                                                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY` | 是   | Supabase `service_role` key (后端用，具有管理员权限，**绝不能暴露给前端**)。                                                                                                   |
| `REPORT_WORKER_SECRET`     | 否   | 仅在采用 **外部 Worker 架构** 时配置，用于保护 `next-job` 和 `PATCH job` 接口，与 Worker 环境中的值一致。                                                                               |
| `API_BASE_URL`             | 否   | 仅在采用 **外部 Worker 架构** 时配置，Worker 用于回调 Vercel 上的 Next.js API (如 `PATCH /api/report/job/[jobId]`)。                                                              |
| `REPORT_WORKER_POLL_MS`    | 否   | 仅在采用 **外部 Worker 架构** 时配置，Worker 轮询任务的间隔毫秒数，默认 10000。                                                                                                  |
| `NODE_ENV`                 | 否   | 运行环境，可设 `development` 开启详细日志。                                                                                                                                      |

## 4. 后端、数据库与服务部署

### 4.1 数据库 (Supabase PostgreSQL)
-   **服务商**: [Supabase](https://supabase.com)。
-   **初始化**: 通过 [supabase/init.sql](supabase/init.sql) 脚本在 Supabase SQL Editor 中执行，创建 `User`, `Archive`, `MainReport`, `DeepReport`, `Transaction`, `Invite`, `RedemptionCode`, `ReportJob` 等表。
-   **认证触发器**: [supabase/migrations/002_supabase_auth_user.sql](supabase/migrations/002_supabase_auth_user.sql) 用于在 Supabase Auth 创建新用户时，自动在 `User` 表中创建记录。[supabase/migrations/003_fix_new_user_trigger.sql](supabase/migrations/003_fix_new_user_trigger.sql) 修复可能出现的触发器问题。
-   **RLS (Row Level Security)**: 当前开发环境（内存存储模式）**未启用** RLS。迁移到生产环境 PostgreSQL 并启用 RLS 时需配合 Supabase Auth 策略。
-   **SMTP 配置**: Supabase Auth 的邮件发送功能需要配置自定义 SMTP 服务（如 Resend, Brevo 等），详细配置指南见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

### 4.2 后端服务 (Next.js API Routes)
-   **服务商**: [Vercel](https://vercel.com)。
-   **部署方式**: Next.js App Router 的 API Routes 会被 Vercel 部署为 Serverless Functions。
-   **长耗时任务**: 主报告生成涉及 LLM 调用，耗时约 100 秒。
    -   **当前方案 (推荐)**: Next.js API 路由 [src/app/api/report/generate/route.ts](src/app/api/report/generate/route.ts) 已配置 `maxDuration = 300`，允许函数最长执行 300 秒。这意味着 LLM 生成任务在**单个 API 请求内同步完成**。
    -   **备选方案 (外部 Worker)**: 若 Vercel 计划不满足 300 秒限制（如 Hobby 计划默认 60 秒），可部署独立 Worker 进程（如在 Railway/Render/自有 VPS 上运行 [scripts/worker-report.ts](scripts/worker-report.ts)）来异步执行 LLM 生成任务。详细部署指南见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。
-   **地区**: [vercel.json](vercel.json) 配置部署区域为 `sin1`。

## 5. 当前版本、进度、注意事项与剩余工作

### 5.1 当前版本与进度
-   **版本**: `0.1.0` (参见 [package.json](package.json))。
-   **Git HEAD**: 最新提交哈希 (请以实际 Git 仓库为准)。
-   **整体进度**: 主报告生成系统核心功能已完成，包括用户认证、档案管理、出生信息输入 (含真太阳时校准)、LLM 集成、报告生成与存储。前端 UI 针对各报告模块已适配，并优化了生成过程中的交互体验。详细已完成任务列表见 [docs/PROGRESS.md](docs/PROGRESS.md)。

### 5.2 注意事项 (此前多次反复修改的地方)
-   **Supabase SMTP 配置**: 邮件发送 (`Authentication failed`, `535 5.7.8`) 经常是由于 SMTP 凭据错误或发件人邮箱未经验证导致。务必确保 `Sender email` 与 SMTP 服务商中验证的域名/发件人一致。
-   **用户会话与创建**: 早期存在 `Error sending confirmation email`, `Failed to get user information` (`500`) 等问题。主要修复了 [src/lib/db.ts](src/lib/db.ts) 中 `createUser` 显式设置 `createdAt`/`updatedAt`，以及 [src/app/api/auth/session/route.ts](src/app/api/auth/session/route.ts) 支持 `Authorization: Bearer <token>`。
-   **档案/任务 ID 约束**: 数据库 `id` 字段的 `NOT NULL` 约束导致创建 `Archive` 或 `ReportJob` 失败，已通过在 [src/lib/db.ts](src/lib/db.ts) 中显式生成 UUID 并设置 `id` 解决。
-   **LLM 生成超时与前端体验**:
    -   最初尝试 API 立即返回 jobId、后台生成，但在 Vercel Serverless 环境下后台进程被终止，导致报告生成失败。
    -   已回退为 API `await` 整个生成过程 (`maxDuration = 300`)，确保报告能生成，但用户会在档案页等待 1-2 分钟。
    -   当前前端交互优化为：在档案页点击“开启解码”后，**立即收起表单，显示档案名称与“正在分析”文案，并分阶段淡入分析动画**，结束后自动跳转到报告页。
-   **报告页加载状态**:
    -   之前存在刷新后显示“KC小可爱”默认内容的问题，已通过 `reportBelongsToCurrentArchive` 判断和拉取档案名解决。
    -   修复了任务完成但报告未入库或请求超时导致页面卡在“加载报告中...”的问题，增加了超时机制和“重新生成”按钮。
    -   轮询任务状态的超时时间从 5 分钟调整为 **150 秒** ([src/app/report/page.tsx](src/app/report/page.tsx))。按档案 ID 拉取状态的请求超时设置为 **15 秒** ([src/app/report/page.tsx](src/app/report/page.tsx))。
-   **验证码位数**: 已将前端验证码输入框的校验和提示从 8 位改为 6 位 ([src/components/login-modal.tsx](src/components/login-modal.tsx))。
-   **移动端登录弹窗**: 修复了登录弹窗在移动端变形、内容溢出的问题，通过调整 `max-width` 和 flex 布局实现响应式 ([src/components/login-modal.tsx](src/components/login-modal.tsx))。

### 5.3 剩余开发工作 ([docs/PROGRESS.md](docs/PROGRESS.md) 中的“待办任务”部分)
-   **短期**:
    -   测试真实 LLM 调用 (配置 API Key 后进行完整流程测试)。
    -   前端展示 LLM 生成失败的友好提示 (已部分实现，仍可优化)。
-   **中期**:
    -   Node.js 版本升级 (推荐 20.19+ 或 22.12+，以支持 Prisma 7.x)。
    -   数据库迁移 (从内存存储切换到 PostgreSQL，运行 `npx prisma migrate dev` 并更新 `db.ts` 使用 Prisma Client)。
    -   Prompt 优化与测试。
    -   深度报告实现 (为 4 类深度报告创建 Prompt 模板和服务)。
-   **长期**:
    -   流式输出 (SSE/WebSocket)，实时展示 LLM 生成进度。
    -   缓存机制 (相同命盘数据避免重复调用 LLM)。
    -   多语言支持。
    -   监控与日志。

## 6. 安全说明
-   **API 密钥**: 绝不能硬编码在代码或提交到 Git 仓库。所有敏感密钥应存储在：
    -   本地开发：`.env.local` 文件 (已在 `.gitignore` 中忽略)。
    -   线上部署：Vercel Dashboard 的 Environment Variables 中，并确保勾选正确的环境 (如 Production)。
-   若密钥泄露，应立即在对应平台 (如 OpenAI, DeepSeek, Supabase) 撤销并重新生成，然后更新部署配置。
