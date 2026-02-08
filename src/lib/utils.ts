import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useCallback, useRef } from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 防抖 hook，用于防止快速连续点击
 * @param callback 要防抖的回调函数
 * @param delay 防抖延迟时间（毫秒），默认 500ms
 * @returns 防抖后的回调函数
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 设置新的定时器
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  return debouncedCallback
}
