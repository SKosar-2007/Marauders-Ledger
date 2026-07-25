import { createContext, useContext, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface AppState {
  userId: string
  batchId: string | null
  setBatchId: (id: string) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id || '0'
  const [batchId, setBatchId] = useState<string | null>(null)

  return (
    <AppContext.Provider value={{ userId, batchId, setBatchId }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
