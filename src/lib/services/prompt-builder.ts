/**
 * Prompt 构建器
 * 
 * 根据命盘数据和模板生成完整的 LLM Prompt
 */

import { loadPromptTemplate, renderTemplate } from '@/lib/prompts/loader'
import type { IztroInput } from '@/lib/types/iztro-input'
import { getArchiveById, getMainReportByArchiveId } from '@/lib/db'
import { calculateAstrolabe } from './iztro-service'

export interface BuiltPrompt {
  systemPrompt: string
  userMessage: string
  config: {
    model: string
    deepseekModel?: string
    temperature: number
    maxTokens: number
    responseFormat?: { type: string }
  }
}

/**
 * 构建主报告生成 Prompt
 * @param iztroInput - iztro 计算的命盘数据
 * @returns 完整的 Prompt（system + user message）
 */
export async function buildMainReportPrompt(iztroInput: IztroInput): Promise<BuiltPrompt> {
  // 加载模板
  const template = loadPromptTemplate('main-report')
  
  // 渲染 user message（替换 {{IZTRO_INPUT}} 变量）
  const userMessage = renderTemplate(template.userTemplate, {
    IZTRO_INPUT: JSON.stringify(iztroInput, null, 2)
  })
  
  return {
    systemPrompt: template.system,
    userMessage,
    config: template.config
  }
}

/**
 * 构建未来运势深度报告 Prompt
 * 输入：档案 ID；内部拉取档案、iztro 命盘、主报告，组装 GENDER、IZTRO_INPUT、MAIN_REPORT。
 */
export async function buildFutureFortunePrompt(archiveId: string): Promise<BuiltPrompt> {
  const archive = await getArchiveById(archiveId)
  if (!archive) throw new Error(`Archive not found: ${archiveId}`)
  const iztroInput = await calculateAstrolabe(archive)
  const mainReport = await getMainReportByArchiveId(archiveId)
  const mainReportSummary = mainReport
    ? {
        lifeScriptTitle: mainReport.lifeScriptTitle,
        lifeScriptDescription: mainReport.lifeScriptDescription,
        coreAbility: mainReport.coreAbility,
        baziDisplay: mainReport.baziDisplay,
        yearlyDetails: mainReport.yearlyDetails,
        palaceAnalysis: mainReport.palaceAnalysis,
      }
    : {}
  const template = loadPromptTemplate('future-fortune')
  const userMessage = renderTemplate(template.userTemplate, {
    GENDER: archive.gender === 'male' ? '男' : '女',
    IZTRO_INPUT: JSON.stringify(iztroInput, null, 2),
    MAIN_REPORT: JSON.stringify(mainReportSummary, null, 2),
  })
  return {
    systemPrompt: template.system,
    userMessage,
    config: template.config,
  }
}

/**
 * 构建仕途探索深度报告 Prompt
 * 输入与未来运势一致：档案 ID；内部拉取档案、iztro 命盘、主报告，组装 GENDER、IZTRO_INPUT、MAIN_REPORT。
 */
export async function buildCareerPathPrompt(archiveId: string): Promise<BuiltPrompt> {
  const archive = await getArchiveById(archiveId)
  if (!archive) throw new Error(`Archive not found: ${archiveId}`)
  const iztroInput = await calculateAstrolabe(archive)
  const mainReport = await getMainReportByArchiveId(archiveId)
  const mainReportSummary = mainReport
    ? {
        lifeScriptTitle: mainReport.lifeScriptTitle,
        lifeScriptDescription: mainReport.lifeScriptDescription,
        coreAbility: mainReport.coreAbility,
        baziDisplay: mainReport.baziDisplay,
        yearlyDetails: mainReport.yearlyDetails,
        palaceAnalysis: mainReport.palaceAnalysis,
      }
    : {}
  const template = loadPromptTemplate('career-path')
  const userMessage = renderTemplate(template.userTemplate, {
    GENDER: archive.gender === 'male' ? '男' : '女',
    IZTRO_INPUT: JSON.stringify(iztroInput, null, 2),
    MAIN_REPORT: JSON.stringify(mainReportSummary, null, 2),
  })
  return {
    systemPrompt: template.system,
    userMessage,
    config: template.config,
  }
}

/**
 * 构建财富之路深度报告 Prompt
 * 输入与未来运势、仕途探索一致：档案 ID；内部拉取档案、iztro 命盘、主报告，组装 GENDER、IZTRO_INPUT、MAIN_REPORT。
 */
export async function buildWealthRoadPrompt(archiveId: string): Promise<BuiltPrompt> {
  const archive = await getArchiveById(archiveId)
  if (!archive) throw new Error(`Archive not found: ${archiveId}`)
  const iztroInput = await calculateAstrolabe(archive)
  const mainReport = await getMainReportByArchiveId(archiveId)
  const mainReportSummary = mainReport
    ? {
        lifeScriptTitle: mainReport.lifeScriptTitle,
        lifeScriptDescription: mainReport.lifeScriptDescription,
        coreAbility: mainReport.coreAbility,
        baziDisplay: mainReport.baziDisplay,
        yearlyDetails: mainReport.yearlyDetails,
        palaceAnalysis: mainReport.palaceAnalysis,
      }
    : {}
  const template = loadPromptTemplate('wealth-road')
  const userMessage = renderTemplate(template.userTemplate, {
    GENDER: archive.gender === 'male' ? '男' : '女',
    IZTRO_INPUT: JSON.stringify(iztroInput, null, 2),
    MAIN_REPORT: JSON.stringify(mainReportSummary, null, 2),
  })
  return {
    systemPrompt: template.system,
    userMessage,
    config: template.config,
  }
}

/**
 * 构建爱情姻缘深度报告 Prompt
 * 输入与未来运势、仕途探索、财富之路一致：档案 ID；内部拉取档案、iztro 命盘、主报告，组装 GENDER、IZTRO_INPUT、MAIN_REPORT。
 */
export async function buildLoveMarriagePrompt(archiveId: string): Promise<BuiltPrompt> {
  const archive = await getArchiveById(archiveId)
  if (!archive) throw new Error(`Archive not found: ${archiveId}`)
  const iztroInput = await calculateAstrolabe(archive)
  const mainReport = await getMainReportByArchiveId(archiveId)
  const mainReportSummary = mainReport
    ? {
        lifeScriptTitle: mainReport.lifeScriptTitle,
        lifeScriptDescription: mainReport.lifeScriptDescription,
        coreAbility: mainReport.coreAbility,
        baziDisplay: mainReport.baziDisplay,
        yearlyDetails: mainReport.yearlyDetails,
        palaceAnalysis: mainReport.palaceAnalysis,
      }
    : {}
  const template = loadPromptTemplate('love-marriage')
  const userMessage = renderTemplate(template.userTemplate, {
    GENDER: archive.gender === 'male' ? '男' : '女',
    IZTRO_INPUT: JSON.stringify(iztroInput, null, 2),
    MAIN_REPORT: JSON.stringify(mainReportSummary, null, 2),
  })
  return {
    systemPrompt: template.system,
    userMessage,
    config: template.config,
  }
}
