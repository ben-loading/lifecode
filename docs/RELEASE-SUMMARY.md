# 版本总结与优化进度（正式环境构建前）

**日期**: 2026-01-29  
**用途**: 构建正式环境前的功能与优化汇总。

---

## 一、深度报告相关

### 1. 四类深度报告完整实现
- **未来运势**（future-fortune）、**仕途探索**（career-path）、**财富之路**（wealth-road）、**爱情姻缘**（love-marriage）
- 每类独立：`src/lib/prompts/{type}/`（system.md、user-template、config、json-schema）、prompt-builder、report-validator Schema/归一化、deep-report-service 分支、前端页面 `/deep-reading/{type}` 拉取 API 并渲染
- 扣费与重试：200 能量/次，失败或数据不一致可免费「重新生成」

### 2. 深度报告页交互与文案
- 生成完成后按钮变为「查看报告」，不自动跳转，toast 提示
- 不足能量时弹窗引导充值；充值/刷新后余额更新，支持免费重试逻辑
- **解读中文案**：发起解读或重新生成时，左侧由「200能量」变为「全方位推演中，约一分钟，请静候」（文艺、专业感），优先以 `isGenerating` 判断，避免卡片拉长

### 3. 数据库与读取稳健性
- `getDeepReportByArchiveAndType` 使用 `order('createdAt', { ascending: false }).limit(1).maybeSingle()`，避免多行或历史数据导致报错
- 深度报告 status 接口：任务已完成但读不到报告时增加重试，减少误判为 failed
- 生成前二次确认无报告再扣费，降低并发重复生成

### 4. 未开放功能
- 「真人1V1」「AI解答」Tab 显示「未开放」角标，点击后展示「该功能暂未开放 敬请期待」，简约样式

---

## 二、主报告与档案

- 主报告页：档案名从 API 动态拉取，避免占位或 mock
- 浮动按钮、弹层 z-index 与布局滚动调整，避免整页位移或遮挡问题
- 主报告生成失败/超时后展示「重新生成」入口与错误提示

---

## 三、前端本地缓存（减少 loading 与请求）

### 1. 缓存层 `src/lib/api-cache.ts`
- **localStorage + TTL**：档案列表 2 分钟、单档案 5 分钟、主报告 5 分钟、主报告状态 1 分钟、深度报告内容 10 分钟、深度报告状态 1 分钟
- **策略**：有未过期缓存则先返回再后台刷新；无缓存再请求并写入
- **失效**：创建新档案 → 清档案列表；主报告任务完成 → 清该档案主报告/状态；深度报告解读完成 → 清该档案该类型深度报告与状态

### 2. 使用缓存的调用点
- 侧边栏：`listArchivesCached()`，创建新档案后 `invalidateArchivesList()`
- 主报告页：`getReportArchiveStatusCached`、`getMainReportCached`、`getArchiveCached`；任务完成后 `invalidateMainReport(archiveId)` 再拉主报告
- 四类深度报告页：`getDeepReportCached(archiveId, reportType)`
- 深度解读页：`getDeepReportArchiveStatusCached`；解读完成时 `invalidateDeepReport(archiveId, reportSlug)`
- 命盘页：`getArchiveCached`、`listArchivesCached`

---

## 四、分享与消费记录

### 1. 分享图片
- 核心能力段落 **居中排版**（Canvas 绘制与弹窗预览均为居中），短描述不再左偏
- Canvas 绘制核心能力多行前设置 `ctx.textAlign = 'center'`

### 2. 消费记录展示
- 深度报告消费子描述：前端将英文 slug 映射为中文展示（不动后端与数据库）
  - love-marriage → 爱情姻缘，wealth-road → 财富之路，career-path → 仕途探索，future-fortune → 未来运势
- 实现于 `transaction-history-dialog.tsx` 的 `formatTransactionDescription` + 本地 `DEEP_REPORT_DISPLAY_LABELS`

---

## 五、填写信息页（出生时间）

- **时辰选择** 设为默认（`birthTimeMode` 初始值 `'shichen'`）
- 选项顺序：**时辰选择** 在前，**具体时间** 在后

---

## 六、其他修复与稳定性

- 深度报告 LLM 输出：truncated JSON 修复（repairTruncatedJson）、未来运势等 normalize 补全字段与数组长度、maxTokens/超时调整
- 主报告 JSON 与落库：id 使用 `crypto.randomUUID()`，避免 null 错误
- 深度报告类型判断：显式 `raw === 'love-marriage'` 等字面量比较，避免未支持类型报错

---

## 七、涉及文件清单（本版本变更）

| 类别 | 路径 |
|------|------|
| 缓存 | `src/lib/api-cache.ts`（新增） |
| 深度报告 prompt | `src/lib/prompts/career-path/`、`love-marriage/`、`wealth-road/`（新增） |
| 类型 | `src/lib/types/career-path-report.ts`、`love-marriage-report.ts`、`wealth-road-report.ts`（新增） |
| 服务 | `src/lib/services/deep-report-service.ts`、`prompt-builder.ts`、`report-validator.ts` |
| 数据库 | `src/lib/db.ts` |
| API | `src/app/api/report/deep/generate/route.ts`、`archive/[archiveId]/status/route.ts` |
| 页面 | `src/app/report/page.tsx`，`src/app/deep-reading/{future-fortune,career-path,wealth-road,love-marriage}/page.tsx`，`src/app/chart/page.tsx` |
| 组件 | `src/components/deep-reading-page.tsx`、`side-menu.tsx`、`archive-page.tsx`、`share-dialog.tsx`、`transaction-history-dialog.tsx`、`input-page.tsx` |

---

构建正式环境前建议：确认环境变量（LLM、Supabase、支付等）、执行数据库迁移（若有）、在预发环境验证主报告与四类深度报告生成与缓存表现。
