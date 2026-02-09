# Stripe 支付接入说明

## 概述

项目已集成 Stripe 支付功能，支持用户通过 Stripe Checkout 充值能量。

## 配置步骤

### 1. 获取 Stripe API 密钥

#### 步骤一：注册/登录 Stripe 账号

1. 访问 [Stripe 官网](https://stripe.com)
2. 点击右上角 **Sign in** 登录，或 **Start now** 注册新账号
3. 完成账号注册（需要邮箱验证）

#### 步骤二：进入 Dashboard

1. 登录后会自动进入 [Stripe Dashboard](https://dashboard.stripe.com)
2. 如果是新账号，需要先完成一些基本信息填写

#### 步骤三：获取 API 密钥

1. 在 Dashboard 左侧菜单，点击 **Developers**（开发者）
2. 在下拉菜单中选择 **API keys**
3. 你会看到两个密钥：

   **Publishable key（公钥）**
   - 显示格式：`pk_test_...`（测试模式）或 `pk_live_...`（生产模式）
   - 位置：页面顶部，可以直接复制
   - 用途：前端使用，用于创建支付会话
   - ⚠️ 注意：这个密钥可以暴露在前端代码中

   **Secret key（密钥）**
   - 显示格式：`sk_test_...`（测试模式）或 `sk_live_...`（生产模式）
   - 位置：在 "Secret key" 区域，点击 **Reveal test key** 或 **Reveal live key** 显示
   - 用途：服务端使用，用于创建支付会话和处理 webhook
   - ⚠️ 注意：**绝对不能**暴露在前端代码中，只能放在服务端环境变量中

#### 步骤四：切换测试/生产模式

- 在 API keys 页面右上角有 **Test mode** / **Live mode** 切换开关
- **开发测试时**：使用 Test mode（`sk_test_` 和 `pk_test_`）
- **正式上线时**：切换到 Live mode（`sk_live_` 和 `pk_live_`）

#### 步骤五：获取 Webhook 签名密钥

1. 在 Dashboard 左侧菜单，点击 **Developers → Webhooks**
2. 点击右上角 **Add endpoint**（添加端点）
3. 填写：
   - **Endpoint URL**: `https://你的域名.vercel.app/api/payment/webhook`
   - **Description**: 可选，如 "Lifecode Payment Webhook"
4. 在 "Events to listen to" 部分：
   - 选择 **Select events**
   - 勾选 `checkout.session.completed`（支付完成事件）
5. 点击 **Add endpoint** 创建
6. 创建成功后，点击该 webhook endpoint
7. 在 "Signing secret" 部分，点击 **Reveal** 显示密钥
8. 复制密钥（格式：`whsec_...`）

### 2. 配置环境变量

#### 本地开发环境

在 `.env.local` 文件中添加：

```bash
# Stripe 配置
STRIPE_SECRET_KEY=sk_test_你的密钥
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_你的密钥
STRIPE_WEBHOOK_SECRET=whsec_你的webhook密钥
```

#### 生产环境（Vercel）

1. 登录 [Vercel Dashboard](https://vercel.com)
2. 进入项目 → **Settings → Environment Variables**
3. 添加以下环境变量：
   - `STRIPE_SECRET_KEY` (Production)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Production)
   - `STRIPE_WEBHOOK_SECRET` (Production)

### 3. 配置 Stripe Webhook

1. 在 Stripe Dashboard → **Developers → Webhooks**
2. 点击 **Add endpoint**
3. 设置：
   - **Endpoint URL**: `https://你的域名.vercel.app/api/payment/webhook`
   - **Events to listen to**: 选择 `checkout.session.completed`
4. 复制 **Signing secret** (whsec_...) 到环境变量 `STRIPE_WEBHOOK_SECRET`

### 4. 本地测试 Webhook（可选）

使用 Stripe CLI 转发 webhook 到本地：

```bash
stripe listen --forward-to localhost:3004/api/payment/webhook
```

## 支付流程

1. **用户点击充值** → 选择能量档位（200/500/1000）
2. **创建支付会话** → 调用 `/api/payment/create-session`
3. **跳转 Stripe Checkout** → 用户完成支付
4. **支付成功回调** → Stripe Webhook 触发 `/api/payment/webhook`
5. **更新用户余额** → 自动增加能量并创建交易记录
6. **返回成功页面** → `/payment/success`

## 价格配置

当前价格映射（可在 `src/lib/stripe.ts` 中修改）：

- 200 能量 = HK$20
- 500 能量 = HK$38
- 1000 能量 = HK$68

**货币**：港币（HKD）

## 开发模式

如果未配置 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`，系统会自动使用模拟支付模式（直接增加余额，不调用 Stripe）。

## API 路由

### POST `/api/payment/create-session`

创建 Stripe Checkout Session。

**请求体：**
```json
{
  "energy": 200
}
```

**响应：**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/api/payment/webhook`

处理 Stripe Webhook 事件（由 Stripe 自动调用）。

## 注意事项

1. **Webhook 签名验证**：所有 webhook 请求都会验证签名，确保请求来自 Stripe
2. **幂等性**：Webhook 可能重复调用，代码已处理重复支付的情况
3. **测试模式**：开发时使用 `sk_test_` 和 `pk_test_` 密钥
4. **生产模式**：上线前切换到 `sk_live_` 和 `pk_live_` 密钥

## 故障排查

### Webhook 未触发

1. 检查 Webhook URL 是否正确配置
2. 确认 `STRIPE_WEBHOOK_SECRET` 环境变量已设置
3. 查看 Stripe Dashboard → Webhooks → 查看事件日志

### 支付成功但余额未更新

1. 检查 Webhook 是否成功接收
2. 查看服务器日志中的错误信息
3. 确认数据库连接正常

### 前端无法创建支付会话

1. 确认 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 已配置
2. 检查用户是否已登录
3. 查看浏览器控制台错误信息
