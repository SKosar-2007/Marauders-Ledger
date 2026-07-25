import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { loginUser, registerUser, getMe } from '../services/api'

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

const SESSION_KEY = 'marauders_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY)
      return session ? JSON.parse(session) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const token = localStorage.getItem('marauders_token')
    if (token && !user) {
      getMe()
        .then((me) => {
          const u = { id: String(me.user_id), name: me.name, email: me.email }
          setUser(u)
          localStorage.setItem(SESSION_KEY, JSON.stringify(u))
        })
        .catch(() => {
          localStorage.removeItem('marauders_token')
          localStorage.removeItem(SESSION_KEY)
        })
    }
  }, [])

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginUser(email, password)
      localStorage.setItem('marauders_token', res.access_token)
      setUser({ id: String(res.user.user_id), name: res.user.name, email: res.user.email })
      return true
    } catch {
      return false
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await registerUser(name, email, password)
      localStorage.setItem('marauders_token', res.access_token)
      setUser({ id: String(res.user.user_id), name: res.user.name, email: res.user.email })
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('marauders_token')
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

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
