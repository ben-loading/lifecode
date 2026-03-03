# Stripe Webhook 上线前一键验收模板

> 适用范围：`payment/webhook` 幂等改造上线前最终验收  
> 参考清单：`docs/Stripe-Webhook-回归测试清单.md`

## 1) 发布信息

- 发布版本：
- 目标环境：`staging` / `production`
- 验收日期：
- 验收负责人（QA）：
- 发布负责人（RD）：
- 回滚负责人（Owner）：

## 2) 前置检查（Gate 0）

- [ ] 已执行迁移：`supabase/migrations/007_payment_event_idempotency.sql`
- [ ] 已执行迁移：`supabase/migrations/008_atomic_report_job_start.sql`
- [ ] 环境变量已配置：
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] 支付回调地址已指向当前环境
- [ ] 监控与告警可用（日志平台 / 错误告警）

## 3) 一键验收用例（Gate 1）

> 执行结果填写：`PASS` / `FAIL` / `BLOCKED`

| 用例 | 负责人 | 结果 | 备注 |
|---|---|---|---|
| 正常支付入账 |  |  |  |
| 同一 `sessionId` 重放 |  |  |  |
| 同一 `eventId` 重放 |  |  |  |
| 并发重放（>=5） |  |  |  |
| 无效签名 |  |  |  |
| 无效 metadata |  |  |  |
| 用户不存在 |  |  |  |
| 失败后重试恢复 |  |  |  |
| 主报告并发压测（`test:report-concurrency`） |  |  |  |
| 深度报告并发压测（`test:report-concurrency`） |  |  |  |

## 4) 数据核验（Gate 2）

- [ ] `PaymentEvent` 状态与次数符合预期（无重复处理）
- [ ] `Transaction` 按 `sessionId` 查询仅 1 条
- [ ] 余额变化与交易金额一致
- [ ] 失败场景有 `failed` 记录，恢复后可转 `processed`

建议执行 SQL（替换真实会话 ID）：

```sql
select provider, "sessionId", status, error, "createdAt", "processedAt"
from public."PaymentEvent"
order by "createdAt" desc
limit 50;

select id, "userId", type, amount, description, "createdAt"
from public."Transaction"
where description like '%[cs_xxx]%'
order by "createdAt" desc;
```

## 5) 安全与可观测性（Gate 3）

- [ ] 对外错误已脱敏，仅返回通用错误与错误码
- [ ] 服务端日志可定位失败原因（签名失败/用户不存在/写库失败）
- [ ] 未暴露内部堆栈、数据库结构、敏感字段

## 6) 上线结论

- 验收结论：`允许上线` / `禁止上线`
- 阻断问题（若有）：
  1.
  2.
- 风险说明（可选）：

## 7) 回滚预案（必填）

- 回滚触发条件：
  - 10 分钟内重复入账告警 >= 1 次
  - Webhook 失败率持续 > 5%
  - 交易与余额不一致
- 回滚步骤：
  1. 关闭支付入口或临时下线 webhook 回调
  2. 回退服务版本至上一稳定版本
  3. 对异常 `sessionId` 执行账务核对与补偿
  4. 复盘后再重新灰度

## 8) 签字确认

- QA 确认人：
- RD 确认人：
- 产品确认人：
- 最终批准人：
