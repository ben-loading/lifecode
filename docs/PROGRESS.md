# 主报告生成系统开发进度

## 项目概述
实现基于 iztro 库 + LLM（GPT-4o）的主报告生成系统，采用八字（60%）+ 紫微斗数（40%）双核算法。

## 已完成任务 ✅

### 1. TypeScript 类型定义（2026-01-31 完成）
- ✅ 创建 `src/lib/types/iztro-input.ts` - iztro 库输入输出类型
- ✅ 创建 `src/lib/types/main-report.ts` - 主报告完整类型（13 个 Section）
- ✅ 创建 `src/lib/types/index.ts` - 统一导出
- ✅ 更新 `src/lib/types/api.ts` - 导入并使用新的 MainReportContent 类型

**说明**：
- 主报告包含 13 个 Section：人生剧本、核心能力、命理基础、雷达图、多维解析、性格特质、性格标签、宫位解析、职业天命、人生四阶、流年运势图表、流年详细描述、社交名片
- 采用固定长度数组（radarData=7, dimensionDetails=7, lifeStages=4, yearlyDetails=3）确保数据一致性

---

### 2. Prisma Schema 设计（2026-01-31 完成）
- ✅ 创建 `prisma/schema.prisma` - 数据库模型定义
- ✅ 创建 `.env.local.example` - 环境变量示例
- ✅ 安装 OpenAI SDK（`npm install openai`）

**说明**：
- 主报告使用 `JSONB` 字段存储完整内容，避免过多列
- 包含 User, Archive, MainReport, DeepReport, Transaction, Invite, RedemptionCode, ReportJob 等模型
- **注意**：Prisma 7.x 要求 Node.js >= 20.19，当前环境为 v21.4.0，需升级 Node.js 后才能运行 Prisma 迁移

---

### 3. Prompt 模板系统（2026-01-31 完成）
- ✅ 创建 `src/lib/prompts/main-report/system.md` - System Prompt（角色设定、分析方法论）
- ✅ 创建 `src/lib/prompts/main-report/user-template.md` - User Message 模板
- ✅ 创建 `src/lib/prompts/main-report/json-schema.json` - 输出 JSON Schema 约束
- ✅ 创建 `src/lib/prompts/main-report/config.json` - 模型配置（model, temperature, maxTokens）
- ✅ 创建 `src/lib/prompts/loader.ts` - Prompt 加载器（支持热更新）

**说明**：
- **修改 Prompt 位置**：直接编辑 `src/lib/prompts/main-report/` 下的文件，无需修改代码
- 支持变量替换（如 `{{IZTRO_INPUT}}`）
- 便于未来 A/B 测试不同 Prompt 版本

---

### 4. 服务层实现（2026-01-31 完成）
- ✅ 创建 `src/lib/services/iztro-service.ts` - iztro 命盘计算，转换为 IztroInput 格式
- ✅ 创建 `src/lib/services/prompt-builder.ts` - 根据命盘数据构建完整 Prompt
- ✅ 创建 `src/lib/services/llm-service.ts` - 封装 OpenAI API 调用
- ✅ 创建 `src/lib/services/report-validator.ts` - Zod Schema 验证 LLM 输出
- ✅ 创建 `src/lib/services/report-service.ts` - 主报告生成主服务（整合完整流程）
- ✅ 安装 Zod（`npm install zod`）

**说明**：
- `report-service.ts` 是入口，整合了所有步骤：获取档案 → iztro 计算 → Prompt 构建 → LLM 调用 → Zod 验证 → 存储
- Zod 验证确保 LLM 输出符合标准化字段定义（长度、格式、枚举值等）

---

### 5. API 路由更新（2026-01-31 完成）
- ✅ 更新 `src/app/api/report/generate/route.ts` - 使用真实 LLM 生成逻辑
- ✅ 更新 `src/app/api/report/[archiveId]/route.ts` - 使用新的存储结构（archiveId → reportId 映射）
- ✅ 更新 `src/lib/store.ts` - 添加 `archiveToReport` 映射表

**说明**：
- 将 hardcoded 的 mock 报告替换为真实的 `generateMainReport()` 调用
- 保留进度更新逻辑（6 个步骤），最后一步调用 LLM
- 错误处理：LLM 调用失败时，任务状态标记为 `failed`

---

### 6. 开发进度记录（2026-01-31 完成）
- ✅ 创建 `docs/PROGRESS.md` - 本文件

---

## 文件清单

