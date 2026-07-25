import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface AudioPlayerProps {
  audioUrl: string
  isLoading?: boolean
}

export default function AudioPlayer({ audioUrl, isLoading }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-[#faf3e6] rounded-lg border border-[#735c00]/20">
        <div className="w-10 h-10 rounded-full bg-[#735c00]/10 flex items-center justify-center">
          <motion.div
            className="w-5 h-5 border-2 border-[#735c00] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
        </div>
        <span className="font-crimson text-sm text-[#504440] italic">The Map speaks...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-[#faf3e6] rounded-lg border border-[#735c00]/20">
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#735c00] text-white flex items-center justify-center hover:bg-[#5a4a00] transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>
      <div className="flex-1">
        <p className="font-crimson text-sm text-[#2c1810]">
          {isPlaying ? 'The Map is speaking...' : 'The Map speaks...'}
        </p>
        {/* Waveform bars */}
        <div className="flex items-end gap-[2px] h-4 mt-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-[3px] bg-[#735c00] rounded-full"
              animate={
                isPlaying
                  ? { height: [4, 12 + Math.random() * 4, 4] }
                  : { height: 4 }
              }
              transition={
                isPlaying
                  ? { repeat: Infinity, duration: 0.5 + Math.random() * 0.3, delay: i * 0.05 }
                  : {}
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
