/**
 * 国际化（简繁切换）工具
 * 默认语言：繁体中文
 */

import * as OpenCC from 'opencc-js'

export type Language = 'zh-Hans' | 'zh-Hant'

const STORAGE_KEY = 'lifecode_language'

// 创建转换器实例（简体 -> 繁体）
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' })

/**
 * 获取默认语言（从 localStorage 读取，默认繁体）
 */
export function getDefaultLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-Hant' // SSR 默认繁体
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh-Hans' || stored === 'zh-Hant') {
    return stored as Language
  }
  return 'zh-Hant' // 默认繁体
}

/**
 * 保存语言偏好到 localStorage
 */
export function saveLanguage(language: Language): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, language)
}

/**
 * 将简体中文转换为繁体中文
 */
export function toTraditional(text: string): string {
  try {
    return converter(text)
  } catch {
    return text // 转换失败时返回原文
  }
}

/**
 * 根据当前语言转换文本
 * @param simplified 简体中文文本
 * @param language 当前语言
 * @returns 转换后的文本
 */
export function translate(simplified: string, language: Language): string {
  if (language === 'zh-Hans') {
    return simplified // 简体直接返回
  }
  return toTraditional(simplified) // 繁体需要转换
}

/**
 * 翻译对象（用于批量翻译）
 */
export function translateObject<T extends Record<string, string>>(
  obj: T,
  language: Language
): T {
  const result = {} as T
  for (const [key, value] of Object.entries(obj)) {
    result[key as keyof T] = translate(value, language) as T[keyof T]
  }
  return result
}

/**
 * 递归转换 JSON 对象中的所有字符串字段为繁体中文
 * 用于报告生成后的后处理转换
 * @param obj - 要转换的对象（可以是任意嵌套结构）
 * @returns 转换后的对象
 */
export function convertReportToTraditional(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'string') {
    return toTraditional(obj)
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertReportToTraditional(item))
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertReportToTraditional(value)
    }
    return result
  }
  
  return obj
}
