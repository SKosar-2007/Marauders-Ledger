import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface NarrativeCardProps {
  text: string
  isLoading?: boolean
}

export default function NarrativeCard({ text, isLoading }: NarrativeCardProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!text) return
    setIsTyping(true)
    setDisplayedText('')
    let i = 0
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1))
      i++
      if (i >= text.length) {
        clearInterval(timer)
        setIsTyping(false)
      }
    }, 30)
    return () => clearInterval(timer)
  }, [text])

  if (isLoading) {
    return (
      <div className="bg-[#faf3e6] p-6 rounded-lg border border-[#735c00]/20 relative">
        <div className="absolute top-0 left-6 w-[2px] h-full bg-[#dc2626]/30" />
        <div className="pl-4">
          <p className="font-crimson text-xs text-[#735c00] uppercase tracking-widest mb-3">Divination Report</p>
          <p className="font-crimson text-sm text-[#504440] italic">The Map is thinking...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#faf3e6] p-6 rounded-lg border border-[#735c00]/20 relative parchment-edge"
    >
      <div className="absolute top-0 left-6 w-[2px] h-full bg-[#dc2626]/30" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_1px_1px_0_rgba(212,175,55,0.4)] rounded-lg" />
      <div className="pl-4 relative z-10">
        <span className="font-crimson text-xs text-[#735c00] uppercase tracking-widest block mb-3">
          Divination Report
        </span>
        <p className="font-crimson text-sm text-[#2c1810] leading-relaxed">
          {displayedText}
          {isTyping && <span className="animate-pulse text-[#735c00]">|</span>}
        </p>
      </div>
    </motion.div>
  )
}
