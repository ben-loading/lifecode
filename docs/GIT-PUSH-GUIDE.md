# 无法 push 到 GitHub 的解决办法

当前远程是 **HTTPS**：`https://github.com/ben-loading/lifecode.git`  
GitHub 已不支持用「账号密码」推代码，需要用下面任一方式。

---

## 方式一：用 Personal Access Token（推荐，HTTPS）

1. **在 GitHub 创建 Token**
   - 打开 https://github.com/settings/tokens
   - 点 **Generate new token** → **Generate new token (classic)**
   - 勾选权限：**repo**
   - 生成后**复制 token**（只显示一次）

2. **在终端里 push**
   ```bash
   cd /Users/bd/Documents/selfdev/lifecode
   git push origin main
   ```
   - 用户名：填你的 **GitHub 用户名**
   - 密码：**不要填登录密码**，填刚才复制的 **Token**

3. （可选）让 Git 记住凭据，下次不用再输：
   ```bash
   git config --global credential.helper store
   ```
   再执行一次 `git push origin main`，输入一次用户名+Token 后会被保存。

---

## 方式二：改用 SSH

1. **看本机是否已有 SSH 公钥**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # 或
   cat ~/.ssh/id_rsa.pub
   ```
   没有的话生成一个：
   ```bash
   ssh-keygen -t ed25519 -C "你的邮箱" -N "" -f ~/.ssh/id_ed25519
   cat ~/.ssh/id_ed25519.pub
   ```

2. **把公钥加到 GitHub**
   - https://github.com/settings/keys → **New SSH key**
   - 把上面 `cat` 出来的内容粘贴进去，保存

3. **把远程改成 SSH 并推送**
   ```bash
   cd /Users/bd/Documents/selfdev/lifecode
   git remote set-url origin git@github.com:ben-loading/lifecode.git
   git push origin main
   ```

---

## 方式三：用 GitHub Desktop

1. 安装 [GitHub Desktop](https://desktop.github.com/)
2. 用 GitHub 账号登录
3. 选 **File → Add Local Repository**，选 `lifecode` 目录
4. 在界面里点 **Push origin** 即可（不用再输密码）

---

## 方式四：不 push，直接用 Vercel CLI 部署

不推 GitHub，只更新线上：

```bash
cd /Users/bd/Documents/selfdev/lifecode
npx vercel --prod
```

会用当前本地代码（含刚提交的修复）打一次生产部署，不依赖 GitHub。

---

推送成功后，若 Vercel 已连该仓库，会自动触发新部署。
