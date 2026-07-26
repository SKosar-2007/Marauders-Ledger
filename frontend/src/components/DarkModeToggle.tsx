import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark'
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button onClick={() => setDark(!dark)}
      className="fixed top-4 right-4 z-[60] w-10 h-10 rounded-full bg-[#2c1810] shadow-lg flex items-center justify-center hover:bg-[#1a1a2e] transition-colors"
      title={dark ? 'Switch to Lumos' : 'Switch to Nox'}>
      <motion.span className="material-symbols-outlined text-[18px] text-[#d4af37]"
        animate={{ rotate: dark ? 180 : 0 }} transition={{ duration: 0.3 }}>
        {dark ? 'light_mode' : 'dark_mode'}
      </motion.span>
    </button>
  )
}
