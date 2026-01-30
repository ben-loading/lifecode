## lifecode

`lifecode` 是一个用于承载你从 v0.app 生成的设计/高保真前端的 Next.js 项目（App Router + TypeScript + Tailwind）。

## 本地启动

在项目目录下运行：

```bash
cd lifecode
npm run dev
```

然后打开 `http://localhost:3000`。

## 外网分享：让其他人体验当前设计

两种方式，按需选择：

### 方式一：临时隧道（本机开着即可，适合演示）

本机运行 `npm run dev` 后，用 **ngrok** 把 3000 端口暴露到公网，得到一个 HTTPS 链接，发给对方即可。对方访问时走的是 ngrok 的服务器，不暴露你家/公司 IP，相对安全。

1. 安装 ngrok：<https://ngrok.com/download>（或 `brew install ngrok`）
2. 本机先启动项目：
   ```bash
   cd lifecode
   npm run dev
   ```
3. 新开一个终端，执行：
   ```bash
   ngrok http 3000
   ```
4. 终端里会显示类似 `https://xxxx-xx-xx-xx.ngrok-free.app` 的地址，复制发给对方即可。

注意：免费版每次重启 ngrok 链接会变；本机需保持 `npm run dev` 和 ngrok 都在运行。

### 方式二：部署到 Vercel（推荐，长期分享）

把项目部署到 Vercel，会得到一个固定 URL（如 `lifecode-xxx.vercel.app`），任何人随时可访问，不依赖你本机是否开机。

1. 把代码推到 GitHub（新建仓库后 `git push`）。
2. 打开 <https://vercel.com>，用 GitHub 登录。
3. 点击 **Add New → Project**，选择你的仓库（例如 `lifecode`）。
4. 根目录保持为项目根（含 `package.json` 的目录），直接点 **Deploy**。
5. 部署完成后，Vercel 会给你一个 **Production URL**，例如 `https://lifecode-xxx.vercel.app`，把这个链接发给别人即可。

若项目在子目录（例如仓库根是 `selfdev`、Next 项目在 `lifecode`），在 Vercel 里把 **Root Directory** 设为 `lifecode` 再部署。

---

- **只想临时给人看几眼**：用方式一（ngrok）。
- **希望别人随时能打开、链接固定**：用方式二（Vercel）。

## 网站无法重启 / 启动失败

若 `npm run dev` 或 `npm start` 无法启动，按下面顺序排查：

1. **先安装依赖**（若从未安装或报错）  
   在项目根目录执行：
   ```bash
   cd lifecode
   npm install
   ```
   若出现 `CERT_HAS_EXPIRED` 或淘宝源错误，说明当前 npm 源证书有问题。本项目已配置 `.npmrc` 使用 `https://registry.npmmirror.com`，在项目内执行 `npm install` 会优先用该源。若仍失败，可手动指定源再安装：
   ```bash
   npm install --registry https://registry.npmmirror.com
   ```
   或使用官方源：
   ```bash
   npm install --registry https://registry.npmjs.org/
   ```

2. **端口被占用**  
   若提示端口 3000 已被占用，可换端口启动：
   ```bash
   npm run dev -- -p 3001
   ```
   然后访问 `http://localhost:3001`。

3. **构建报错（如 `Can't resolve 'iztro'`）**  
   说明依赖未装全，先完成第 1 步的 `npm install`，再执行 `npm run dev` 或 `npm run build`。

4. **重启步骤**  
   停止当前进程（终端里 Ctrl+C），再执行：
   ```bash
   npm run dev
   ```

## 放置 v0.app 导出代码的推荐方式

v0.app 通常会导出若干 `components` 以及一个页面（或多个页面）。在本项目里建议这样放：

- **页面路由**：放到 `src/app/**/page.tsx`
  - 例如：`src/app/(marketing)/landing/page.tsx`
- **复用组件**：放到 `src/components/**`
  - 例如：`src/components/hero.tsx`
- **静态资源**：放到 `public/`
  - 例如：`public/images/...`

如果 v0 导出里使用了相对导入路径（如 `@/components/...`），本项目已配置别名 `@/*` 指向 `src/*`。

## 构建与检查

```bash
npm run build
npm run lint
```

## 目录结构（关键部分）

```
lifecode/
  src/
    app/                # Next.js 路由（App Router）
    components/         # 建议你把 v0 的组件放这里（可自行创建）
  public/               # 静态资源
```

需要我帮你把 v0.app 导出的代码“落盘并跑起来”的话，把导出的 zip/文件夹放进来（或贴出文件结构），我可以直接帮你接线到 `src/app`、修正路径/依赖并确保能启动。
