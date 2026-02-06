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
import { getArchiveById, createMainReport, findArchiveByNormalizedBirth, getMainReportByArchiveId } from '@/lib/db'
import { normalizeBirthInfo } from './birth-normalizer'

/**
 * 生成主报告（完整流程）
 * 严格使用该档案在 DB 中已保存的性别、八字、命盘等，不依赖前端或会话状态。
 * @param archiveId - 档案 ID
 * @returns 验证后的主报告内容
 */
export async function generateMainReport(archiveId: string): Promise<ApiMainReport> {
  // 1. 从 DB 获取档案（性别、出生日期/时辰、地区等）
  const archive = await getArchiveById(archiveId)
  if (!archive) {
    throw new Error(`Archive not found: ${archiveId}`)
  }

  // 2. 【新增】计算标准化命盘信息（日期 + 时辰）
  const normalized = normalizeBirthInfo(archive)
  
  // 3. 【新增】查询是否有相同命盘的已有报告
  const existingArchive = await findArchiveByNormalizedBirth(
    archive.gender,
    normalized.normalizedBirthDate,
    normalized.normalizedTimeIndex,
    archiveId  // 排除当前档案
  )
  
  // 4. 【新增】如果找到相同命盘的报告，直接复用（不调用 LLM）
  if (existingArchive) {
    const existingReport = await getMainReportByArchiveId(existingArchive.id)
    if (existingReport) {
      // 复制报告内容到新档案
      const newReport: ApiMainReport = {
        ...existingReport,
        id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        archiveId: archiveId,
        createdAt: new Date().toISOString()
      }
      await createMainReport(newReport)
      return newReport  // 直接返回，不调用 LLM，节省成本
    }
  }

  // 5. 如果没有找到，继续原有流程（调用 LLM）
  // 用档案数据计算命盘（iztro）
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
