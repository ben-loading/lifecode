/**
 * 深度报告生成服务
 * 整合档案 + iztro + 主报告、Prompt 构建、LLM 调用、Zod 验证、落库
 */

import { getArchiveById, getMainReportByArchiveId, createDeepReport } from '@/lib/db'
import { buildFutureFortunePrompt } from './prompt-builder'
import { callLLM } from './llm-service'
import {
  extractJsonFromResponse,
  repairTruncatedJson,
  FutureFortuneReportSchema,
  normalizeFutureFortuneOutput,
  type ValidatedFutureFortuneReport,
} from './report-validator'
import type { DeepReportType } from '@/lib/costs'

export async function generateDeepReport(archiveId: string, reportType: DeepReportType): Promise<Record<string, unknown>> {
  const archive = await getArchiveById(archiveId)
  if (!archive) throw new Error(`Archive not found: ${archiveId}`)

  const mainReport = await getMainReportByArchiveId(archiveId)
  if (!mainReport) throw new Error('主报告不存在，请先完成主报告生成')

  let systemPrompt: string
  let userMessage: string
  let config: { model: string; deepseekModel?: string; temperature: number; maxTokens: number; responseFormat?: { type: string } }

  if (reportType === 'future-fortune') {
    const built = await buildFutureFortunePrompt(archiveId)
    systemPrompt = built.systemPrompt
    userMessage = built.userMessage
    config = built.config
  } else {
    throw new Error(`Unsupported deep report type: ${reportType}`)
  }

  const llmResponse = await callLLM(systemPrompt, userMessage, {
    model: config.model,
    deepseekModel: config.deepseekModel,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    responseFormat: config.responseFormat,
    timeoutMs: 5 * 60 * 1000, // 深度报告内容多，给 5 分钟超时
  })

  let parsedContent: unknown
  let jsonStr = extractJsonFromResponse(llmResponse)
  try {
    parsedContent = JSON.parse(jsonStr)
  } catch (parseErr) {
    try {
      jsonStr = repairTruncatedJson(jsonStr)
      parsedContent = JSON.parse(jsonStr)
    } catch (repairErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      const snippet = typeof llmResponse === 'string' ? llmResponse.slice(0, 600) : ''
      console.error('[deep-report] Parse failed:', msg, 'LLM response snippet:', snippet)
      throw new Error(`未来运势解析失败：${msg}`)
    }
  }

  const normalized = normalizeFutureFortuneOutput(parsedContent)
  let validatedContent: ValidatedFutureFortuneReport
  try {
    validatedContent = FutureFortuneReportSchema.parse(normalized) as ValidatedFutureFortuneReport
  } catch (validateErr) {
    const msg = validateErr instanceof Error ? validateErr.message : String(validateErr)
    console.error('[deep-report] Schema validation failed:', msg, 'normalized keys:', Object.keys(normalized as object))
    throw new Error(`未来运势校验失败：${msg}`)
  }

  const content = validatedContent as unknown as Record<string, unknown>
  await createDeepReport(archiveId, reportType, content)
  return content
}
