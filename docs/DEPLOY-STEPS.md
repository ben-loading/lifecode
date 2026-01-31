# 从本地修改到部署的步骤

## 方式一：先提交再推送（推荐，代码进仓库）

### 1. 暂存并提交本地修改

```bash
cd /Users/bd/Documents/selfdev/lifecode

# 添加所有修改（含 proxy 迁移、Supabase 相关等）
git add -A

# 提交
git commit -m "chore: middleware 改为 proxy (Next.js 16) 及 Supabase Auth 相关"
```

### 2. 推送到 GitHub

```bash
git push origin main
```

若你的 Vercel 已连接该 GitHub 仓库，推送后会自动触发一次生产部署，无需再在 Vercel 里点部署。

### 3. 若 Vercel 未连 GitHub，改用 CLI 部署

```bash
npx vercel --prod
```

会用当前本地代码（含刚提交的）打一次生产部署。

---

## 方式二：不提交，直接用 CLI 部署当前目录

不执行 `git add` / `git commit`，直接：

```bash
cd /Users/bd/Documents/selfdev/lifecode
npx vercel --prod
```

Vercel 会打包当前工作区文件（含未提交的 `proxy.ts` 等）并部署。适合先快速验证，再决定是否提交。

---

## 小结

| 目的           | 做法                    |
|----------------|-------------------------|
| 代码进仓库并自动部署 | `git add -A` → `git commit` → `git push` |
| 只更新线上、先不提交 | `npx vercel --prod`     |

部署完成后，在 Vercel 的 Deployments 里可看最新一次部署状态和访问地址。
