import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const COMMANDS = [
  { path: '/', icon: 'home', label: 'Home', shortcut: 'g h' },
  { path: '/dashboard', icon: 'map', label: 'Map', shortcut: 'g m' },
  { path: '/ledger', icon: 'list', label: 'Ledger', shortcut: 'g l' },
  { path: '/vault', icon: 'account_balance', label: 'Vault', shortcut: 'g v' },
  { path: '/pensieve', icon: 'science', label: 'Pensieve', shortcut: 'g p' },
  { path: '/owl-post', icon: 'mail', label: 'Owl Post', shortcut: 'g w' },
  { path: '/admin', icon: 'settings', label: 'Settings', shortcut: 'g ,' },
  { path: '/profile', icon: 'person', label: 'Profile', shortcut: 'g u' },
]

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  )

  const execute = useCallback((path: string) => {
    navigate(path)
    setIsOpen(false)
    setSearch('')
  }, [navigate])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearch('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { isOpen, setIsOpen, search, setSearch, filtered, execute }
}

export default function CommandPalette() {
  const { isOpen, setIsOpen, search, setSearch, filtered, execute } = useCommandPalette()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200]" onClick={() => setIsOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] bg-[#faf3e6] rounded-xl shadow-2xl z-[201] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#735c00]/20">
              <span className="material-symbols-outlined text-[20px] text-[#735c00]">search</span>
              <input type="text" placeholder="Type a command..." value={search} onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent outline-none font-crimson text-sm text-[#2c1810] placeholder:text-[#504440]/50" />
              <kbd className="px-2 py-0.5 bg-[#735c00]/10 rounded font-mono text-[10px] text-[#504440]">ESC</kbd>
            </div>
            <div className="max-h-[300px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-crimson text-sm text-[#504440]">No commands found</p>
                </div>
              ) : (
                filtered.map((cmd) => (
                  <button key={cmd.path} onClick={() => execute(cmd.path)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#735c00]/10 transition-colors text-left">
                    <span className="material-symbols-outlined text-[18px] text-[#735c00]">{cmd.icon}</span>
                    <span className="flex-1 font-crimson text-sm text-[#2c1810]">{cmd.label}</span>
                    <kbd className="px-2 py-0.5 bg-[#735c00]/10 rounded font-mono text-[10px] text-[#504440]">{cmd.shortcut}</kbd>
                  </button>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-[#735c00]/20 flex items-center gap-4">
              <span className="font-crimson text-[10px] text-[#504440]">
                <kbd className="px-1 py-0.5 bg-[#735c00]/10 rounded">⌘K</kbd> to toggle
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
