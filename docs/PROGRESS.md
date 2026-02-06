# LifeCode 开发进度

**最后同步**：2026-02-06（基于最新 Git 状态修正）

---

## 项目概述

基于 iztro 库 + LLM（GPT-4o / DeepSeek）的命理解读系统：八字（60%）+ 紫微斗数（40%）双核算法。主报告 13 个 Section + 四类深度报告（未来运势、仕途探索、财富之路、爱情姻缘），数据持久化使用 **Supabase（PostgreSQL）**。

---

## 已完成任务 ✅

### 1. 类型与数据层
- ✅ `src/lib/types/`：主报告、四类深度报告、iztro 输入、API 类型
- ✅ **数据层**：`src/lib/db.ts` 对接 Supabase，API 路由均使用 db（用户、档案、主报告、深度报告、任务、交易、邀请、兑换码等）
- ✅ `prisma/schema.prisma` 存在但当前未作为主数据源；`.env.local.example` 含 Supabase / LLM 等配置说明

### 2. Prompt 与服务层
- ✅ 主报告：`src/lib/prompts/main-report/`（system.md、user-template、json-schema、config）+ `report-service.ts`、`report-validator.ts`
- ✅ 四类深度报告：`src/lib/prompts/{future-fortune,career-path,wealth-road,love-marriage}/` + `deep-report-service.ts` 分支与校验
- ✅ `iztro-service`、`prompt-builder`、`llm-service` 共用；主报告与深度报告均支持 **重新生成**（失败或重试后可再次生成）

### 3. API 与前端
- ✅ 主报告：`/api/report/generate`、`/api/report/[archiveId]`、`/api/report/status/[jobId]`、`/api/report/archive/[archiveId]/status` 等
- ✅ 深度报告：`/api/report/deep/generate`、`/api/report/deep/[archiveId]/[reportType]`、status/unlock 等
- ✅ 报告页完整展示 13 个 Section；四类深度报告各有独立页面与解锁/解读流程
- ✅ 前端缓存：`src/lib/api-cache.ts`（档案列表、主报告、深度报告及状态 TTL 缓存）

### 4. 其他已上线
- ✅ 出生信息：公历/农历、时辰/具体时间、真太阳时校准
- ✅ 能量与交易：扣费、充值、兑换码、邀请奖励、消费记录（含深度报告中文展示）
- ✅ 分享图（核心能力居中）、命盘页、历史报告、任务中心等

---

## 文件清单（关键）

| 类别 | 路径 | 说明 |
|------|------|------|
| 数据层 | `src/lib/db.ts` | Supabase 数据访问（主数据源） |
| 类型 | `src/lib/types/main-report.ts`、`*-report.ts`、`api.ts` | 主报告 / 深度报告 / API 类型 |
| Prompt | `src/lib/prompts/main-report/`、`src/lib/prompts/{future-fortune,career-path,wealth-road,love-marriage}/` | 主报告与四类深度报告模板 |
| 服务 | `report-service.ts`、`deep-report-service.ts`、`llm-service.ts`、`report-validator.ts`、`iztro-service.ts`、`prompt-builder.ts` | 生成与校验 |
| 缓存 | `src/lib/api-cache.ts` | 前端本地缓存 |
| API | `src/app/api/report/**`、`src/app/api/archives/**`、`energy`、`auth` 等 | 报告、档案、能量、认证 |

---

## 待优化项 📋

> **清单跟踪**：可勾选进度的独立清单见 [待办与开发项.md](./待办与开发项.md)。

1. **邮箱格式校验**  
   填写邮箱时判断格式（当前无），错误时给出提示。

2. **主报告加载状态**  
   从二级页面返回主报告时，若正在加载，避免出现旧的「动态分析」状态，统一为「加载报告中」。

3. **同命盘报告复用（降本与一致性）**  
   新档案发起主报告或四类深度报告生成前，先判断是否存在**同一用户或全局**相同性别、出生年月日时的档案；若有，可将已有主报告与四类深度报告关联到新档案（或从统一报告库查询）。实现方式二选一或组合：  
   - 直接基于现有 Archive + MainReport/DeepReport 表按「性别+出生年月日时」查询并复用；  
   - 或新增独立表（报告内容 + 性别 + 出生年月日时）作为报告库，便于快速查询与复用。  
   需在实现时定夺采用哪种或混合方案。

