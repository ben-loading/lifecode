# Stripe 密钥获取详细步骤（图文说明）

## 一、注册 Stripe 账号

1. 访问 https://stripe.com
2. 点击右上角 **Sign in**（已有账号）或 **Start now**（注册新账号）
3. 填写邮箱、密码等信息完成注册
4. 验证邮箱（会收到验证邮件）

## 二、获取 API 密钥

### 方法一：从 Dashboard 首页快速获取

1. 登录后进入 Dashboard 首页
2. 在页面右侧找到 **Get your API keys** 卡片
3. 可以看到：
   - **Publishable key**：直接显示，格式 `pk_test_...`
   - **Secret key**：点击 **Reveal test key** 显示，格式 `sk_test_...`

### 方法二：从开发者菜单获取（推荐）

1. 点击左侧菜单的 **Developers**（开发者）
2. 选择 **API keys**
3. 页面会显示：

```
┌─────────────────────────────────────┐
│  Publishable key                    │
│  pk_test_51AbCdEf...                │  ← 复制这个
│  [Copy]                             │
├─────────────────────────────────────┤
│  Secret key                         │
│  [Reveal test key]                  │  ← 点击显示
│  sk_test_51AbCdEf...                │  ← 复制这个
└─────────────────────────────────────┘
```

## 三、获取 Webhook 签名密钥

### 步骤 1：创建 Webhook Endpoint

1. 在 Dashboard 左侧菜单，点击 **Developers → Webhooks**
2. 点击右上角 **Add endpoint**（添加端点）

### 步骤 2：配置 Webhook

填写表单：

- **Endpoint URL**: 
  ```
  https://你的域名.vercel.app/api/payment/webhook
  ```
  例如：`https://lifecode-xi.vercel.app/api/payment/webhook`

- **Description**（可选）:
  ```
  Lifecode Payment Webhook
  ```

### 步骤 3：选择事件

在 "Events to listen to" 部分：

1. 选择 **Select events**
2. 在搜索框输入 `checkout.session.completed`
3. 勾选 `checkout.session.completed` 事件
4. 点击 **Add events**

### 步骤 4：创建并获取签名密钥

1. 点击页面底部的 **Add endpoint** 按钮
2. 创建成功后，会跳转到该 webhook 的详情页
3. 在页面中找到 **Signing secret** 部分
4. 点击 **Reveal** 或 **Click to reveal** 按钮
5. 复制显示的密钥（格式：`whsec_...`）

## 四、配置到项目

### 本地开发（.env.local）

创建或编辑 `.env.local` 文件，添加：

```bash
# Stripe 配置
STRIPE_SECRET_KEY=sk_test_你的密钥
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_你的密钥
STRIPE_WEBHOOK_SECRET=whsec_你的webhook密钥
```

### 生产环境（Vercel）

1. 登录 https://vercel.com
2. 进入你的项目
3. 点击 **Settings → Environment Variables**
4. 添加以下三个变量：

| Name | Value | Environment |
|------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |

⚠️ **重要提示**：
- 开发时使用 `sk_test_` 和 `pk_test_`（测试模式）
- 上线时使用 `sk_live_` 和 `pk_live_`（生产模式）
- Webhook secret 在测试和生产环境是不同的，需要分别配置

## 五、测试 Webhook（本地开发）

### 使用 Stripe CLI（推荐）

1. 安装 Stripe CLI：
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # 或访问 https://stripe.com/docs/stripe-cli
   ```

2. 登录 Stripe CLI：
   ```bash
   stripe login
   ```

3. 转发 webhook 到本地：
   ```bash
   stripe listen --forward-to localhost:3004/api/payment/webhook
   ```

4. CLI 会显示一个 webhook secret（`whsec_...`），将这个用于本地 `.env.local` 的 `STRIPE_WEBHOOK_SECRET`

### 不使用 CLI（需要部署后才能测试）

如果不想安装 Stripe CLI，可以：
1. 先部署到 Vercel
2. 在 Stripe Dashboard 配置生产环境的 webhook URL
3. 使用测试模式进行支付测试

## 六、验证配置

配置完成后，可以：

1. 启动开发服务器：`npm run dev`
2. 打开充值对话框
3. 如果配置了 Stripe，会跳转到 Stripe Checkout
4. 如果未配置，会使用模拟支付模式

## 常见问题

### Q: 找不到 API keys 页面？
A: 确保已登录 Stripe Dashboard，左侧菜单应该有 "Developers" 选项。

### Q: Secret key 显示为星号？
A: 点击 "Reveal test key" 或 "Reveal live key" 按钮即可显示。

### Q: Webhook 创建后找不到 Signing secret？
A: 点击 webhook endpoint 的名称进入详情页，Signing secret 在页面中下部。

### Q: 测试模式和生产模式的区别？
A: 
- **测试模式**：使用测试卡号，不会产生真实扣款
- **生产模式**：使用真实银行卡，会产生真实扣款

### Q: 测试卡号在哪里？
A: Stripe Dashboard → Developers → Testing → Test card numbers
常用测试卡号：`4242 4242 4242 4242`（任意未来日期和 CVC）
