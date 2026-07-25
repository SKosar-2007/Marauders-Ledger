import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const ok = await login(email, password)
        if (!ok) setError('Invalid credentials. Try signing up first.')
      } else {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return }
        const ok = await signup(name, email, password)
        if (!ok) setError('Account already exists.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#735c00]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-[#d4af37]/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#735c00] flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-cinzel">M</span>
          </div>
          <h1 className="font-cinzel text-2xl text-[#2c1810]">The Marauder's Ledger</h1>
          <p className="font-crimson text-sm text-[#504440] italic mt-1">I solemnly swear that I am up to no good.</p>
        </div>

        {/* Card */}
        <div className="bg-[#faf3e6] rounded-xl p-8 shadow-xl border border-[#735c00]/10">
          {/* Mode toggle */}
          <div className="flex bg-[#f4e0bb] rounded-lg p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-md font-crimson text-sm transition-all ${
                  mode === m ? 'bg-[#735c00] text-white shadow' : 'text-[#504440] hover:text-[#2c1810]'
                }`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}>
                  <label className="font-crimson text-xs text-[#504440] uppercase tracking-wider block mb-1">Wizard Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Harry Potter"
                    className="w-full px-4 py-2.5 bg-white border border-[#735c00]/20 rounded-lg font-crimson text-sm text-[#2c1810] focus:outline-none focus:border-[#735c00] transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="font-crimson text-xs text-[#504440] uppercase tracking-wider block mb-1">Owl Post (Email)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="harry@hogwarts.edu" required
                className="w-full px-4 py-2.5 bg-white border border-[#735c00]/20 rounded-lg font-crimson text-sm text-[#2c1810] focus:outline-none focus:border-[#735c00] transition-colors" />
            </div>

            <div>
              <label className="font-crimson text-xs text-[#504440] uppercase tracking-wider block mb-1">Secret Code (Password)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full px-4 py-2.5 bg-white border border-[#735c00]/20 rounded-lg font-crimson text-sm text-[#2c1810] focus:outline-none focus:border-[#735c00] transition-colors" />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="font-crimson text-sm text-[#dc2626] text-center">{error}</motion.p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#735c00] text-white rounded-lg font-cinzel text-sm tracking-widest hover:bg-[#5a4a00] transition-all disabled:opacity-50 relative overflow-hidden group">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              {loading ? 'Casting spell...' : mode === 'login' ? 'Enter the Map' : 'Create Account'}
            </button>
          </form>

          <p className="font-crimson text-xs text-[#504440] text-center mt-6">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-[#735c00] hover:text-[#2c1810] underline underline-offset-2">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
