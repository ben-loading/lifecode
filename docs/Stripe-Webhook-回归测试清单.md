# Stripe Webhook 回归测试清单

## 前置条件

- 已执行数据库迁移：`supabase/migrations/007_payment_event_idempotency.sql`
- 已执行数据库迁移：`supabase/migrations/008_atomic_report_job_start.sql`
- 已配置环境变量：
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- 本地或测试环境可接收 Stripe Webhook（如 Stripe CLI 转发）

## 核心用例

- [ ] **正常支付入账**
  - 创建支付会话并完成支付。
  - 期望：用户余额 + 对应能量；新增 1 条 `Transaction`；`PaymentEvent.status=processed`。

- [ ] **同一 sessionId 重放**
  - 对同一 `checkout.session.completed` 事件重复发送 2~3 次。
  - 期望：只入账 1 次；`Transaction` 仅 1 条对应 sessionId；接口返回 `已处理` 或 `处理中`。

- [ ] **同一 eventId 重放**
  - 使用 Stripe CLI 重放同一事件 ID。
  - 期望：不重复入账；`PaymentEvent` 不新增重复记录。

- [ ] **并发重放**
  - 并行发送同一 `sessionId` 的 webhook（>=5 并发）。
  - 期望：只成功处理一次，余额不重复增加。

- [ ] **无效签名**
  - 发送缺少或伪造 `stripe-signature` 的请求。
  - 期望：HTTP 400，返回 `{ error: "WEBHOOK_ERROR", code: "MISSING_SIGNATURE" }`。

- [ ] **无效 metadata**
  - `userId` 为空或 `energy<=0`。
  - 期望：HTTP 400，返回统一错误码，不暴露内部堆栈与数据库信息。

- [ ] **用户不存在**
  - 构造不存在的 `userId` 回调。
  - 期望：HTTP 404，`PaymentEvent.status=failed`，无余额变动。

- [ ] **失败后重试恢复**
  - 人为制造首次处理失败（例如临时关闭写库权限），恢复后重放。
  - 期望：可从 `failed` 转 `processing` 再到 `processed`，最终只入账一次。

## 数据核验 SQL（示例）

```sql
-- 查看最近支付事件
select provider, "sessionId", status, error, "createdAt", "processedAt"
from public."PaymentEvent"
order by "createdAt" desc
limit 20;

-- 查看某会话交易记录（把 cs_xxx 换成真实 sessionId）
select id, "userId", type, amount, description, "createdAt"
from public."Transaction"
where description like '%[cs_xxx]%'
order by "createdAt" desc;
```

## 验收标准

- 任意重放/并发场景都不会重复入账。
- Webhook 失败响应对外仅返回通用错误与错误码，不泄露内部实现细节。
- `PaymentEvent` 与 `Transaction` 记录可追溯且一致。

## 报告接口并发压测（新增）

- 主报告并发压测（10 并发，严格模式）：

```bash
cd /Users/bd/Documents/selfdev/lifecode
MODE=main ARCHIVE_ID=你的档案ID TOKEN=你的token BASE_URL=http://localhost:3004 CONCURRENCY=10 STRICT=true EXPECT_MAX_CONSUME_DELTA=1 EXPECT_MAX_JOB_IDS=1 npm run test:report-concurrency
```

- 深度报告并发压测（10 并发，严格模式）：

```bash
cd /Users/bd/Documents/selfdev/lifecode
MODE=deep ARCHIVE_ID=你的档案ID REPORT_TYPE=future_fortune TOKEN=你的token BASE_URL=http://localhost:3004 CONCURRENCY=10 STRICT=true EXPECT_MAX_CONSUME_DELTA=1 EXPECT_MAX_JOB_IDS=1 npm run test:report-concurrency
```

- 判定说明：
  - `consumeDelta` 超过阈值表示可能重复扣费
  - `jobIds` 超过阈值表示可能重复建任务
  - `STRICT=true` 时任一超限会返回非 0 退出码（适合 CI）
