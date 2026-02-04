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

### 3. 业务用户创建方式（治本 vs 治标）

**推荐（治本）**：不在「发送验证码」时写 `public."User"`，避免「Database error saving new user」。
- **新项目**：不要执行 `002_supabase_auth_user.sql`。业务用户由应用在用户**输入验证码完成登录后、首次请求**（getSession 或任意需登录 API）时创建，见 `session/route.ts` 与 `auth-server.ts`。
- **已执行过 002 的项目**：在 SQL Editor 执行 `supabase/migrations/006_remove_auth_user_trigger.sql`，移除触发器即可治本。

**治标（保留触发器）**：若仍希望「auth 注册时自动插 User」。
- 执行 `002_supabase_auth_user.sql`；若出现「Database error saving new user」，再执行 `003_fix_new_user_trigger.sql`，必要时 `005_rls_allow_trigger_insert.sql`。

### 4. Supabase Auth 配置
在 Supabase Dashboard → Authentication → Providers → Email：
- 启用 Email 提供商
- 可选：自定义邮件模板，将 Magic Link 改为 6 位验证码（在模板中使用 `{{ .Token }}`）

### 5. 自定义 SMTP（推荐生产环境）
默认 SMTP 仅限团队邮箱、约 2 条/小时，不适合正式环境。使用自定义 SMTP 可发任意邮箱、提高送达率。

**入口**：Supabase Dashboard → **Authentication** → **SMTP**（或 Project Settings → Auth → SMTP）

**Sender email address 如何使之有效**：

- **含义**：发件人邮箱（From），用户收到的验证码邮件会显示「来自」这个地址。服务商只允许从「已验证」的发件人发送，否则会拒发或进垃圾箱。
- **两种用法**：
  1. **测试 / 快速开通**：用服务商提供的测试发件人（如 Resend 的 `onboarding@resend.dev`），无需域名，注册后即可在 Supabase 里填该地址。
  2. **正式环境**：用你自己的域名，例如 `no-reply@你的域名.com`。在服务商后台添加该域名，按提示在域名 DNS 里添加 MX / DKIM 等记录，验证通过后即可在 Supabase 的 Sender email 里填 `no-reply@你的域名.com`。
- **注意**：Sender email 必须与你在该服务商里验证过的域名或测试发件人一致，否则会报错或发不出去。

**必填项**（从邮件服务商获取）：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| **Sender email** | 发件人邮箱（From） | `no-reply@yourdomain.com` |
| **Sender name** | 发件人名称 | `人生解码` |
| **Host** | SMTP 服务器地址 | `smtp.resend.com` |
| **Port** | 端口（TLS 常用 587） | `587` |
| **Username** | SMTP 登录用户名 | 服务商提供的用户名或 API Key |
| **Password** | SMTP 密码或 API Key | 服务商提供的密钥 |

**推荐服务商与设置**：

| 服务商 | 免费额度 | 特点 | 适合 |
|--------|----------|------|------|
| **Resend** | 3,000 条/月 | 配置简单、文档好、Supabase 官方示例多 | 首选，小项目/起步 |
| **Brevo** | 300 条/天 | 免费额度大、有中文 | 不想付费时 |
| **SendGrid** | 100 条/天 | 老牌、稳定 | 已有 Twilio 或需企业级 |
| **AWS SES** | 62,000 条/月（从 EC2 发） | 便宜、需 AWS 账号 | 已有 AWS、量大 |

---

**1. Resend（推荐）**

