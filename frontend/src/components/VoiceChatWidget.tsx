import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceChat } from '../hooks/useVoiceChat'

export default function VoiceChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    interimTranscript,
    startListening,
    stopListening,
    sendText,
    toggleListening,
    isSupported,
  } = useVoiceChat()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleSend = () => {
    if (!inputText.trim()) return
    sendText(inputText)
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
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#735c00] text-white shadow-lg flex items-center justify-center hover:bg-[#5a4a00] transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: isListening ? '0 0 0 4px rgba(115,92,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-[24px]">close</span>
        ) : isListening ? (
          <span className="material-symbols-outlined text-[24px] animate-pulse">mic</span>
        ) : isSpeaking ? (
          <span className="material-symbols-outlined text-[24px]">volume_up</span>
        ) : (
          <span className="material-symbols-outlined text-[24px]">chat</span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] bg-[#faf3e6] rounded-xl shadow-2xl border border-[#735c00]/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#2c1810] text-[#faf3e6] px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#735c00] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">map</span>
              </div>
              <div className="flex-1">
                <h3 className="font-cinzel text-sm font-semibold">The Marauder's Map</h3>
                <p className="font-crimson text-[11px] text-[#faf3e6]/60 italic">
                  {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Ask me anything'}
                </p>
              </div>
              {!isSupported && (
                <span className="text-[10px] text-yellow-400 font-crimson">No mic</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[320px]">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[40px] text-[#735c00]/30">auto_awesome</span>
                  <p className="font-crimson text-sm text-[#504440] italic mt-2">
                    I solemnly swear I am up to no good.
                  </p>
                  <p className="font-crimson text-xs text-[#504440]/60 mt-1">
                    Tap the mic or type to begin
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
                    className={`max-w-[80%] px-3 py-2 rounded-lg font-crimson text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#735c00] text-white rounded-br-none'
                        : 'bg-[#2c1810]/10 text-[#2c1810] rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {interimTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] px-3 py-2 rounded-lg font-crimson text-sm bg-[#735c00]/50 text-white/80 rounded-br-none italic">
                    {interimTranscript}
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg bg-[#2c1810]/10 rounded-bl-none">
                    <div className="flex gap-1">
                      <motion.div className="w-2 h-2 bg-[#735c00] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.div className="w-2 h-2 bg-[#735c00] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                      <motion.div className="w-2 h-2 bg-[#735c00] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[#735c00]/10 px-4 py-3 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-white/50 border border-[#735c00]/20 rounded-lg px-3 py-2 font-crimson text-sm text-[#2c1810] placeholder-[#504440]/40 outline-none focus:border-[#735c00]/40 transition-colors"
                disabled={isProcessing || isSpeaking}
              />
              {inputText.trim() ? (
                <button
                  onClick={handleSend}
                  disabled={isProcessing || isSpeaking}
                  className="w-9 h-9 rounded-full bg-[#735c00] text-white flex items-center justify-center hover:bg-[#5a4a00] transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              ) : isSupported ? (
                <motion.button
                  onClick={toggleListening}
                  disabled={isProcessing || isSpeaking}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
                    isListening
                      ? 'bg-red-500 text-white'
                      : 'bg-[#735c00] text-white hover:bg-[#5a4a00]'
                  }`}
                  animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                  transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
                >
                  <span className="material-symbols-outlined text-[18px]">mic</span>
                </motion.button>
              ) : null}
            </div>

            {/* Listening Waveform */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 40, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#2c1810]/5 flex items-center justify-center gap-[3px] overflow-hidden"
                >
                  {Array.from({ length: 32 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[2px] bg-[#735c00] rounded-full"
                      animate={{
                        height: [4, 4 + Math.random() * 16, 4],
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
