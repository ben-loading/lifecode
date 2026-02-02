# 深度报告「未来运势」完整生成流程

用于检查当前实现：输入、LLM 调用、输出、落库与前端展示。

---

## 1. 入口（前端 → API）

**前端**：`src/components/deep-reading-page.tsx`  
用户点击「解读」或「重新生成」时调用：

```ts
createDeepReportJob(currentArchiveId, reportSlug, isRetry)
// reportSlug = 'future-fortune'
```

**API 客户端**：`src/lib/api-client.ts`

- 请求：`POST /api/report/deep/generate`
- Body：`{ archiveId, reportType: 'future-fortune', retry: boolean }`
- 鉴权：`Authorization: Bearer <token>`（来自 Supabase 登录或 localStorage）

---

## 2. API 层（generate route）

**文件**：`src/app/api/report/deep/generate/route.ts`

**输入（来自请求）**：

- `archiveId`：当前档案 ID（前端传 `user.currentArchiveId`）
- `reportType`：`'future-fortune'`
- `retry`：是否免费重试（上次任务失败或「job 完成但无报告」时为 true）

**步骤概要**：

1. `getUserIdFromRequest(request)` → 当前用户 `userId`
2. 校验档案存在且 `archive.userId === userId`
3. 校验该档案+类型下没有已存在的 DeepReport、没有进行中的 Job
4. 免费重试逻辑：`retry && (上次失败 || 上次完成但无报告)` 则不扣费，否则扣 `DEEP_REPORT_COST`（200 能量）
5. 扣费：`updateUserBalance(userId, -200)` + `createTransaction`
6. 创建任务：`createDeepReportJob(archiveId, reportType, 'running', '准备输入')` → `jobId`
7. 调用 **生成服务**：`generateDeepReport(archiveId, 'future-fortune')`
8. 查库确认：`getDeepReportByArchiveAndType(archiveId, reportType)`  
   - 有 → `updateDeepReportJob(jobId, status: 'completed')`，返回 `{ jobId, status: 'completed' }`  
   - 无 → job 标为 failed，返回 `{ jobId, status: 'failed' }`
9. 若 `generateDeepReport` 抛错 → job 标为 failed，返回 `{ jobId, status: 'failed' }`

**输出（HTTP）**：`{ jobId: string, status: 'completed' | 'failed' }`

---

## 3. 生成服务（deep-report-service）

**文件**：`src/lib/services/deep-report-service.ts`

**输入**：`archiveId`、`reportType: 'future-fortune'`

**内部输入（由服务自己查库/计算）**：

- `archive` = `getArchiveById(archiveId)`：档案（性别、出生等）
- `mainReport` = `getMainReportByArchiveId(archiveId)`：主报告（人生剧本、大运、流年等）
- 未来运势 Prompt 模板：`src/lib/prompts/future-fortune/`（system.md、user-template.md、config.json）

**步骤**：

1. **构建 Prompt**：`buildFutureFortunePrompt(archiveId)`  
   - 拉取档案、主报告  
   - `calculateAstrolabe(archive)` → 八字+紫微命盘（iztro）  
   - 渲染 `user-template.md` 变量：`GENDER`、`IZTRO_INPUT`、`MAIN_REPORT`  
   - 返回：`{ systemPrompt, userMessage, config }`

2. **调用 LLM**：`callLLM(systemPrompt, userMessage, options)`  
   - options 来自 `future-fortune/config.json` + 覆盖 `timeoutMs: 5 * 60 * 1000`

3. **解析与校验**：  
   - `extractJsonFromResponse(llmResponse)` → 从 <think>/代码块中提纯 JSON 字符串  
   - `JSON.parse` → `parsedContent`  
   - `normalizeFutureFortuneOutput(parsedContent)` → 补全/兼容字段  
   - `FutureFortuneReportSchema.parse(normalized)` → Zod 校验

4. **落库**：`createDeepReport(archiveId, reportType, content)`  
   - 写入表 `DeepReport`：`id`、`archiveId`、`reportType`、`content`（JSONB）、`updatedAt`  
   - 唯一约束：`(archiveId, reportType)`，冲突时 upsert

5. **返回**：校验后的 `content`（供 generate route 判断是否要再查一次库）

---

## 4. 调用的 LLM（llm-service）

**文件**：`src/lib/services/llm-service.ts`

**厂商与模型**（由环境变量决定）：

