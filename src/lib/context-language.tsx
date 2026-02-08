'use client'

import React, { createContext, useContext, useCallback } from 'react'

interface LanguageContextType {
  t: (text: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

/**
 * 语言提供者（简化版）
 * 现在只支持繁体中文，t() 函数直接返回原文（无需转换）
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // 翻译函数：直接返回原文（因为现在只有繁体，不需要转换）
  const t = useCallback((text: string) => text, [])

  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