| 类别 | 文件路径 | 说明 |
|-----|---------|------|
| **类型定义** | `src/lib/types/main-report.ts` | 主报告完整类型（13 个 Section） |
| | `src/lib/types/iztro-input.ts` | iztro 输入输出类型 |
| | `src/lib/types/index.ts` | 统一导出 |
| | `src/lib/types/api.ts` | API 类型（已更新） |
| **Prisma** | `prisma/schema.prisma` | 数据库 Schema |
| | `.env.local.example` | 环境变量示例 |
| **Prompt 模板** | `src/lib/prompts/main-report/system.md` | System Prompt |
| | `src/lib/prompts/main-report/user-template.md` | User Message 模板 |
| | `src/lib/prompts/main-report/json-schema.json` | 输出 JSON Schema |
| | `src/lib/prompts/main-report/config.json` | 模型配置 |
| | `src/lib/prompts/loader.ts` | Prompt 加载器 |
| **服务层** | `src/lib/services/iztro-service.ts` | iztro 命盘计算 |
| | `src/lib/services/prompt-builder.ts` | Prompt 构建器 |
| | `src/lib/services/llm-service.ts` | LLM 调用服务 |
| | `src/lib/services/report-validator.ts` | Zod 验证 Schema |
| | `src/lib/services/report-service.ts` | 报告生成主服务 |
| **API 路由** | `src/app/api/report/generate/route.ts` | 报告生成 API（已更新） |
| | `src/app/api/report/[archiveId]/route.ts` | 获取报告 API（已更新） |
| | `src/lib/store.ts` | 内存存储（已更新） |

---

## 待办任务 📝

### 短期（必须完成）
- [x] **前端字段适配**：更新 `src/app/report/page.tsx` 以支持完整的 13 个 Section（2026-01-31 完成）
  - ✅ `coreAbilityTags`（社会角色标签）
  - ✅ `personalityTraits`（性格特质构成，柱状图/饼图）
  - ✅ `personalityLabels`（性格标签）
  - ✅ `palaceAnalysis`（宫位解析 5 个子模块）
  - ✅ `careerDestiny`（职业天命 3 个字段）
  - ✅ `lifeStages`（人生四阶）
  - ✅ `yearlyFortuneChart`（流年运势图表）
  - ✅ `yearlyDetails`（流年详细描述，含高亮年份）
  - ✅ `socialCard`（社交名片）

- [x] **环境变量配置**：已更新 `.env.local.example`（2026-01-31 完成）
  - 复制 `.env.local.example` 为 `.env.local`
  - 设置 `OPENAI_API_KEY`（必须）
  - 设置 `DATABASE_URL`（可选，暂时使用内存存储）

- [ ] **测试真实 LLM 调用**：
  - 步骤：创建档案 → 生成主报告 → 检查 LLM 输出是否符合 Zod 验证
  - 需要先配置 `OPENAI_API_KEY`

- [ ] **错误处理优化**：
  - 前端展示 LLM 生成失败的友好提示
  - 添加重试机制（可选）

---

### 中期（优化）
- [ ] **Node.js 版本升级**：升级到 20.19+ 或 22.12+，以支持 Prisma 7.x
- [ ] **数据库迁移**：从内存存储迁移到 PostgreSQL
  - 运行 `npx prisma migrate dev`
  - 更新 `report-service.ts` 使用 Prisma Client

- [ ] **Prompt 优化与测试**：
  - 对比不同 temperature/maxTokens 参数的输出质量
  - A/B 测试不同 Prompt 版本

- [ ] **深度报告实现**：
  - 类似主报告的流程，为 4 类深度报告创建 Prompt 模板和服务

---

### 长期（扩展）
- [ ] **流式输出**（SSE/WebSocket）：实时展示 LLM 生成进度
- [ ] **缓存机制**：相同命盘数据避免重复调用 LLM
- [ ] **多语言支持**：Prompt 模板支持英文/繁体中文
- [ ] **监控与日志**：LLM 调用成功率、耗时统计

---

## 技术架构总结

```
用户创建档案
  ↓
前端发起生成请求 (/api/report/generate)
  ↓
API 扣除能量 → 创建任务 (ReportJob)
  ↓
后台任务（runReportJob）
  ├─ 1-5 步：进度模拟
  └─ 第 6 步：调用 ReportService.generateMainReport()
      ├─ iztro-service：计算命盘（调用 iztro 库）
      ├─ prompt-builder：加载模板，替换变量
      ├─ llm-service：调用 OpenAI API
      ├─ report-validator：Zod 验证输出
      └─ 存储到 store.mainReports + archiveToReport 映射
  ↓
前端轮询任务状态 (/api/report/status/[jobId])
  ↓
任务完成后，前端跳转到报告页 (/report?archiveId=xxx)
  ↓
获取报告数据 (/api/report/[archiveId])
  ↓
展示完整报告内容
```

---

## 关键设计亮点

1. **配置化 Prompt 系统**：
   - Prompt 存储在独立文件中（Markdown + JSON），修改无需重启服务
   - 支持变量替换和模板继承
   - 便于 A/B 测试和版本管理

2. **双核算法封装**：
   - iztro-service 将原始命盘数据转换为标准化的 IztroInput 格式
   - Prompt 中嵌入了八字（60%）+ 紫微（40%）的权重计算方法论

