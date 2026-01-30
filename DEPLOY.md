# 方式二：部署到 Vercel，让外网安全访问

按下面顺序操作即可得到固定链接（如 `https://lifecode-xxx.vercel.app`），发给别人随时可体验。

---

## 第一步：把项目推到 GitHub

### 1.1 在 GitHub 上新建仓库

- 打开 <https://github.com/new>
- **Repository name** 填：`lifecode`（或任意名称）
- 选 **Public**，不要勾选 “Add a README”
- 点 **Create repository**

### 1.2 在本机执行（在 `lifecode` 目录下）

在终端执行（把 `YOUR_USERNAME` 换成你的 GitHub 用户名）：

```bash
cd /Users/bd/Documents/selfdev/lifecode

# 若尚未初始化 git
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "chore: prepare for Vercel deploy"

# 添加远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/lifecode.git

# 推送到 main（若本地是 master 则先：git branch -M main）
git branch -M main
git push -u origin main
```

若仓库已存在且已有 `origin`，只需：

```bash
cd /Users/bd/Documents/selfdev/lifecode
git add .
git commit -m "chore: update for deploy"  # 如有变更
git push
```

---

## 第二步：在 Vercel 部署

### 2.1 导入项目

- 打开 <https://vercel.com>，用 **GitHub 账号登录**
- 点击 **Add New…** → **Project**
- 在列表里选择刚推送的 **lifecode** 仓库，点 **Import**

### 2.2 配置（一般不用改）

- **Framework Preset**：自动识别为 Next.js，保持默认
- **Root Directory**：保持默认 **空**（因为仓库根就是 `lifecode` 项目根）
- **Build Command**：`npm run build`（默认）
- **Output Directory**：默认（Next.js 自动）
- 若有环境变量再在 **Environment Variables** 里添加

### 2.3 部署

- 点击 **Deploy**
- 等 1～2 分钟，完成后会显示 **Visit** 和一个链接，例如：  
  `https://lifecode-xxx.vercel.app`

把这个链接发给别人即可访问；之后每次 `git push` 到该仓库，Vercel 会自动重新部署。

---

## 若仓库根目录不是 lifecode（例如整份 selfdev 一起推）

- 在 Vercel 导入时，把 **Root Directory** 设为 **lifecode**
- 再点 Deploy，其余同上

---

## 常见问题

- **构建失败**：在本地先执行 `npm run build`，按报错修好再推送。
- **依赖缺失**：确保 `package.json` 里依赖完整，Vercel 会执行 `npm install`。
- **换域名**：在 Vercel 项目里 **Settings → Domains** 可绑定自己的域名。
