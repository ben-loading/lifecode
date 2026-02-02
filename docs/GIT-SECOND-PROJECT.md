# 如何另建一个「脱敏」项目（不影响当前开发）

当你想删掉部分信息（如内部文档、敏感配置示例）再分享给其他人或单独开源，又不影响当前继续开发时，可以另建一个独立项目。下面是两种常用做法。

---

## 方式一：新仓库 + 复制一份代码（推荐）

**思路**：当前目录继续开发；再复制一份到新文件夹，在新副本里删改后推送到新仓库。

### 步骤

1. **在 GitHub 上新建一个空仓库**
   - 例如：`lifecode-public` 或 `lifecode-share`
   - 不要勾选「Add a README」，保持空仓库。

2. **复制当前项目到新目录（不要用 `git clone`，避免带原仓库历史）**
   ```bash
   # 在 selfdev 上一级或任意位置
   cp -R /Users/bd/Documents/selfdev/lifecode /Users/bd/Documents/selfdev/lifecode-public
   cd /Users/bd/Documents/selfdev/lifecode-public
   ```

3. **删掉复制出来的 .git，重新初始化为新仓库**
   ```bash
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit (cleaned for sharing)"
   ```

4. **在复制出来的目录里删掉你不想对外的内容**
   - 例如：删掉或改写 `docs/` 里部分文档、清理 `.env.local.example` 里的示例 Key、删内部计划/笔记等。
   - `.env*` 本来就在 `.gitignore` 里，只要不 `git add -f .env.local` 就不会被提交。

5. **关联新仓库并推送**
   ```bash
   git remote add origin https://github.com/你的用户名/lifecode-public.git
   git branch -M main
   git push -u origin main
   ```

之后：
- **当前项目**：`/Users/bd/Documents/selfdev/lifecode` 照常开发、推送到原来的 `origin`。
- **脱敏项目**：`/Users/bd/Documents/selfdev/lifecode-public` 只在需要时改一改、再 `git push` 到新仓库；两边互不影响。

---

## 方式二：同一仓库多分支（适合「公开分支」与「私有分支」）

**思路**：一个仓库，两个长期分支：例如 `main`（或 `private`）继续开发，`public` 专门用来放脱敏后的版本。

### 步骤

1. **在当前仓库里新建并切到「公开」分支**
   ```bash
   cd /Users/bd/Documents/selfdev/lifecode
   git checkout -b public
   ```

2. **在 `public` 分支上删改要脱敏的内容**
   - 删文件或改文档、示例配置等，然后提交。

3. **推送 `public` 分支**
   ```bash
   git push -u origin public
   ```

4. **切回主分支继续开发**
   ```bash
   git checkout main
   ```

之后：
- 日常在 `main` 开发、推送 `main`。
- 需要更新「对外版本」时：`git checkout public` → 从 `main` 合并或 cherry-pick 需要的提交 → 再删改敏感内容 → 提交并 `git push origin public`。

若你希望「脱敏版」在另一个 GitHub 仓库里显示，可以在 GitHub 上再建一个空仓库，然后给当前仓库加第二个 remote，只推送 `public` 分支到那个仓库：

```bash
git remote add public-repo https://github.com/你的用户名/lifecode-public.git
git push public-repo public:main
```

---

## 建议

- **只想多一个可分享/开源的副本**：用 **方式一**，简单、两边完全独立，不会误把敏感提交推到公开历史。
- **想在一个仓库里区分「内部分支」和「对外分支」**：用 **方式二**。

脱敏时建议至少检查：
- 所有 `.env*` 未提交（已在 `.gitignore`）。
- `.env.local.example` 里没有真实 Key，只有占位符。
- 内部文档、计划、截图里没有密钥、内部链接、真实项目 ID 等。
