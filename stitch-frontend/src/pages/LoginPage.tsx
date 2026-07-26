import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('test@test.com')
  const [password, setPassword] = useState('test123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('ACCESS DENIED: Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-14 bg-primary flex items-center px-6 border-b-[3px] border-primary">
            <span className="font-display text-lg text-on-primary uppercase tracking-wider font-bold">OmniLedger Access</span>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="relative">
              <label className="absolute -top-3 left-4 bg-surface-container-lowest px-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant border-x-2 border-t-2 border-primary">IDENTIFICATION</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border-[3px] border-primary py-4 px-4 font-mono text-sm focus:outline-none focus:bg-tertiary-fixed focus:border-primary transition-colors"
                placeholder="Enter user ID"
                required
              />
            </div>
            <div className="relative">
              <label className="absolute -top-3 left-4 bg-surface-container-lowest px-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant border-x-2 border-t-2 border-primary">ACCESS CODE</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border-[3px] border-primary py-4 px-4 font-mono text-sm focus:outline-none focus:bg-tertiary-fixed focus:border-primary transition-colors"
                placeholder="Enter passkey"
                required
              />
            </div>
            {error && (
              <div className="border-[3px] border-primary bg-error-container p-4">
                <p className="font-mono text-sm text-on-error-container uppercase tracking-wider">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 border-[3px] border-primary bg-secondary-container text-on-secondary-container font-mono text-sm uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'Initialize Session'}
              <span className="material-symbols-outlined">lock_open</span>
            </button>
          </form>
        </div>
        <p className="font-mono text-xs text-on-surface-variant uppercase text-center mt-6 tracking-wider">
          System ready. Awaiting authorization.
        </p>
      </div>
    </div>
  )
}
