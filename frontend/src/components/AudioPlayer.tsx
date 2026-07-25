import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface AudioPlayerProps {
  audioUrl: string
  isLoading?: boolean
  error?: boolean
}

export default function AudioPlayer({ audioUrl, isLoading, error }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [bars, setBars] = useState(Array.from({ length: 24 }, () => 4 + Math.random() * 12))
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setBars(Array.from({ length: 24 }, () => 4 + Math.random() * 16))
    }, 150)
    return () => clearInterval(interval)
  }, [playing])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  const togglePlay = () => {
    if (!audioUrl) return

    if (playing && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
      setPlaying(false)
      return
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audio.play()
    audio.onended = () => {
      setPlaying(false)
      audioRef.current = null
    }
    audio.onerror = () => {
      setPlaying(false)
      audioRef.current = null
    }
    setPlaying(true)
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

  if (error || !audioUrl) {
    return (
      <div className="flex items-center gap-3 p-4 bg-[#faf3e6] rounded-lg border border-[#735c00]/20 opacity-60">
        <div className="w-10 h-10 rounded-full bg-[#735c00]/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-[#735c00]">volume_off</span>
        </div>
        <div className="flex-1">
          <p className="font-crimson text-sm text-[#2c1810]">Voice narration unavailable</p>
          <p className="font-crimson text-xs text-[#504440] italic">Set ELEVENLABS_API_KEY to enable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-[#faf3e6] rounded-lg border border-[#735c00]/20">
      <button onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#735c00] text-white flex items-center justify-center hover:bg-[#5a4a00] transition-colors flex-shrink-0">
        <span className="material-symbols-outlined text-[20px]">{playing ? 'pause' : 'play_arrow'}</span>
      </button>
      <div className="flex-1">
        <p className="font-crimson text-sm text-[#2c1810]">{playing ? 'The Map is speaking...' : 'The Map speaks...'}</p>
        <div className="flex items-end gap-[2px] h-5 mt-1">
          {bars.map((h, i) => (
            <motion.div key={i}
              className="w-[3px] bg-[#735c00] rounded-full"
              animate={{ height: playing ? h : 4 }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
