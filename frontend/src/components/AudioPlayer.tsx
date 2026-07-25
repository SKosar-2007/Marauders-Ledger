import { motion } from 'framer-motion'

interface AudioPlayerProps {
  audioUrl: string
  isLoading?: boolean
  error?: boolean
}

export default function AudioPlayer({ audioUrl, isLoading, error }: AudioPlayerProps) {
  const togglePlay = () => {
    if (!audioUrl) return
    const audio = new Audio(audioUrl)
    audio.play()
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
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#735c00] text-white flex items-center justify-center hover:bg-[#5a4a00] transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">play_arrow</span>
      </button>
      <div className="flex-1">
        <p className="font-crimson text-sm text-[#2c1810]">The Map speaks...</p>
        <div className="flex items-end gap-[2px] h-4 mt-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-[3px] bg-[#735c00] rounded-full"
              style={{ height: `${4 + Math.random() * 12}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
