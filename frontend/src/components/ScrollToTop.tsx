import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scroll = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <AnimatePresence>
      {visible && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scroll}
          className="fixed bottom-6 left-[84px] z-40 w-10 h-10 rounded-full bg-[#735c00] text-white shadow-lg flex items-center justify-center hover:bg-[#5a4a00] transition-colors md bottom-6">
          <span className="material-symbols-outlined text-[20px]">keyboard_arrow_up</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
