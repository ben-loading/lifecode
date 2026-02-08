'use client'

import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'
import { getSession, flushPendingInviteRef, savePendingInviteRefFromUrl, getTransactions, setOnUnauthorized, setToken } from './api-client'
import { getSupabaseClient } from './supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export type TransactionType = 'topup' | 'consume'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  createdAt: string
  description: string
}

export interface EarnRecord {
  id: string
  amount: number
  reason: string
  createdAt: string
}

export interface UserData {
  email?: string
  isLoggedIn: boolean
  name?: string
  gender?: 'male' | 'female'
  birthDate?: string
  birthLocation?: string
  birthCalendar?: 'solar' | 'lunar'
  birthTimeMode?: 'datetime' | 'shichen'
  birthTimeBranch?: number
  lunarDate?: string
  isLeapMonth?: boolean
  archiveNote?: string
  archiveName?: string
  currentArchiveId?: string
  inviteRef?: string
}

export interface AppContextType {
  user: UserData
  setUser: (user: UserData | ((prev: UserData) => UserData)) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  hasCompletedMainReport: boolean
  setHasCompletedMainReport: (value: boolean) => void
  balance: number
  setBalance: (value: number) => void
  transactions: Transaction[]
  setTransactions: (list: Transaction[]) => void
  addTransaction: (tx: Transaction) => void
  earnRecords: EarnRecord[]
  addEarnRecord: (record: EarnRecord) => void
  analysisProgress?: {
    current: number
    total: number
    steps: string[]
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>({ isLoggedIn: false })
  const [isLoading, setIsLoading] = useState(false)
  const [hasCompletedMainReport, setHasCompletedMainReport] = useState(false)
  const [balance, setBalanceState] = useState<number>(0)
  const [transactions, setTransactionsState] = useState<Transaction[]>([])
  const [earnRecords, setEarnRecords] = useState<EarnRecord[]>([])

  const setBalance = (value: number) => setBalanceState(value)
  const setTransactions = (list: Transaction[]) => setTransactionsState(list)
  const addTransaction = (tx: Transaction) => setTransactionsState((prev) => [tx, ...prev])
  const addEarnRecord = (record: EarnRecord) => {
    setEarnRecords((prev) => [record, ...prev])
    // 注意：不再自动增加余额，余额应该由服务器端返回的值控制
    // 避免重复增加余额（如兑换码兑换时，服务器已更新余额）
    // setBalanceState((b) => b + record.amount)
  }

  useEffect(() => {
    savePendingInviteRefFromUrl()
  }, [])

  useEffect(() => {
    setOnUnauthorized(() => setUser({ isLoggedIn: false }))
    return () => setOnUnauthorized(null)
  }, [])

  useEffect(() => {
    try {
      const supabase = getSupabaseClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          setToken(session.access_token)
        }
        if (event === 'SIGNED_OUT') {
          setUser({ isLoggedIn: false })
        }
      })
      return () => subscription.unsubscribe()
    } catch {
      return () => {}
    }
  }, [])

  useEffect(() => {
    const initSession = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          setToken(session.access_token)
        }
        const res = await getSession()
        if (res?.user) {
          setUser({
            isLoggedIn: true,
            email: res.user.email,
            name: res.user.name,
            inviteRef: res.user.inviteRef,
          })
          setBalanceState(res.user.balance)
          await flushPendingInviteRef()
          getTransactions().then((r) => setTransactionsState(r.transactions)).catch(() => {})
        }
      } catch {
        // 环境未配置或网络失败时保持未登录状态，不抛错
      }
    }
    initSession()
  }, [])

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        setIsLoading,
        hasCompletedMainReport,
        setHasCompletedMainReport,
        balance,
        setBalance,
        transactions,
        setTransactions,
        addTransaction,
        earnRecords,
        addEarnRecord,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used within AppProvider')
  return context
}
