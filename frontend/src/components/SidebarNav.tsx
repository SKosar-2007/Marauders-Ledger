import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { path: '/', icon: 'home', label: 'Home' },
  { path: '/dashboard', icon: 'map', label: 'Map' },
  { path: '/ledger', icon: 'list', label: 'Ledger' },
  { path: '/vault', icon: 'account_balance', label: 'Vault' },
  { path: '/pensieve', icon: 'science', label: 'Pensieve' },
  { path: '/owl-post', icon: 'mail', label: 'Owl Post' },
  { path: '/admin', icon: 'settings', label: 'Settings' },
  { path: '/profile', icon: 'person', label: 'Profile' },
]

export default function SidebarNav() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setIsOpen(false) }, [location.pathname])

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] w-10 h-10 rounded-lg bg-[#2c1810] flex items-center justify-center md:hidden shadow-lg">
        <span className="material-symbols-outlined text-[20px] text-[#d4af37]">
          {isOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[49] md:hidden" onClick={() => setIsOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-[72px] bg-[#2c1810] flex flex-col items-center py-4 z-50 shadow-xl transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="w-10 h-10 rounded-full bg-[#735c00] flex items-center justify-center mb-6 flex-shrink-0">
          <span className="text-white text-lg font-cinzel">M</span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto scrollbar-none">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${
                  isActive
                    ? 'bg-[#735c00]/20 text-[#d4af37]'
                    : 'text-[#827470] hover:text-[#d4af37] hover:bg-[#735c00]/10'
                }`
              }
              title={item.label}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="w-8 h-8 rounded-full bg-[#735c00]/30 flex items-center justify-center mt-4 flex-shrink-0">
          <span className="material-symbols-outlined text-[14px] text-[#d4af37]">settings</span>
        </div>
      </aside>
    </>
  )
}