- 若配置了 `DEEPSEEK_API_KEY`（且未强制 `LLM_PROVIDER=openai`）→ **DeepSeek**  
  - 模型：`config.deepseekModel`，即 **`deepseek-chat`**（来自 `future-fortune/config.json`）  
  - Base URL：`https://api.deepseek.com`
- 否则 → **OpenAI**  
  - 模型：`config.model`，即 **`gpt-4o`**  
  - 使用默认 OpenAI base URL

**调用参数**（未来运势）：

- `temperature`: 0.7  
- `max_tokens`: 6000  
- `response_format`: `{ type: 'json_object' }`  
- `timeout`: 5 分钟  

**LLM 输入**：

- **system**：`src/lib/prompts/future-fortune/system.md` 全文  
  - 角色：未来运势深度解读专家，基于八字+紫微+主报告  
  - 输出：唯一一个合法 JSON，5 大块（命格锚点、去年运势复盘、本年核心攻略、未来三年大势、流月战术节奏）  
  - 禁止 <think>、禁止编造等

- **user**：渲染后的 `user-template.md`  
  - `{{GENDER}}`：男/女  
  - `{{IZTRO_INPUT}}`：八字+紫微命盘 JSON（来自 `calculateAstrolabe(archive)`）  
  - `{{MAIN_REPORT}}`：主报告摘要 JSON（人生剧本、大运、流年、宫位等）

**LLM 输出**：一段字符串（可能含 <think>、```json 等），由 `extractJsonFromResponse` 提纯出 JSON 字符串。

---

## 5. 输出结构（Zod 校验 + 落库）

**校验**：`src/lib/services/report-validator.ts` 中 `FutureFortuneReportSchema`

- **命格锚点**：人生点题、时间坐标、当前大运、当前大运简评  
- **去年运势复盘**：年份关键词、深度体感与事件验证、极有可能发生（数组）  
- **本年核心攻略**：副标题、年度总象标题、警报文案、财富/情感/事业实战（各含流年信号、行动指南等）  
- **未来三年大势**：长度 3 的数组，每项含年份标题、级别、级别样式、描述  
- **流月战术节奏**：长度 4 的数组，每项含 season、stems、stars、summary、description、variant  

**落库**：`DeepReport` 表  
- `id`：UUID（写入时生成）  
- `archiveId`、`reportType`：与请求一致  
- `content`：上述校验通过后的整份 JSON 对象（JSONB）

---

## 6. 前端展示（读报告）

- **状态**：`GET /api/report/deep/archive/:archiveId/status`  
  - 按档案返回 4 类深度报告状态；有 DeepReport 则该项为 `completed`。

- **报告内容**：`GET /api/report/deep/:archiveId/:reportType`  
  - 先校验档案属于当前用户，再 `getDeepReportByArchiveAndType(archiveId, reportType)`，返回 `content` 等。

- **前端**：深度解读页根据 status 显示「查看报告」，点击后跳转报告详情页，请求上述 GET 接口用 `archiveId` + `reportType` 拉取并展示 `content`。

---

## 7. 小结（便于你检查）

| 环节       | 输入 | 使用的 LLM | 输出 |
|------------|------|------------|------|
| 前端       | 当前档案 ID、reportType=未来运势、是否重试 | - | POST /api/report/deep/generate |
| generate   | archiveId, reportType, retry；userId 来自鉴权 | - | 扣费/不扣费、创建 Job、调 generateDeepReport、写 DeepReportJob 状态 |
| 生成服务   | archiveId（再查 archive + 主报告 + iztro） | 见下 | 校验后的 JSON content + 写入 DeepReport |
| LLM 调用   | system=未来运势 system.md；user=性别+IZTRO_INPUT+MAIN_REPORT | DeepSeek **deepseek-chat** 或 OpenAI **gpt-4o**（由 env 决定） | 一段文本（内含 JSON） |
| 解析/校验  | LLM 返回文本 | - | 提纯 JSON → 归一化 → Zod 校验 → 作为 content |
| 落库       | archiveId, reportType, content | - | DeepReport 一行（id, archiveId, reportType, content） |

检查时可按上述顺序对照：  
1）前端传的 `archiveId` 是否为当前档案；  
2）环境变量实际用的是 DeepSeek 还是 OpenAI；  
3）Prompt 模板与 config（model、maxTokens、response_format）是否与预期一致；  
4）Zod 结构与 LLM 输出是否匹配；  
5）`createDeepReport` 是否带 `id`、唯一约束是否为 `(archiveId, reportType)`。