3. **严格的类型约束**：
   - TypeScript 类型 + Zod Schema 双重保障
   - 固定长度数组、枚举值、字符串长度限制，确保前端渲染稳定

4. **分层架构**：
   - API 层（路由）→ 服务层（业务逻辑）→ 数据层（存储）
   - 便于单元测试和未来扩展

---

## 体验主报告流程

主报告生成已整合进产品流程，可按以下步骤完整体验一次：

1. **启动项目**  
   `npm run dev`，确保 `.env.local` 中已配置 LLM（如 `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY`）。

2. **首页**  
   打开 `/`，点击「开启解码」。未登录会弹出登录；登录成功后会自动跳转到输入页。

3. **输入页** (`/input`)  
   选择性别、出生日期时间、出生地区，点击「下一步」进入档案页。

4. **档案页** (`/archive`)  
   输入档案备注（如昵称），点击「开启解码」。系统会创建档案、发起主报告生成任务并跳转到报告页（带 `jobId` 与 `archiveId`）。

5. **报告页** (`/report?jobId=xxx&archiveId=xxx`)  
   - 显示真实分析进度（编码解析 → 排盘 → 解析 → … → 输出解码结果）。  
   - 任务完成后自动拉取主报告并展示完整 13 个 Section。  
   - 若直接打开 `/report` 且未生成过报告，会显示「您还未生成主报告」和「填写编码并生成」按钮，引导至输入页。

**说明**：新用户登录会获得 20 能量，主报告生成消耗 20 能量，可免费体验一次。开发环境下验证码会在终端输出（`[mock] send-code`）。

---

## 更新日志

### 2026-01-31
- 完成主报告生成系统完整实现（类型定义、Prompt 模板、服务层、API 路由）
- 创建本进度文档
- 完成前端字段适配（report/page.tsx 支持完整 13 个 Section）
- 修复 TypeScript 类型冲突和 Next.js 16 Suspense 边界问题
- 项目构建成功（`npm run build` 通过）
- 主报告流程整合进产品：报告页空状态与「仅真实任务显示分析中」逻辑，并补充「体验主报告流程」说明

### 2026-01-29（Phase 3 完成）
- ✅ **出生信息输入系统重构**：
  - 新增公历/农历历制选择（对接 iztro 的 bySolar/byLunar）
  - 新增时辰/具体时间两种输入模式
  - 时辰模式隐藏地区选择（以时辰中点为准）
  - 具体时间模式必填地区（用于真太阳时校准）
  
- ✅ **真太阳时校准实现**：
  - 创建 `src/lib/birth-constants.ts`（时辰常量 + 经度映射 + EoT 计算）
  - 实现经度偏移 + Equation of Time 双重修正
  - 精度：±5 分钟（受 EoT 简化算法影响）
  
- ✅ **iztro 集成优化**：
  - 修复节气四柱配置（`yearDivide: 'exact', horoscopeDivide: 'exact'`）
  - 修复 hourToTimeIndex 映射（23:00 -> 晚子时 index=12）
  - 实现 bySolar/byLunar 条件调用
  - 前端命盘页（`/chart`）与后端服务逻辑一致
  
- ✅ **数据模型扩展**：
  - 新增字段：`birthCalendar`, `birthTimeMode`, `birthTimeBranch`, `lunarDate`, `isLeapMonth`
  - 更新 API 类型（`CreateArchiveBody`/`ApiArchive`）
  - 更新 Context（`UserData`）
  - 后端验证：时辰模式 birthLocation 可选，农历必填 lunarDate
  
- ✅ **前端 UI 优化**：
  - 输入页重构：克制简约设计，去除 emoji，保持专业气质
  - 新增分段式控件（公历/农历、时辰/具体时间）
  - 动态表单：农历显示年/月/日+闰月，时辰模式隐藏地区
  - 报告页进度优化：前端计时器驱动，后端仅轮询完成状态
  - 进度时间分配：70s 总流程分摊至 6 步骤（10+10+12+13+25s）
  - 长步骤显示 spinner 动画，避免"卡死感"
  
- ✅ **测试与调试**：
  - 创建 `scripts/simulate-report-generation.ts`（模拟报告生成）
  - 创建 `scripts/validate-report-format.ts`（验证格式）
  - 测试输出保存至 `test-output/` 目录
  - 创建 `/api/debug/store` 接口（查看内存存储状态）

- ✅ **文档完善**：
  - 创建 `docs/SUMMARY.md`（产品与研发总结）
  - 更新 `docs/PROGRESS.md`（本文件）
  - Git 提交：`64c64e0` - feat: 实现公历/农历、时辰/具体时间输入与真太阳时校准

---

**下一步重点**：
1. 测试真实 LLM 调用（配置 API Key 后完整流程测试）
2. 收集真实案例，优化 LLM 输出质量
3. 数据库迁移（从内存存储切换到 PostgreSQL）
