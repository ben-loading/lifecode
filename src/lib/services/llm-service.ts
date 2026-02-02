/**
 * LLM 调用服务
 *
 * 支持多厂商（OpenAI / DeepSeek 等 OpenAI 兼容 API），通过环境变量选择。
 */

import OpenAI from 'openai'

export type LLMProvider = 'openai' | 'deepseek'

export interface LLMOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: { type: string }
  /** 可选：DeepSeek 模型名（当 provider=deepseek 时优先使用） */
  deepseekModel?: string
  /** 可选：请求超时毫秒数，未传则使用默认 3 分钟 */
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000

/**
 * 校验 LLM 是否已配置（用于发起报告前检查，避免扣费后生成失败）
 * 未配置时抛出带说明的 Error
 */
export function ensureLLMConfigured(): void {
  getProviderConfig()
}

function getProviderConfig(): { provider: LLMProvider; apiKey: string; baseURL?: string } {
  const explicit = (process.env.LLM_PROVIDER || '').toLowerCase() as LLMProvider | ''
  const hasDeepSeek = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'sk-...'
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-...'

  // 未配置 LLM_PROVIDER 时自动检测：有 DEEPSEEK_API_KEY 用 DeepSeek，否则用 OpenAI
  const provider: LLMProvider =
    explicit === 'deepseek' || explicit === 'openai'
      ? explicit
      : hasDeepSeek
        ? 'deepseek'
        : 'openai'

  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey || apiKey === 'sk-...') {
      throw new Error('未配置 DeepSeek：请在 Vercel 环境变量中设置 DEEPSEEK_API_KEY 和 LLM_PROVIDER=deepseek，并重新部署')
    }
    return {
      provider: 'deepseek',
      apiKey,
      baseURL: 'https://api.deepseek.com'
    }
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'sk-...') {
    throw new Error('未配置 OpenAI：请在 Vercel 环境变量中设置 OPENAI_API_KEY 和 LLM_PROVIDER=openai，并重新部署')
  }
  return { provider: 'openai', apiKey }
}

/**
 * 调用 LLM 生成报告内容（自动根据 LLM_PROVIDER 选择厂商）
 */
export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  options: LLMOptions = {}
): Promise<string> {
  const { provider, apiKey, baseURL } = getProviderConfig()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const client = new OpenAI({
    apiKey,
    baseURL,
    timeout: timeoutMs
  })

  // 模型名必须与当前 API 厂商一致（与 getProviderConfig 判定相同）
  const model =
    provider === 'deepseek'
      ? (options.deepseekModel ?? options.model ?? 'deepseek-chat')
      : (options.model ?? 'gpt-4o')

  const {
    temperature = 0.7,
    maxTokens = 4000,
    responseFormat
  } = options

  try {
    const response = await client.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat?.type === 'json_object' ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('LLM returned empty response')
    }

    return content
  } catch (error) {
    throw new Error(`LLM API call failed: ${error}`)
  }
}
