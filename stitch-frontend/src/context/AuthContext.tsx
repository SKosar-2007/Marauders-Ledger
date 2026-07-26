import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, setUnauthorizedHandler, type LoginResponse } from '../api/client'

interface AuthState {
  isAuthenticated: boolean
  user: LoginResponse['user'] | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<LoginResponse['user'] | null>(null)
  const [loading, setLoading] = useState(true)
  const registered = useRef(false)

  useEffect(() => {
    if (!registered.current) {
      registered.current = true
      setUnauthorizedHandler(() => {
        setUser(null)
        navigate('/login', { replace: true })
      })
    }
    const token = localStorage.getItem('omniledger_token')
    const stored = localStorage.getItem('omniledger_user')
    if (token && stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('omniledger_token') }
    }
    setLoading(false)
  }, [navigate])

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    localStorage.setItem('omniledger_token', res.access_token)
    localStorage.setItem('omniledger_user', JSON.stringify(res.user))
    setUser(res.user)
  }

  const logout = () => {
    localStorage.removeItem('omniledger_token')
    localStorage.removeItem('omniledger_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
