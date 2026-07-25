import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const USERS_KEY = 'marauders_users'
const SESSION_KEY = 'marauders_session'

function getStoredUsers(): Record<string, { password: string; name: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch { return {} }
}

function storeUser(email: string, password: string, name: string) {
  const users = getStoredUsers()
  users[email] = { password, name }
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY)
      return session ? JSON.parse(session) : null
    } catch { return null }
  })

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    const users = getStoredUsers()
    if (users[email] && users[email].password === password) {
      setUser({ id: email, name: users[email].name, email })
      return true
    }
    return false
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const users = getStoredUsers()
    if (users[email]) return false
    storeUser(email, password, name)
    setUser({ id: email, name, email })
    return true
  }, [])

  const logout = useCallback(() => setUser(null), [])

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
