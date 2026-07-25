import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full bg-[#2c1810] flex items-center justify-center hover:bg-[#735c00] transition-colors shadow-md ring-2 ring-[#735c00]/30 hover:ring-[#735c00]/60"
        title={user.name}>
        <span className="text-white font-cinzel text-xs font-bold">{initials}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-[#faf3e6] rounded-xl shadow-2xl border border-[#735c00]/15 overflow-hidden z-50">

            {/* User card */}
            <div className="p-4 bg-[#f4e0bb]/50 border-b border-[#735c00]/10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#2c1810] flex items-center justify-center shadow-md ring-2 ring-[#735c00]/40">
                <span className="text-white font-cinzel text-sm font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cinzel text-sm text-[#2c1810] truncate">{user.name}</p>
                <p className="font-crimson text-xs text-[#504440] truncate">{user.email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="py-2">
              <button onClick={() => { setOpen(false); navigate('/profile') }}
                className="w-full px-4 py-2.5 flex items-center gap-3 font-crimson text-sm text-[#2c1810] hover:bg-[#735c00]/5 transition-colors text-left">
                <span className="material-symbols-outlined text-[18px] text-[#735c00]">person</span>
                My Profile
              </button>
              <button onClick={() => { setOpen(false); navigate('/admin') }}
                className="w-full px-4 py-2.5 flex items-center gap-3 font-crimson text-sm text-[#2c1810] hover:bg-[#735c00]/5 transition-colors text-left">
                <span className="material-symbols-outlined text-[18px] text-[#735c00]">settings</span>
                Settings
              </button>
              <div className="mx-4 my-1 border-t border-[#735c00]/10" />
              <button onClick={handleLogout}
                className="w-full px-4 py-2.5 flex items-center gap-3 font-crimson text-sm text-[#dc2626] hover:bg-[#dc2626]/5 transition-colors text-left">
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
