/**
 * Prompt 模板加载器
 * 
 * 从文件系统加载 Prompt 模板，支持热更新（修改文件即生效，无需重启）
 */

import fs from 'fs'
import path from 'path'

const PROMPT_DIR = path.join(process.cwd(), 'src/lib/prompts')

export interface PromptTemplate {
  system: string
  userTemplate: string
  jsonSchema: Record<string, unknown>
  config: {
    version: string
    model: string
    deepseekModel?: string
    temperature: number
    maxTokens: number
    responseFormat?: { type: string }
  }
}

/**
 * 加载指定类型的 Prompt 模板
 * @param reportType - 报告类型，如 'main-report', 'future-fortune' 等
 */
export function loadPromptTemplate(reportType: string): PromptTemplate {
  const dir = path.join(PROMPT_DIR, reportType)
  
  try {
    const system = fs.readFileSync(path.join(dir, 'system.md'), 'utf-8')
    const userTemplate = fs.readFileSync(path.join(dir, 'user-template.md'), 'utf-8')
    const jsonSchema = JSON.parse(fs.readFileSync(path.join(dir, 'json-schema.json'), 'utf-8'))
    const config = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf-8'))
    
    return {
      system,
      userTemplate,
      jsonSchema,
      config
    }
  } catch (error) {
    throw new Error(`Failed to load prompt template for ${reportType}: ${error}`)
  }
}

/**
 * 替换模板中的变量
 * @param template - 模板字符串
 * @param variables - 变量对象
 */
export function renderTemplate(template: string, variables: Record<string, unknown>): string {
  let result = template
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    const replacement = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    result = result.replace(new RegExp(placeholder, 'g'), replacement)
  }
  
  return result
}