4. **四类报告「解读中」状态闪烁**  
   某一报告点击解锁进入解读中后，再点击其他报告解读会触发短时刷新，导致其他「解读中」按钮短暂变为「解锁报告」。需优化状态依赖与刷新逻辑，避免误展示。

5. **首页默认展示逻辑**  
   已有档案的用户：主界面不展示「开启解码」欢迎页，而是**默认锁定最新档案并展示其主报告**。无档案的新用户才默认展示「开启解码」欢迎页。避免未锁定档案时从侧边栏进入深度报告等出现一直加载的 bug。

6. **无档案时深度解读入口**  
   无档案用户从侧边栏点击「深度解读」时，用 **toast 提示**：「请先创建档案进行解码开启」，避免进入无档案的深度报告页导致异常。

7. **顶部菜单栏可见性（待定）**  
   部分机型（如带灵动岛的苹果手机）在浏览器贴顶或略微放大时，用户难以找到顶部菜单入口；优化方案待讨论。

8. **加载性能与请求次数**  
   在已有缓存前提下，仍存在加载偏多、体感偏慢的问题，待进一步优化请求策略与缓存失效时机。

9. **任务中心改为活动中心**  
   前端将「任务中心」改为「活动中心」；**暂时隐藏**「邀请任务增加能量」模块，仅保留 **Discord 兑换码** 入口。

10. **邮件验证码人机验证（线上防刷）**  
   需求延伸：线上环境用户发起邮件验证码时，先做人机验证（如 CAPTCHA / reCAPTCHA / Turnstile 等），通过后再调用发信接口，防止被恶意刷爆邮件服务与配额。

---

## 剩余开发项 🚧

> 勾选与版本归属见 [待办与开发项.md](./待办与开发项.md)。

### 本版本考虑
- **兑换码及对应能量设置的后台功能**：支持生成兑换码并配置可兑换能量等。

### 下版本考虑
- **真人 1V1**：预约号、订单流程、服务能力及后台能力。
- **AI 解惑**：与报告内容相关的 AI 问答能力。

---

## 技术架构摘要

```
用户创建/选择档案
  ↓
主报告：POST /api/report/generate → 扣能量、创建 ReportJob → runReportJobInRequest
  → iztro 计算 → Prompt 构建 → LLM 调用 → Zod 验证 → 写入 Supabase MainReport
  → 前端轮询 status → 完成后拉取 /api/report/[archiveId] 展示

深度报告：POST /api/report/deep/generate → 扣能量、创建 DeepReportJob
  → 同上写入 Supabase DeepReport，前端轮询对应 status，四类独立页展示

数据层：src/lib/db.ts（Supabase）；store.ts 仅作历史/调试兼容，非主数据源。
```

---

## 体验流程（当前）

1. **启动**：`npm run dev`，`.env.local` 配置 LLM（如 DEEPSEEK_API_KEY / OPENAI_API_KEY）及 Supabase。
2. **新用户**：首页「开启解码」→ 登录 → 输入页 → 档案页「开启解码」→ 报告页（分析进度 → 主报告）。
3. **已有档案**：侧边栏选档案后可查看主报告、命盘、四类深度报告（解锁后解读）；主报告/深度报告失败可重新生成。

---

## 更新日志

### 2026-02-06
- 根据最新 Git 状态与产品现状**修正本进度文档**：主报告/深度报告重新生成已有、四类深度报告已完成、数据层为 Supabase。
- 待办任务更新为当前**待优化项 1–9**与**剩余开发项**（兑换码后台 / 真人 1V1 / AI 解惑及版本归属）。

### 2026-01-31
- 主报告生成系统完整实现（类型、Prompt、服务层、API）；前端 13 个 Section 适配；报告页空状态与分析中逻辑。

### 2026-01-29（Phase 3）
- 出生信息重构（公历/农历、时辰/具体时间、真太阳时）；iztro 集成优化；数据模型扩展；报告页进度与 UI 优化。

---

**下一步重点**：按上述「待优化项」逐项落地（邮箱校验、主报告加载状态、同命盘复用设计、四类报告状态闪烁、首页默认档案与无档案 toast、活动中心与隐藏邀请任务等）；本版本推进兑换码后台，下版本规划真人 1V1 与 AI 解惑。
