'use client'

import React from "react"
import { createContext, useContext, useState } from 'react'

export type TransactionType = 'topup' | 'consume'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  createdAt: string
  description: string
}

/** 积分获得记录（任务、兑换码等，与充值/消费记录分开） */
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
  archiveNote?: string
  archiveName?: string
}

export interface AppContextType {
  user: UserData
  setUser: (user: UserData) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  /** 当前档案的主报告是否已生成过（用于控制报告页分析进度仅首次播放） */
  hasCompletedMainReport: boolean
  setHasCompletedMainReport: (value: boolean) => void
  balance: number
  setBalance: (value: number) => void
  transactions: Transaction[]
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
  const [user, setUser] = useState<UserData>({
    isLoggedIn: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasCompletedMainReport, setHasCompletedMainReport] = useState(false)
  const [balance, setBalanceState] = useState<number>(200) // mock 初始能量
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx_init_001',
      type: 'topup',
      amount: 200,
      createdAt: new Date().toISOString(),
      description: '初始体验能量',
    },
  ])
  const [earnRecords, setEarnRecords] = useState<EarnRecord[]>([])

  const setBalance = (value: number) => {
    setBalanceState(value)
  }

  const addTransaction = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev])
  }

  const addEarnRecord = (record: EarnRecord) => {
    setEarnRecords((prev) => [record, ...prev])
    setBalanceState((b) => b + record.amount)
  }

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
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
