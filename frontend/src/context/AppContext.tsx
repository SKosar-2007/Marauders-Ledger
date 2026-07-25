import { createContext, useContext, useState, type ReactNode } from 'react'

interface AppState {
  userId: string
  batchId: string | null
  setUserId: (id: string) => void
  setBatchId: (id: string) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>('default')
  const [batchId, setBatchId] = useState<string | null>(null)

  return (
    <AppContext.Provider value={{ userId, batchId, setUserId, setBatchId }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
