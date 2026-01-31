/**
 * 测试 LLM API Key 连通性并模拟一次主报告生成
 *
 * 1. 从 .env.local 加载配置（LLM_PROVIDER + OPENAI_API_KEY 或 DEEPSEEK_API_KEY）
 * 2. 连通性测试：最小化请求
 * 3. 模拟生成：用 test-output/test-llm-input.json 构建 Prompt，调用 LLM，Zod 验证
 *
 * 运行: npx tsx scripts/test-openai-connection.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import OpenAI from 'openai'

type Provider = 'openai' | 'deepseek'

function getProviderAndKey(): { provider: Provider; apiKey: string; baseURL?: string; connectModel: string } {
  const explicit = (process.env.LLM_PROVIDER || '').toLowerCase() as Provider | ''
  const hasDeepSeek = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'sk-...'
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-...'

  // 未配置 LLM_PROVIDER 时自动检测：有 DEEPSEEK_API_KEY 用 DeepSeek，否则用 OpenAI
  const provider: Provider =
    explicit === 'deepseek' || explicit === 'openai' ? explicit : hasDeepSeek ? 'deepseek' : 'openai'

  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey || apiKey === 'sk-...') {
      console.error('使用 DeepSeek 时请在 .env.local 中设置 DEEPSEEK_API_KEY')
      process.exit(1)
    }
    return {
      provider: 'deepseek',
      apiKey,
      baseURL: 'https://api.deepseek.com',
      connectModel: 'deepseek-chat'
    }
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'sk-...') {
    console.error('使用 OpenAI 时请在 .env.local 中设置 OPENAI_API_KEY')
    process.exit(1)
  }
  return { provider: 'openai', apiKey, connectModel: 'gpt-4o-mini' }
}

// ==================== 加载 .env.local ====================

function loadEnvLocal(): { provider: Provider; apiKey: string; baseURL?: string; connectModel: string } {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('.env.local 不存在，请先复制 .env.local.example 并填写对应 API Key（OpenAI 或 DeepSeek）')
    process.exit(1)
  }
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=')
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        process.env[key] = value
      }
    }
  }
  const cfg = getProviderAndKey()
  console.log('已从 .env.local 加载配置')
  console.log('  厂商:', cfg.provider)
  console.log('  API Key 前 12 位:', cfg.apiKey.slice(0, 12) + '...\n')
  return cfg
}

// ==================== 1. 连通性测试 ====================

async function testConnection(
  openai: OpenAI,
  connectModel: string
): Promise<boolean> {
  console.log('--- 1. API Key 连通性测试 ---')
  try {
    const res = await openai.chat.completions.create(
      {
        model: connectModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      },
      { timeout: 90 * 1000 }
    )
    const text = res.choices[0]?.message?.content?.trim() || ''
    console.log('  响应:', text)
    console.log('  结论: API Key 连通正常\n')
    return true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('  错误:', msg)
    console.log('  结论: API Key 连通失败\n')
    return false
  }
}

// ==================== 2. 模拟主报告生成 ====================

async function simulateReportGeneration(
  openai: OpenAI,
  provider: Provider
): Promise<boolean> {
  console.log('--- 2. 模拟主报告生成（Prompt + LLM + 校验）---')

  const promptDir = path.join(process.cwd(), 'src/lib/prompts/main-report')
  const systemPath = path.join(promptDir, 'system.md')
  const userTemplatePath = path.join(promptDir, 'user-template.md')
  const configPath = path.join(promptDir, 'config.json')
  const inputPath = path.join(process.cwd(), 'test-output/test-llm-input.json')

  if (!fs.existsSync(systemPath) || !fs.existsSync(userTemplatePath) || !fs.existsSync(configPath)) {
    console.error('  缺少 Prompt 模板文件')
    return false
  }
  if (!fs.existsSync(inputPath)) {
    console.error('  缺少 test-output/test-llm-input.json，请先运行: npx tsx scripts/simulate-report-generation.ts')
    return false
  }

  const systemPrompt = fs.readFileSync(systemPath, 'utf-8')
  const userTemplate = fs.readFileSync(userTemplatePath, 'utf-8')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const iztroInput = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

  const userMessage = userTemplate.replace('{{IZTRO_INPUT}}', JSON.stringify(iztroInput, null, 2))

  const model =
    provider === 'deepseek'
      ? (config.deepseekModel ?? config.model ?? 'deepseek-chat')
      : (config.model ?? 'gpt-4o')
  console.log('  厂商:', provider, '| 模型:', model)
  console.log('  System 长度:', systemPrompt.length, '字符')
  console.log('  User 长度:', userMessage.length, '字符')
  console.log('  调用 LLM...')

  const start = Date.now()
  let rawContent: string
  try {
    const res = await openai.chat.completions.create({
      model,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4000,
      response_format: { type: 'json_object' as const },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })
    rawContent = res.choices[0]?.message?.content ?? ''
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('  LLM 调用失败:', msg)
    return false
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log('  耗时:', elapsed, '秒')
  if (!rawContent) {
    console.error('  LLM 返回为空')
    return false
  }

  // 从响应中提取 JSON（兼容 deepseek-reasoner 等带 <think> 块或 ```json 的返回）
  const { MainReportSchema, normalizeMainReportOutput, extractJsonFromResponse } = await import(
    '../src/lib/services/report-validator'
  )
  let parsed: unknown
  try {
    const jsonStr = extractJsonFromResponse(rawContent)
    parsed = JSON.parse(jsonStr)
  } catch (parseErr) {
    console.error('  LLM 返回不是合法 JSON:', parseErr)
    const rawPath = path.join(process.cwd(), 'test-output/test-llm-raw-response.txt')
    fs.writeFileSync(rawPath, rawContent, 'utf-8')
    console.error('  原始响应已写入:', rawPath)
    return false
  }
  const normalized = normalizeMainReportOutput(parsed)
  try {
    MainReportSchema.parse(normalized)
    console.log('  Zod 校验: 通过')
  } catch (zodErr) {
    console.error('  Zod 校验失败:', zodErr)
    return false
  }

  const outPath = path.join(process.cwd(), 'test-output/test-openai-generation-result.json')
  fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2), 'utf-8')
  console.log('  结果已写入:', outPath)
  console.log('  结论: 模拟生成成功\n')
  return true
}

// ==================== 主流程 ====================

async function main() {
  console.log('=== LLM API Key 连通性与主报告生成模拟 ===\n')

  const { provider, apiKey, baseURL, connectModel } = loadEnvLocal()

  const openai = new OpenAI({
    apiKey,
    baseURL,
    timeout: 3 * 60 * 1000,
  })

  const connectionOk = await testConnection(openai, connectModel)
  if (!connectionOk) {
    console.log('连通性未通过，跳过生成模拟。')
    process.exit(1)
  }

  const generateOk = await simulateReportGeneration(openai, provider)
  if (!generateOk) {
    console.log('模拟生成未通过。')
    process.exit(1)
  }

  console.log('全部检查通过。')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
