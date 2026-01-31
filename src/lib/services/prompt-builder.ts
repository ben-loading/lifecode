/**
 * Prompt 构建器
 * 
 * 根据命盘数据和模板生成完整的 LLM Prompt
 */

import { loadPromptTemplate, renderTemplate } from '@/lib/prompts/loader'
import type { IztroInput } from '@/lib/types/iztro-input'

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
