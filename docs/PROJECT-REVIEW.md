# LifeCode 项目回顾与后续规划

**更新日期**: 2026-02-06

---

## 一、业务与定位

**LifeCode** 是基于紫微斗数 + 八字命理的智能命理解读产品：

- **排盘**：iztro 库（节气四柱 + 紫微斗数），支持公历/农历、时辰/具体时间、真太阳时校准。
- **解读**：LLM（OpenAI/DeepSeek）生成主报告（13 个 Section）及 4 类深度报告。
- **商业化**：能量体系（主报告 20、深度报告 200）、充值、兑换码、邀请奖励。

---

## 二、功能与进度总览

| 模块           | 状态   | 说明 |
|----------------|--------|------|
| 用户与认证     | ✅ 完成 | 邮箱验证码登录、Session、Context |
| 能量与交易     | ✅ 完成 | 余额、扣费、充值、兑换码、邀请奖励、消费记录 |
| 档案管理       | ✅ 完成 | 创建、列表、单档案；Supabase 持久化 |
| 出生信息输入   | ✅ 完成 | 公历/农历、时辰/具体时间、真太阳时、地区 |
| 主报告生成     | ✅ 完成 | 任务队列、6 步进度、LLM+Zod、13 Section 展示 |
| 深度报告       | ✅ 完成 | 未来运势、仕途探索、财富之路、爱情姻缘（Prompt+服务+页） |
| 命盘页         | ✅ 完成 | 紫微排盘可视化 |
| 前端缓存       | ✅ 完成 | api-cache.ts，档案/主报告/深度报告 TTL 缓存 |
| 分享与消费展示 | ✅ 完成 | 分享图核心能力居中、消费记录中文展示 |
| 数据层         | ✅ 完成 | **Supabase**（db.ts），已不用内存 store 做主数据 |
| 真人 1V1 / AI 解答 | 🔒 未开放 | 占位「未开放」 |

**说明**：`docs/PROGRESS.md` 与 `docs/SUMMARY.md` 中部分“待办”已滞后（如“深度报告待开发”“数据库待迁移”），以本文与 `docs/RELEASE-SUMMARY.md` 为准。

---

## 三、技术栈与关键文件

- **前端**：Next.js 16、React 19、TypeScript、Tailwind、Radix、Recharts、iztro。
- **后端**：Next.js API Routes、Supabase（PostgreSQL）、OpenAI SDK（兼容 DeepSeek）。
- **核心服务**：`iztro-service`、`prompt-builder`、`llm-service`、`report-validator`、`report-service`、`deep-report-service`。
- **Prompt**：`src/lib/prompts/main-report/` 与 `src/lib/prompts/{future-fortune,career-path,wealth-road,love-marriage}/`。

---

## 四、建议的后续优化与研发

### 高优先级（体验与稳定性）

1. **错误处理与重试**
   - 主报告/深度报告生成失败时：明确文案（如「生成失败，请稍后重试」）、可重试入口。
   - 可选：后端对 LLM 超时/5xx 做有限次重试后再标 `failed`。

2. **报告页体验**
   - 报告页锚点导航（13 Section 快速跳转）。
   - 分析中状态增加「预计约 1–2 分钟」等提示，减少焦虑。

3. **输入页校验**
   - 必填/格式错误时，除禁用按钮外增加简短文案提示（如「请选择出生地区」）。

### 中优先级（质量与可维护性）

4. **文档与进度同步**
   - 将 `PROGRESS.md`、`SUMMARY.md` 中“待办”与“下一步”更新为当前状态（深度报告已完成、已用 Supabase）。
   - 在 `PROGRESS.md` 中注明：主数据来自 `db.ts`，`store.ts` 仅作兼容/调试（若仍保留）。

5. **LLM 与 Prompt**
   - 真实端到端跑主报告 + 四类深度报告，记录失败率与典型错误。
   - 根据结果微调 Prompt（如 `system.md`、json-schema）和 `report-validator` 的 normalize。

6. **测试**
   - 关键服务单测（如 `report-validator`、`iztro-service` 的输入输出）。
   - 可选：主报告/深度报告生成流程的 E2E（需 mock LLM）。

### 长期（扩展）

7. **流式输出**：主报告/深度报告 SSE 流式返回，前端逐段展示。  
8. **多语言**：Prompt 与前端文案支持繁体/英文。  
9. **监控与日志**：LLM 调用成功率、耗时、错误归类。  
10. **真人 1V1 / AI 解答**：产品与后端方案明确后再开发。

---

## 五、立即可做的几件事

- 更新 `docs/PROGRESS.md` 的“待办”与“已完成”段落，与当前实现一致。  
- 在主报告页与深度报告页：失败时展示统一错误文案 +「重新生成」按钮（若后端已支持重试，则前端只接状态与按钮）。  
- 报告页分析中：加一句「预计约 1–2 分钟」提示。  
- 输入页：为必填项/格式错误增加 inline 错误提示。

如需从某一条开始具体改代码或改文档，可以直接说优先做哪一块（例如：先更新 PROGRESS、先做错误提示、或先做报告页锚点）。