1. 注册 [resend.com](https://resend.com)，进入 **API Keys** 创建 Key，复制保存。
2. **Domains** 里添加你的发信域名（如 `yourdomain.com`），按提示添加 MX/DKIM 等 DNS 记录；测试阶段可用 Resend 提供的 `onboarding@resend.dev` 等受限域名。
3. 在 Supabase SMTP 中填写：
   - **Sender email**：`onboarding@resend.dev`（测试）或 `no-reply@你的域名.com`
   - **Sender name**：`人生解码`
   - **Host**：`smtp.resend.com`
   - **Port**：`465` 或 `587`
   - **Username**：`resend`（固定）
   - **Password**：粘贴你的 **Resend API Key**
4. 保存后发送测试邮件验证。

**2. Brevo（免费额度大）**

**Brevo 如何创建发件人**：

1. 登录 [Brevo](https://app.brevo.com) → 右上角头像下拉 → **设置** → **发件人、域名、IP** → **发件人**。
2. 点击 **添加发件人**。
3. 填写 **发件人名称**（From name）：如 `人生解码`。
4. 填写 **发件人邮箱**（From email）：如 `no-reply@你的域名.com`，或你已有的邮箱（如 Gmail，但建议用自己域名）。
5. 点击 **保存**。
6. **验证发件人**（二选一）：
   - **方式 A**：若填的是你自己的邮箱，Brevo 会往该邮箱发一封 6 位验证码，到邮箱里抄码填回 Brevo，点 **验证发件人** 即可。
   - **方式 B（推荐）**：先做 **域名认证**：**设置** → **发件人、域名、IP** → **域名** → 添加你的域名，按提示在 DNS 里添加 MX/DKIM 等记录；认证通过后，使用该域名的发件人（如 `no-reply@你的域名.com`）会自动视为已验证，无需再收验证码。

**Supabase SMTP 填写**：

1. **设置** → **SMTP & API** → **SMTP** 标签 → **生成新的 SMTP 密钥**，命名后生成并复制密钥（只显示一次）。
2. 在 Supabase SMTP 中填写：
   - **Sender email**：你在 Brevo 里创建并验证过的发件人邮箱（同上）
   - **Sender name**：`人生解码`
   - **Host**：`smtp-relay.brevo.com`
   - **Port**：`587`
   - **Username**：Brevo 里显示的 **SMTP 登录邮箱**（通常是你的 Brevo 账号邮箱或发件人邮箱，在 SMTP 页面可见）
   - **Password**：刚才复制的 **SMTP 密钥**（不是账号密码）
3. 保存后发送测试邮件验证。

**3. SendGrid**

1. 注册 [sendgrid.com](https://sendgrid.com)，**Settings** → **API Keys** 创建 API Key（需 Mail Send 权限）。
2. 在 Supabase SMTP 中填写：
   - **Sender email**：在 SendGrid 中验证过的发件人邮箱
   - **Sender name**：`人生解码`
   - **Host**：`smtp.sendgrid.net`
   - **Port**：`587`
   - **Username**：固定填 `apikey`
   - **Password**：粘贴你的 **SendGrid API Key**
3. 保存后发送测试邮件验证。

---

保存后，Auth 邮件（验证码、Magic Link 等）会通过该 SMTP 发送。可在 **Authentication → Rate Limits** 调整每小时发送上限（默认约 30 条/小时）。

### 6. 验证表结构
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

# LLM 配置（用于前端预检；实际生成在 Worker 环境）
vercel env add DEEPSEEK_API_KEY
vercel env add LLM_PROVIDER

# 主报告 Worker 鉴权（仅在使用外部 Worker 时配置）
# vercel env add REPORT_WORKER_SECRET
```

**环境变量值**（从 Supabase Dashboard、.env.local 等处获取，**切勿将真实密钥写入文档或提交到仓库**）：

| 变量名 | 说明 |
|--------|-----|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 项目 URL（Dashboard → Settings → API） |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon public key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service_role key（保密） |
| DATABASE_URL | PostgreSQL 连接串（Supabase → Settings → Database） |
| DEEPSEEK_API_KEY | DeepSeek API Key（https://platform.deepseek.com） |
| LLM_PROVIDER | `deepseek` |
| REPORT_WORKER_SECRET | 仅在使用外部 Worker 时配置，与 Worker 环境中的值一致 |

**主报告生成依赖**：线上环境要能生成主报告，必须在 Vercel 中配置 **DEEPSEEK_API_KEY** 和 **LLM_PROVIDER**（值为 `deepseek`），并重新部署。未配置时点击「开启解码」会返回 503 并提示未配置 LLM。  
**超时与两种方案**：主报告 LLM 约 100 秒。  
- **推荐（简单）**：Vercel 开启 **Fluid Compute**（默认开启）时，函数最长可跑 300 秒；或使用 **Pro 计划** 可设 `maxDuration` 最高 300 秒。当前接口已设 `maxDuration = 300`，**同请求内完成生成，无需部署 Worker**。  
- **可选**：若你关闭了 Fluid Compute 且为 Hobby 计划（函数最多 60s），可改用 **外部 Worker** 方案，见下文「主报告 Worker 部署（可选）」。

### 4. 部署项目
```bash
cd /Users/bd/Documents/selfdev/lifecode
vercel --prod
```

### 5. 访问测试
部署完成后，Vercel 会提供访问链接，如：
- https://lifecode-xxx.vercel.app

### 6. 检查线上环境变量是否生效
部署后若登录、主报告等异常，可先确认服务端是否能看到环境变量：

1. 在浏览器打开：**https://你的域名.vercel.app/api/debug/env**
2. 页面会返回 JSON，包含：
   - **env**：各变量是否已设置（true/false，不显示具体值）
   - **summary.supabase**：Supabase 是否已配置
   - **summary.llm**：LLM 是否已配置、主报告能否生成
3. 若某项为 **false** 或 **LLM 未配置**：到 Vercel → 项目 → **Settings** → **Environment Variables** 检查是否添加、是否勾选 **Production**，保存后必须点 **Redeploy** 重新部署才会生效。

也可访问 **/api/debug/supabase** 检查 Supabase 连接是否正常。

---

### 主报告 Worker 部署（可选，仅在不满足 300s 时限时使用）

若 Vercel 未开启 Fluid Compute 且为 Hobby 计划（函数最多 60s），主报告可能超时，可改用 **独立 Worker 进程** 轮询领任务、本地执行生成并回写状态。  
若已开启 Fluid Compute（默认）或使用 Pro 并设 `maxDuration = 300`，**无需部署 Worker**。

1. **在 Vercel 中配置**  
   - 环境变量 **REPORT_WORKER_SECRET**（随机字符串，与 Worker 环境中的值一致），用于保护 `GET /api/report/next-job` 和 `PATCH /api/report/job/[jobId]`。

2. **部署 Worker 进程**（任选其一）  
   - **Railway**：见下文「Railway 部署主报告 Worker」分步说明。  
   - **Render / Fly.io**：新建服务，从本仓库拉取代码，启动命令：`npx tsx scripts/worker-report.ts`，并配置下方环境变量。  
   - **自有 VPS**：在项目根目录执行 `npx tsx scripts/worker-report.ts`（或 `node dist/worker-report.js` 若先构建），用 systemd / pm2 等保活。

3. **Worker 环境变量**（与 .env.local 中 Supabase、LLM 一致，另加两项）：

   | 变量名 | 说明 |
   |--------|-----|
   | API_BASE_URL | 前端/API 域名，如 `https://lifecode-xxx.vercel.app`（末尾不要 `/`) |
   | REPORT_WORKER_SECRET | 与 Vercel 中 REPORT_WORKER_SECRET 相同 |
   | NEXT_PUBLIC_SUPABASE_URL | Supabase 项目 URL |
   | SUPABASE_SERVICE_ROLE_KEY | Supabase service_role key |
   | DEEPSEEK_API_KEY（或 OPENAI_API_KEY） | LLM API Key |
   | LLM_PROVIDER | `deepseek`（或 `openai`） |
   | REPORT_WORKER_POLL_MS | 可选，轮询间隔毫秒，默认 10000 |

4. **验证**  
   - 用户在前端点击「开启解码」后，应得到 `jobId` 并进入报告页轮询状态。  
   - Worker 日志中应出现 `[worker] claimed job ...`、`[worker] completed job ...`。  
   - 若长时间无任务被领取，检查 Vercel 与 Worker 的 REPORT_WORKER_SECRET 是否一致、API_BASE_URL 是否可访问。

---

### Railway 部署主报告 Worker（分步）

1. **登录 Railway**  
   打开 [railway.app](https://railway.app)，用 GitHub 登录。

2. **新建项目并接入仓库**  
   - 点击 **New Project**。  
   - 选 **Deploy from GitHub repo**，授权后选择你的 **lifecode** 仓库（与 Vercel 部署的是同一仓库即可）。  
   - Railway 会为该仓库创建一个 **Service**，默认可能是 Next.js 的 `npm run build` + `npm start`。

3. **改成 Worker 服务（不跑 Next）**  
   - 进入该 Service → **Settings** → **Deploy**。  
   - **Build Command**：可留空或填 `npm install`（只装依赖，不构建 Next）。  
   - **Start Command**：改为  
     ```bash
     npx tsx scripts/worker-report.ts
     ```  
   - **Root Directory**：若仓库根目录就是 lifecode 项目，留空；若项目在子目录，填该子目录（如 `lifecode`）。  
   - 保存。

4. **配置环境变量**  
   - 同一 Service 里打开 **Variables**。  
   - 点击 **+ New Variable** 或 **RAW Editor**，添加（值从 Vercel / Supabase / .env.local 复制，不要写进文档）：

   | 变量名 | 必填 | 说明 |
   |--------|------|-----|
   | `API_BASE_URL` | 是 | Vercel 站点地址，如 `https://lifecode-xxx.vercel.app`（末尾不要 `/`) |
   | `REPORT_WORKER_SECRET` | 是 | 与 Vercel 里 `REPORT_WORKER_SECRET` **完全一致** |
   | `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | 是 | Supabase service_role key |
   | `DEEPSEEK_API_KEY` | 是* | DeepSeek API Key（用 DeepSeek 时必填） |
   | `LLM_PROVIDER` | 是 | `deepseek` 或 `openai` |
   | `OPENAI_API_KEY` | 否* | 若 `LLM_PROVIDER=openai` 则必填 |
   | `REPORT_WORKER_POLL_MS` | 否 | 轮询间隔毫秒，默认 10000 |

   \* 二选一：DeepSeek 填 `DEEPSEEK_API_KEY` + `LLM_PROVIDER=deepseek`；OpenAI 填 `OPENAI_API_KEY` + `LLM_PROVIDER=openai`。

5. **部署与看日志**  
   - **Deployments** 里会触发一次部署；若未自动部署，可点 **Deploy**。  
   - 部署完成后打开 **Deployments** → 最新部署 → **View Logs**。  
   - 正常应看到：`[worker] started, polling ... every 10000 ms`；有用户发起主报告时会看到 `[worker] claimed job ...`、`[worker] completed job ...`。

6. **常见问题**  
   - **启动报错缺少模块**：确认 Start Command 是 `npx tsx scripts/worker-report.ts`，且仓库根目录有 `package.json` 和 `scripts/worker-report.ts`。  
   - **一直不领任务**：检查 `API_BASE_URL` 是否能在公网访问、`REPORT_WORKER_SECRET` 与 Vercel 是否一字不差。  
   - **生成失败**：看日志里的 `[worker] job failed` 后面错误信息，多半是 LLM Key 或 Supabase 配置问题。

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

### 本地运行主报告 Worker（可选）
若希望本地 Next 只创建任务、由本机 Worker 执行 LLM 生成，可在项目根目录另开终端：

```bash
API_BASE_URL=http://localhost:3000 REPORT_WORKER_SECRET=与.env.local中一致 npx tsx scripts/worker-report.ts
```

需在 .env.local 中配置 REPORT_WORKER_SECRET，且 Vercel/本地 Next 的 `/api/report/next-job` 使用同一密钥鉴权。

---

## 四、安全说明

- **API 密钥只存在于服务器 / 环境变量**，不要写入代码或文档
- 本地：`.env.local`（已在 .gitignore，不会被提交）
- 线上：Vercel Dashboard → Settings → Environment Variables
- 若密钥已泄露：立即在对应平台撤销并重新生成，再更新 Vercel 与本地配置

---

## 五、注意事项

### 当前架构
- **数据存储**：Supabase PostgreSQL（`src/lib/db.ts`）
- **认证**：Supabase Auth（邮箱 OTP 验证码）

### 测试用户
- 任意邮箱登录
- 验证码在终端输出查看：`[mock] send-code for xxx@xxx.com: 123456`
- 测试兑换码：`DEMO50`（50 能量）、`TEST100`（100 能量）
