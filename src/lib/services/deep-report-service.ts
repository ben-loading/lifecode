/**
 * 深度报告生成服务
 * 整合档案 + iztro + 主报告、Prompt 构建、LLM 调用、Zod 验证、落库
 */

import { getArchiveById, getMainReportByArchiveId, createDeepReport, findArchiveByNormalizedBirth, getDeepReportByArchiveAndType } from '@/lib/db'
import { normalizeBirthInfo } from './birth-normalizer'
import { buildFutureFortunePrompt, buildCareerPathPrompt, buildWealthRoadPrompt, buildLoveMarriagePrompt } from './prompt-builder'
import { callLLM } from './llm-service'
import {
  extractJsonFromResponse,
  repairTruncatedJson,
  FutureFortuneReportSchema,
  normalizeFutureFortuneOutput,
  CareerPathReportSchema,
  normalizeCareerPathOutput,
  WealthRoadReportSchema,
  normalizeWealthRoadOutput,
  LoveMarriageReportSchema,
  normalizeLoveMarriageOutput,
  type ValidatedFutureFortuneReport,
  type ValidatedCareerPathReport,
  type ValidatedWealthRoadReport,
  type ValidatedLoveMarriageReport,
} from './report-validator'
import type { DeepReportType } from '@/lib/costs'
import { convertReportToTraditional } from '@/lib/i18n'

const REPORT_TYPE_LABELS: Record<DeepReportType, string> = {
  'future-fortune': '未来运势',
  'career-path': '仕途探索',
  'wealth-road': '财富之路',
  'love-marriage': '爱情姻缘',
}

/**
 * 生成深度报告
 * LLM 輸出簡體中文，然後自動轉換為繁體中文。
 */
