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
若出现 **「Database error saving new user」**，再执行 `supabase/migrations/003_fix_new_user_trigger.sql` 修复触发器。

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

# LLM 配置
vercel env add DEEPSEEK_API_KEY
vercel env add LLM_PROVIDER
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

**主报告生成依赖**：线上环境要能生成主报告，必须在 Vercel 中配置 **DEEPSEEK_API_KEY** 和 **LLM_PROVIDER**（值为 `deepseek`），并重新部署。未配置时点击「开启解码」会返回 503 并提示未配置 LLM。  
**超时说明**：主报告生成约需 50 秒以上，Vercel Hobby 计划函数超时 10 秒，可能导致任务被中断；Pro 计划 60 秒。  
**先排查再决定是否升级 Pro**：部署后在 Vercel → Logs 中搜索 `[report-dbg]`。若能看到「后台任务已启动」但没有任何「tick step=1」或「开始调用 LLM」→ 多半是返回响应后后台被终止（需改为同请求内 await 或升级 Pro）；若能看到「Generation failed」→ 是生成失败，看后面的错误信息排查 LLM/解析/DB。

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
