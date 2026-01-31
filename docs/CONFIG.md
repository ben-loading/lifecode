# 项目配置说明

## 一、环境变量配置（主报告 LLM 生成必配）

### 1. 创建本地环境文件

在项目根目录执行：

```bash
cp .env.local.example .env.local
```

### 2. 编辑 `.env.local`：选择 LLM 厂商并填写对应 Key

用任意编辑器打开 `lifecode/.env.local`，按需选择 **OpenAI** 或 **DeepSeek** 并填写对应 Key。

#### 选项 A：使用 OpenAI

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **获取 Key**：[OpenAI API Keys](https://platform.openai.com/api-keys)
- **默认模型**：`gpt-4o`（可在 `src/lib/prompts/main-report/config.json` 中修改）

#### 选项 B：使用 DeepSeek

```bash
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **获取 Key**：[DeepSeek API Keys](https://platform.deepseek.com/api_keys)
- **接口**：OpenAI 兼容，baseURL 为 `https://api.deepseek.com`
- **默认模型**：`deepseek-chat`（可在 `config.json` 的 `deepseekModel` 中修改）

- **注意**：不要将 `.env.local` 提交到 Git；该文件已在 `.gitignore` 中。

#### 可选：数据库（当前为内存存储，可不配）

- 若暂时只用内存存储，可**不配置** `DATABASE_URL`。
- 若已安装 PostgreSQL 并打算用数据库，可取消注释并填写：

```bash
DATABASE_URL=postgresql://用户名:密码@localhost:5432/lifecode
```

### 3. 校验配置是否生效

- 启动开发服务器：`npm run dev`
- 在浏览器中：登录 → 创建档案 → 点击「开启解码」生成主报告
- 若终端无报错且报告能正常生成，说明当前厂商的 API Key 配置正确。
- 也可运行脚本测试连通性：`npx tsx scripts/test-openai-connection.ts`（脚本会根据 `LLM_PROVIDER` 选择厂商）

---

## 二、Prompt 与模型配置（可选）

若需调整主报告的生成效果，可修改以下文件（无需改代码）：

| 文件 | 作用 |
|------|------|
| `src/lib/prompts/main-report/system.md` | 角色设定、分析方法论（八字+紫微） |
| `src/lib/prompts/main-report/user-template.md` | 用户消息模板（变量 `{{IZTRO_INPUT}}`） |
| `src/lib/prompts/main-report/json-schema.json` | LLM 输出 JSON 结构约束 |
| `src/lib/prompts/main-report/config.json` | 模型名、温度、最大 token 等 |

### config.json 常用项

```json
{
  "model": "gpt-4o",           // OpenAI 模型（LLM_PROVIDER=openai 时）
  "deepseekModel": "deepseek-chat",  // DeepSeek 模型（LLM_PROVIDER=deepseek 时）
  "temperature": 0.7,          // 创造性，0~1，越高越随机
  "maxTokens": 4000            // 单次回复最大 token
}
```

修改后需重启 `npm run dev` 才会生效。

---

## 三、配置检查清单

- [ ] 已执行 `cp .env.local.example .env.local`
- [ ] 已在 `.env.local` 中填写有效的 `OPENAI_API_KEY`
- [ ] 已确认 `.env.local` 未被提交到 Git（可选：运行 `git status` 检查）
- [ ] 需要时已根据上文配置 Prompt 与 `config.json`