export async function generateDeepReport(archiveId: string, reportType: DeepReportType): Promise<Record<string, unknown>> {
  const raw = typeof reportType === 'string' ? reportType.trim() : ''
  const normalizedType: DeepReportType =
    raw === 'future-fortune' ? 'future-fortune'
    : raw === 'career-path' ? 'career-path'
    : raw === 'wealth-road' ? 'wealth-road'
    : raw === 'love-marriage' ? 'love-marriage'
    : (() => {
        throw new Error(`Unsupported deep report type: ${reportType}`)
      })()

  const archive = await getArchiveById(archiveId)
  if (!archive) throw new Error(`Archive not found: ${archiveId}`)

  // 【新增】计算标准化命盘信息（日期 + 时辰）
  const normalized = normalizeBirthInfo(archive)
  
  // 【新增】查询是否有相同命盘的已有报告
  const existingArchive = await findArchiveByNormalizedBirth(
    archive.gender,
    normalized.normalizedBirthDate,
    normalized.normalizedTimeIndex,
    archiveId  // 排除当前档案
  )
  
  // 【新增】如果找到相同命盘的报告，直接复用（不调用 LLM）
  if (existingArchive) {
    const existingReport = await getDeepReportByArchiveAndType(existingArchive.id, normalizedType)
    if (existingReport) {
      // 复制报告内容到新档案，确保转换为繁体中文（兼容旧报告可能是简体的情况）
      const traditionalContent = convertReportToTraditional(existingReport.content) as Record<string, unknown>
      await createDeepReport(archiveId, normalizedType, traditionalContent)
      return traditionalContent  // 直接返回，不调用 LLM，节省成本
    }
  }

  // 如果没有复用，继续原有流程（需要主报告）
  const mainReport = await getMainReportByArchiveId(archiveId)
  if (!mainReport) throw new Error('主报告不存在，请先完成主报告生成')

  let systemPrompt: string
  let userMessage: string
  let config: { model: string; deepseekModel?: string; temperature: number; maxTokens: number; responseFormat?: { type: string } }

  if (normalizedType === 'future-fortune') {
    const built = await buildFutureFortunePrompt(archiveId)
    systemPrompt = built.systemPrompt
    userMessage = built.userMessage
    config = built.config
  } else if (normalizedType === 'career-path') {
    const built = await buildCareerPathPrompt(archiveId)
    systemPrompt = built.systemPrompt
    userMessage = built.userMessage
    config = built.config
  } else if (normalizedType === 'wealth-road') {
    const built = await buildWealthRoadPrompt(archiveId)
    systemPrompt = built.systemPrompt
    userMessage = built.userMessage
    config = built.config
  } else {
    // love-marriage
    const built = await buildLoveMarriagePrompt(archiveId)
    systemPrompt = built.systemPrompt
    userMessage = built.userMessage
    config = built.config
  }

  const llmResponse = await callLLM(systemPrompt, userMessage, {
    model: config.model,
    deepseekModel: config.deepseekModel,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    responseFormat: config.responseFormat,
    timeoutMs: 5 * 60 * 1000, // 深度报告内容多，给 5 分钟超时
  })

  const label = REPORT_TYPE_LABELS[normalizedType] ?? normalizedType
  let parsedContent: unknown
  let jsonStr = extractJsonFromResponse(llmResponse)
  try {
    parsedContent = JSON.parse(jsonStr)
  } catch (parseErr) {
    try {
      jsonStr = repairTruncatedJson(jsonStr)
      parsedContent = JSON.parse(jsonStr)
    } catch {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      // 提供更详细的错误信息，包括错误位置附近的 JSON 片段
      const errorPos = parseErr instanceof SyntaxError && 'position' in parseErr ? Number(parseErr.position) : null
      const snippet = errorPos 
        ? jsonStr.slice(Math.max(0, errorPos - 100), Math.min(jsonStr.length, errorPos + 100))
        : jsonStr.slice(0, 200)
      const llmSnippet = typeof llmResponse === 'string' ? llmResponse.slice(0, 600) : ''
      console.error('[deep-report] Parse failed:', msg, 'Error position:', errorPos, 'JSON snippet:', snippet, 'LLM response snippet:', llmSnippet)
      throw new Error(`${label}解析失敗：${msg}${errorPos ? ` (位置 ${errorPos})` : ''}`)
    }
  }

  // 标准化输出并转换为繁体中文
  if (normalizedType === 'future-fortune') {
    const normalized = normalizeFutureFortuneOutput(parsedContent)
    let validatedContent: ValidatedFutureFortuneReport
    try {
      validatedContent = FutureFortuneReportSchema.parse(normalized) as ValidatedFutureFortuneReport
    } catch (validateErr) {
      const msg = validateErr instanceof Error ? validateErr.message : String(validateErr)
      console.error('[deep-report] Schema validation failed:', msg, 'normalized keys:', Object.keys(normalized as object))
      throw new Error(`${label}校验失败：${msg}`)
    }
    // 将简体中文转换为繁体中文
    const traditionalContent = convertReportToTraditional(validatedContent) as ValidatedFutureFortuneReport
    const content = traditionalContent as unknown as Record<string, unknown>
    await createDeepReport(archiveId, normalizedType, content)
    return content
  }

  if (normalizedType === 'career-path') {
    const normalized = normalizeCareerPathOutput(parsedContent)
    let validatedContent: ValidatedCareerPathReport
    try {
      validatedContent = CareerPathReportSchema.parse(normalized) as ValidatedCareerPathReport
    } catch (validateErr) {
      const msg = validateErr instanceof Error ? validateErr.message : String(validateErr)
      console.error('[deep-report] Schema validation failed:', msg, 'normalized keys:', Object.keys(normalized as object))
      throw new Error(`${label}校验失败：${msg}`)
    }
    // 将简体中文转换为繁体中文
    const traditionalContent = convertReportToTraditional(validatedContent) as ValidatedCareerPathReport
    const content = traditionalContent as unknown as Record<string, unknown>
    await createDeepReport(archiveId, normalizedType, content)
    return content
  }

  if (normalizedType === 'wealth-road') {
    const normalized = normalizeWealthRoadOutput(parsedContent)
    let validatedContent: ValidatedWealthRoadReport
    try {
      validatedContent = WealthRoadReportSchema.parse(normalized) as ValidatedWealthRoadReport
    } catch (validateErr) {
      const msg = validateErr instanceof Error ? validateErr.message : String(validateErr)
      console.error('[deep-report] Schema validation failed:', msg, 'normalized keys:', Object.keys(normalized as object))
      throw new Error(`${label}校验失败：${msg}`)
    }
    // 将简体中文转换为繁体中文
    const traditionalContent = convertReportToTraditional(validatedContent) as ValidatedWealthRoadReport
    const content = traditionalContent as unknown as Record<string, unknown>
    await createDeepReport(archiveId, normalizedType, content)
    return content
  }

  if (normalizedType === 'love-marriage') {
    const normalized = normalizeLoveMarriageOutput(parsedContent)
    let validatedContent: ValidatedLoveMarriageReport
    try {
      validatedContent = LoveMarriageReportSchema.parse(normalized) as ValidatedLoveMarriageReport
    } catch (validateErr) {
      const msg = validateErr instanceof Error ? validateErr.message : String(validateErr)
      console.error('[deep-report] Schema validation failed:', msg, 'normalized keys:', Object.keys(normalized as object))
      throw new Error(`${label}校验失败：${msg}`)
    }
    // 将简体中文转换为繁体中文
    const traditionalContent = convertReportToTraditional(validatedContent) as ValidatedLoveMarriageReport
    const content = traditionalContent as unknown as Record<string, unknown>
    await createDeepReport(archiveId, normalizedType, content)
    return content
  }

  throw new Error(`Unsupported deep report type: ${normalizedType}`)
}
