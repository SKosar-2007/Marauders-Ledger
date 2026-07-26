import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '../hooks/useVoiceChat'

export default function VoiceChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [showHint, setShowHint] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const params = useParams()

  const {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    interimTranscript,
    sendText,
    toggleListening,
    isSupported,
    updateContext,
  } = useVoiceChat()

  const routeContext = (() => {
    const ctx: { anomaly_id?: number; batch_id?: string } = {}
    if (params.anomalyId) ctx.anomaly_id = Number(params.anomalyId)
    if (params.batchId) ctx.batch_id = params.batchId
    return ctx
  })()

  useEffect(() => {
    updateContext(routeContext)
  }, [routeContext, updateContext])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (isOpen) setShowHint(false)
    if (!isOpen) {
      const timer = setTimeout(() => setShowHint(true), 30000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleSend = () => {
    if (!inputText.trim()) return
    sendText(inputText, routeContext)
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Hint tooltip */}
      <AnimatePresence>
        {showHint && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none"
          >
            <div className="bg-[#2c1810] text-[#faf3e6] px-4 py-2 rounded-xl shadow-lg font-crimson text-sm whitespace-nowrap relative">
              <span className="font-semibold">Talk to the Map</span>
              <span className="block text-[11px] text-[#faf3e6]/70">Voice & text chat with AI</span>
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#2c1810] rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-[#735c00] to-[#5a4a00] text-white shadow-xl flex items-center justify-center hover:from-[#5a4a00] hover:to-[#3d3200] transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: isListening
            ? '0 0 0 6px rgba(115,92,0,0.3), 0 8px 24px rgba(115,92,0,0.25)'
            : '0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-[26px]">close</span>
        ) : isListening ? (
          <span className="material-symbols-outlined text-[26px] animate-pulse">mic</span>
        ) : isSpeaking ? (
          <span className="material-symbols-outlined text-[26px]">volume_up</span>
        ) : (
          <span className="material-symbols-outlined text-[26px]">auto_awesome</span>
        )}
      </motion.button>

      {/* Label beneath FAB */}
      {!isOpen && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-2 right-4 z-50 font-crimson text-[10px] text-[#504440] tracking-wider uppercase"
        >
          Voice Chat
        </motion.span>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 right-6 z-50 w-[400px] max-h-[560px] bg-[#faf3e6] rounded-2xl shadow-2xl border border-[#735c00]/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2c1810] to-[#1a0f0a] text-[#faf3e6] px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#735c00] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[22px]">map</span>
              </div>
              <div className="flex-1">
                <h3 className="font-cinzel text-sm font-semibold tracking-wider">The Marauder's Map</h3>
                <p className="font-crimson text-[11px] text-[#faf3e6]/60 italic">
                  {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Consulting the map...' : 'Ask me anything'}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[240px] max-h-[340px]">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <span className="material-symbols-outlined text-[48px] text-[#735c00]/20">auto_awesome</span>
                  <p className="font-crimson text-sm text-[#504440] italic mt-3">
                    "I solemnly swear I am up to no good."
                  </p>
                  <p className="font-crimson text-xs text-[#504440]/60 mt-2">
                    {isSupported ? 'Tap the mic or type below to begin' : 'Type a message below to begin'}
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl font-crimson text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#735c00] text-white rounded-br-md'
                        : 'bg-[#2c1810]/8 text-[#2c1810] rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {interimTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl font-crimson text-sm bg-[#735c00]/40 text-white/80 rounded-br-md italic">
                    {interimTranscript}
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-[#2c1810]/8 rounded-bl-md">
                    <div className="flex gap-1.5">
                      <motion.div className="w-2 h-2 bg-[#735c00] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.div className="w-2 h-2 bg-[#735c00] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                      <motion.div className="w-2 h-2 bg-[#735c00] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[#735c00]/10 px-4 py-3 flex items-center gap-2 bg-white/30">
              <div className="flex-1 flex items-center gap-2 bg-white/60 border border-[#735c00]/20 rounded-xl px-3 py-1.5 focus-within:border-[#735c00]/40 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent font-crimson text-sm text-[#2c1810] placeholder-[#504440]/40 outline-none"
                  disabled={isProcessing || isSpeaking}
                />
                {inputText.trim() ? (
                  <button
                    onClick={handleSend}
                    disabled={isProcessing || isSpeaking}
                    className="w-8 h-8 rounded-full bg-[#735c00] text-white flex items-center justify-center hover:bg-[#5a4a00] transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                ) : isSupported ? (
                  <motion.button
                    onClick={toggleListening}
                    disabled={isProcessing || isSpeaking}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0 ${
                      isListening
                        ? 'bg-red-500 text-white'
                        : 'bg-[#735c00] text-white hover:bg-[#5a4a00]'
                    }`}
                    animate={isListening ? { scale: [1, 1.12, 1] } : {}}
                    transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
                  >
                    <span className="material-symbols-outlined text-[16px]">mic</span>
                  </motion.button>
                ) : null}
              </div>
            </div>

            {/* Listening Waveform */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 44, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#2c1810]/5 flex items-center justify-center gap-[3px] overflow-hidden"
                >
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[2px] bg-[#735c00] rounded-full"
                      animate={{
                        height: [4, 4 + Math.random() * 20, 4],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.4 + Math.random() * 0.3,
                        delay: i * 0.03,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
