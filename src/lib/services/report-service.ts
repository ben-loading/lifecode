/**
 * 报告生成主服务
 * 
 * 整合 iztro 计算、Prompt 构建、LLM 调用和结果验证的完整流程
 */

import { calculateAstrolabe } from './iztro-service'
import { buildMainReportPrompt } from './prompt-builder'
import { callLLM } from './llm-service'
import { MainReportSchema, extractJsonFromResponse, normalizeMainReportOutput, type ValidatedMainReport } from './report-validator'
import type { ApiMainReport } from '@/lib/types/api'
import { getArchiveById, createMainReport } from '@/lib/db'

/**
 * 生成主报告（完整流程）
 * @param archiveId - 档案 ID
 * @returns 验证后的主报告内容
 */
export async function generateMainReport(archiveId: string): Promise<ApiMainReport> {
  // 1. 获取档案信息
  const archive = await getArchiveById(archiveId)
  if (!archive) {
    throw new Error(`Archive not found: ${archiveId}`)
  }

  // 2. 调用 iztro 计算命盘
  const iztroInput = await calculateAstrolabe(archive)

  // 3. 构建 Prompt
  const { systemPrompt, userMessage, config } = await buildMainReportPrompt(iztroInput)

  // 4. 调用 LLM（厂商由 .env.local 的 LLM_PROVIDER 决定）
  const llmResponse = await callLLM(systemPrompt, userMessage, {
    model: config.model,
    deepseekModel: config.deepseekModel,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    responseFormat: config.responseFormat
  })

  // 5. 从响应中提取 JSON 并解析（兼容 deepseek-reasoner 等带 <think> 块或 ```json 的返回）
  let parsedContent: unknown
  try {
    const jsonStr = extractJsonFromResponse(llmResponse)
    parsedContent = JSON.parse(jsonStr)
  } catch (error) {
    throw new Error(`Failed to parse LLM response as JSON: ${error}`)
  }
  const normalizedContent = normalizeMainReportOutput(parsedContent)

  // 6. 使用 Zod 验证
  const validatedContent = MainReportSchema.parse(normalizedContent) as ValidatedMainReport

  // 7. 构造完整报告对象（带 ID 和时间戳）
  // 使用类型断言，因为 Zod 已验证数组长度符合要求
  const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const report = {
    id: reportId,
    archiveId,
    createdAt: new Date().toISOString(),
    ...validatedContent
  } as ApiMainReport

  // 8. 存储到 Supabase
  await createMainReport(report)

  return report
}
