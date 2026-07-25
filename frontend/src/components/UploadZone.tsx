import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'

interface UploadZoneProps {
  onFileUpload: (file: File) => void
  isLoading?: boolean
}

export default function UploadZone({ onFileUpload, isLoading }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0])
      }
    },
    [onFileUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  return (
    <motion.div
      className="relative group cursor-pointer parchment-edge"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="absolute inset-0 bg-[#f4e0bb] opacity-50 rounded-xl" />
      <div
        {...getRootProps()}
        className={`absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-500 ${
          isDragActive
            ? 'border-[#735c00] bg-[#735c00]/5'
            : 'border-[#735c00]/40 group-hover:border-[#735c00]/80'
        }`}
      />
      <input {...getInputProps()} />

      <div className="relative p-12 flex flex-col items-center justify-center text-center gap-6 z-20">
        <motion.div
          className="w-20 h-20 rounded-full bg-[#f4e0bb] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(44,24,16,0.1),_0_0_0_1px_rgba(212,175,55,0.3)]"
          animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {isLoading ? (
            <motion.div
              className="w-10 h-10 border-2 border-[#735c00] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
          ) : (
            <span className="material-symbols-outlined text-[40px] text-[#735c00]">magic_button</span>
          )}
        </motion.div>

        <div className="flex flex-col gap-2">
          <h3 className="font-crimson text-lg text-[#2c1810] tracking-wide">
            {isLoading ? 'The map is analyzing...' : 'Tap wand to upload parchment'}
          </h3>
          <p className="font-crimson text-sm text-[#504440]">
            CSV files accepted.
          </p>
        </div>
      </div>

      <div className="absolute top-0 left-4 w-[2px] h-full bg-[#dc2626]/30 mix-blend-multiply" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_1px_rgba(212,175,55,0.2)] rounded-xl" />
    </motion.div>
  )
}
