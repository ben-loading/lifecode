# 半正式开发环境：本地 + Supabase + API

每次版本更新先在「半正式环境」跑通、方便 debug，再部署到线上。

---

## 1. 半正式环境是什么

| 部分 | 说明 |
|------|------|
| **本地** | 本机跑 Next.js（`npm run dev`），前端和 API 都在 localhost |
| **Supabase** | 连一个独立的「半正式」Supabase 项目（数据库 + Auth），与生产数据隔离 |
| **API** | 所有接口走本地 Next.js API（如 `http://localhost:3000/api/...`），不依赖 Vercel |

这样你可以：
- 在本地改代码、看日志、断点调试
- 用 Supabase 真实数据库和 Auth，行为接近线上
- 不污染生产数据，也不依赖线上部署

---

## 2. 一次性准备

### 2.1 建一个「半正式」Supabase 项目（推荐）

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → **New project**
2. 项目名例如：`lifecode-staging` 或 `lifecode-dev`
3. 创建完成后，在 **SQL Editor** 里依次执行：
   - `supabase/init.sql`
   - `supabase/migrations/002_supabase_auth_user.sql`
   - 若遇「Database error saving new user」再执行 `supabase/migrations/003_fix_new_user_trigger.sql`
4. 在 **Settings → API** 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`（仅本地用，不要提交）

### 2.2 配置本地环境

```bash
cp .env.local.example .env.local
```

在 `.env.local` 里填：

- 上面复制的三个 Supabase 变量（半正式项目）
- LLM 任选其一：`OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY`（主报告生成需要）
- 可选：`NODE_ENV=development` 方便看日志

不要提交 `.env.local`（已在 `.gitignore`）。

---

## 3. 日常开发流程（每次版本更新）

1. **拉最新代码**（若多人协作）
   ```bash
   git pull
   ```

2. **启动半正式环境**
   ```bash
   npm run dev
   ```
   - 前端：http://localhost:3000
   - API：http://localhost:3000/api/...

3. **在本地验证**
   - 登录、档案、主报告生成、报告页等走一遍
   - 看终端日志、Network、Supabase Dashboard 里的数据
   - 需要时用 `/api/debug/env`、`/api/debug/db` 等调试接口（仅开发时用）

4. **确认无误后再部署**
   - 提交 → 推送到 GitHub → Vercel 自动部署（或手动部署）
   - 线上环境用 Vercel 的 Environment Variables，指向**生产** Supabase 项目

---

## 4. 环境对照

| 项目 | 半正式（本地开发） | 生产（Vercel） |
|------|-------------------|-----------------|
| 前端 + API | localhost:3000 | 你的域名 |
| Supabase | 半正式项目（如 lifecode-staging） | 生产项目 |
| 配置来源 | `.env.local` | Vercel Environment Variables |
| 数据 | 可随意测试、清空 | 真实用户数据 |

---

## 5. 常见问题

- **改 .env.local 不生效**：改完保存后重启 `npm run dev`。
- **登录/验证码收不到**：检查 Supabase 半正式项目的 Auth → SMTP 是否配好（见 [docs/DEPLOYMENT.md](DEPLOYMENT.md)）。
- **API 报错**：先看终端日志；再访问 `/api/debug/env` 确认 Supabase / LLM 变量是否都有（不暴露具体 Key）。

这样每次版本更新都先在「本地 + Supabase 半正式 + 本地 API」跑通再上线，方便 debug。
