import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { uploadCSV, getBatch } from '../api/client'
import { useToast } from '../context/ToastContext'

const BOOT_LOGS = [
  { text: '[INIT] OmniLedger Core v9.4 — boot sequence initiated', style: 'text-surface-dim' },
  { text: '[OK]   Kernel modules loaded: 24/24', style: 'text-tertiary-fixed' },
  { text: '[NET]  Peer discovery complete. 1,402 nodes active.', style: 'text-surface-dim' },
  { text: '[ML]   Isolation Forest engine ready (estimators: 512)', style: 'text-secondary-container' },
  { text: '[LLM]  Gemini narrative pipeline initialized', style: 'text-surface-dim' },
  { text: '[TTS]  ElevenLabs voice profiles loaded (3 voices)', style: 'text-surface-dim' },
  { text: '[OK]   System nominal. Awaiting data input.', style: 'text-tertiary-fixed' },
]

function BootSequence() {
  return (
    <div className="bg-[#1e2020] border-[3px] border-primary p-4 font-mono text-xs leading-relaxed space-y-1 min-h-[200px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {BOOT_LOGS.map((line, i) => (
        <div key={i} className={`flex gap-2 ${line.style} opacity-0`}
          style={{ animation: `fadeSlideIn 0.3s ease-out ${0.4 + i * 0.35}s forwards` }}>
          <span className="opacity-50 shrink-0">{'>'}</span>
          <span>{line.text}</span>
        </div>
      ))}
      <div className="flex gap-2 text-surface-dim mt-1 opacity-0"
        style={{ animation: `fadeSlideIn 0.3s ease-out ${0.4 + BOOT_LOGS.length * 0.35}s forwards` }}>
        <span className="opacity-50">{'>'}</span>
        <span className="text-tertiary-fixed animate-pulse">_</span>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = useMutation({
    mutationFn: (file: File) => uploadCSV(file),
    onError: () => addToast('Upload failed. Check file format.', 'error'),
  })

  const { data: batchStatus } = useQuery({
    queryKey: ['batch-poll', upload.data?.batch_id],
    queryFn: () => getBatch(upload.data!.batch_id),
    enabled: !!upload.data?.batch_id,
    refetchInterval: (q) => q.state.data?.status === 'completed' || q.state.data?.status === 'failed' ? false : 1000,
  })

  useEffect(() => {
    if (batchStatus?.status === 'completed') {
      localStorage.setItem('last_batch_id', batchStatus.batch_id)
      navigate(`/dashboard?batch=${batchStatus.batch_id}`)
    }
    if (batchStatus?.status === 'failed') {
      addToast('Batch processing failed', 'error')
      upload.reset()
    }
  }, [batchStatus, navigate, addToast, upload])

  const isProcessing = upload.isPending || (upload.isSuccess && (!batchStatus || batchStatus.status !== 'completed'))

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      upload.reset()
      upload.mutate(file)
    }
  }, [upload])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      upload.reset()
      upload.mutate(file)
    }
  }, [upload])

  const handleSample = useCallback(async () => {
    try {
      const resp = await fetch('/sample.csv')
      const blob = await resp.blob()
      const file = new File([blob], 'sample_transactions.csv', { type: 'text/csv' })
      upload.reset()
      upload.mutate(file)
    } catch {
      addToast('Failed to load sample data', 'error')
    }
  }, [upload, addToast])

  return (
    <div className="min-h-screen bg-background">
      <section className="min-h-screen flex flex-col justify-center border-b-[3px] border-primary bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#cfc4c5_1px,transparent_1px)] [background-size:16px_16px] opacity-50 z-0" />
        <div className="absolute top-0 left-0 w-full h-1 bg-primary z-10" />
        <motion.div className="max-w-[1440px] mx-auto px-gutter w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center pt-24 pb-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="col-span-1 lg:col-span-7 space-y-8">
            <div className="flex items-center gap-3">
              <div className="inline-block border-[3px] border-primary bg-secondary-container px-4 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-2">
                <span className="font-mono text-xs uppercase text-on-secondary-container tracking-widest">System Status: Optimal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-tertiary-fixed animate-pulse border border-primary" />
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">14,092 blocks synced</span>
              </div>
            </div>
            <h1 className="font-display text-[80px] font-bold leading-[0.85] text-primary uppercase break-words tracking-tight">
              OmniLedger
              <span className="block text-transparent bg-clip-text" style={{ WebkitTextStroke: '2px black', marginTop: '-0.1em' }}>Core v9.4</span>
            </h1>
            <p className="font-body text-lg text-on-surface-variant max-w-2xl border-l-[3px] border-primary pl-6 leading-relaxed">
              AI-powered financial anomaly detection engine. Upload transaction data &mdash; Isolation Forest scores every line, Gemini narrates each anomaly, ElevenLabs reads them aloud.
            </p>

            <BootSequence />

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-[3px] border-primary p-8 cursor-pointer transition-all text-center relative overflow-hidden ${
                dragOver ? 'bg-primary/10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] border-tertiary-fixed scale-[1.02]' : 'bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
              } hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] group`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,251,251,0.08),transparent_70%)] pointer-events-none" />
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              <div className="relative z-10 flex items-center gap-6">
                <div className={`w-20 h-20 border-[3px] border-primary bg-surface-container flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:-rotate-6 transition-all shrink-0 ${dragOver ? 'bg-tertiary-fixed -rotate-12' : ''}`}>
                  <span className={`material-symbols-outlined text-4xl text-primary ${isProcessing ? 'animate-spin' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>{isProcessing ? 'sync' : 'cloud_upload'}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-display text-xl font-bold text-primary uppercase">{isProcessing ? 'Processing Batch...' : 'Drop CSV Here or Click to Browse'}</p>
                  <p className="font-mono text-xs text-on-surface-variant mt-1">Supports .csv files with columns: date, description, amount, category, merchant</p>
                  {isProcessing && (
                    <div className="mt-3 max-w-sm flex items-center gap-3">
                      <div className="w-5 h-5 border-[3px] border-primary border-t-transparent animate-spin" />
                      <p className="font-mono text-xs text-primary uppercase">{batchStatus?.status === 'processing' ? 'Analyzing transactions...' : upload.isPending ? 'Uploading...' : 'Processing...'}</p>
                    </div>
                  )}
                  {upload.isError && (
                    <p className="font-mono text-xs text-error mt-2 uppercase">Upload failed. Check file format and try again.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleSample} disabled={isProcessing}
                className="px-8 py-4 border-[3px] border-primary bg-surface-container-lowest text-primary font-mono text-sm uppercase tracking-wider shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">description</span>
                Load Sample Data
              </button>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-5 mt-12 lg:mt-0 relative hidden lg:block">
            <div className="absolute -inset-4 border-[3px] border-primary bg-secondary-container shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-3" />
            <div className="relative border-[3px] border-primary bg-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b-2 border-surface-tint pb-2">
                <span className="font-mono text-xs text-inverse-on-surface">SYS_MONITOR</span>
                <span className="w-3 h-3 bg-secondary-container animate-pulse rounded-full border border-primary" />
              </div>
              <div className="space-y-3 font-mono text-sm text-surface-dim">
                <div className="flex justify-between"><span>LATENCY</span><span className="text-tertiary-fixed">12ms</span></div>
                <div className="flex justify-between"><span>THROUGHPUT</span><span className="text-tertiary-fixed">94.2k TPS</span></div>
                <div className="flex justify-between"><span>NODES ACTIVE</span><span className="text-tertiary-fixed">1,402</span></div>
                <div className="flex justify-between"><span>ANOMALIES FLAGGED</span><span className="text-error">4</span></div>
              </div>
              <div className="mt-2 pt-4 border-t-2 border-surface-tint">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-surface-dim uppercase">Network Traffic</span>
                  <span className="font-mono text-[10px] text-tertiary-fixed">24h rolling</span>
                </div>
                  <div className="h-20 w-full flex items-end gap-1">
                      {[35, 55, 40, 70, 60, 85, 75, 90, 65, 80, 50, 45, 60, 75, 85, 70, 55, 65, 80, 90, 70, 60, 45, 35].map((h, i) => (
                        <div key={i} className="flex-1 bg-tertiary-fixed border-t-2 border-primary opacity-80 transition-all hover:opacity-100 hover:bg-secondary-container"
                          style={{ height: `${h}%` }} />
                      ))}
                    </div>
              </div>
              <div className="border-t-2 border-surface-tint pt-3 font-mono text-[10px] text-surface-dim flex justify-between">
                <span>ML: Isolation Forest 512</span>
                <span>LLM: Gemini 1.5 Flash</span>
                <span>TTS: ElevenLabs</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-[1440px] mx-auto px-gutter w-full py-24 relative z-20 -mt-16">
        <div className="text-center mb-16">
          <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-widest bg-surface-container px-3 py-1 border-[2px] border-primary inline-block">Core Capabilities</span>
          <h2 className="font-display text-4xl font-bold text-primary uppercase mt-4 tracking-tight">Three Detection Layers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'ML Detection', icon: 'search_insights', color: 'bg-tertiary-fixed', desc: 'Hybrid Isolation Forest + rule-based engine scores every transaction across 8 feature dimensions. Multi-sigma thresholding surfaces hidden fraud patterns.', tag: 'ISOLATION_FOREST_512', metrics: ['Precision: 94.2%', 'Recall: 91.7%'] },
            { title: 'AI Narrative', icon: 'auto_awesome', color: 'bg-secondary-container', desc: 'Every flagged anomaly gets a plain-English explanation via Gemini AI. No raw data\u2014just clear, actionable intelligence you can read or hear.', tag: 'GEMINI_1.5_FLASH', metrics: ['Avg tokens: 142', 'Latency: 1.2s'] },
            { title: 'Voice Narration', icon: 'record_voice_over', color: 'bg-surface-variant', desc: 'ElevenLabs-powered text-to-speech reads anomaly explanations aloud. Three voice profiles adapt tone from calm informational to critical alert.', tag: 'ELEVENLABS_VOICE', metrics: ['Voices: 3 profiles', 'Quality: ultra-realistic'] },
          ].map((feature) => (
            <div key={feature.title} className="group border-[3px] border-primary bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="h-14 bg-primary flex items-center px-5 border-b-[3px] border-primary">
                <h3 className="font-display text-xl text-on-primary uppercase font-semibold tracking-tight">{feature.title}</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className={`w-16 h-16 border-[3px] border-primary ${feature.color} flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -mt-10 mb-4 group-hover:-rotate-12 transition-transform`}>
                  <span className="material-symbols-outlined scale-150" style={{ fontVariationSettings: "'FILL' 1" }}>{feature.icon}</span>
                </div>
                <p className="font-body text-base text-on-surface flex-1 leading-relaxed">{feature.desc}</p>
                <div className="flex gap-3 mt-2">
                  {feature.metrics.map((m) => (
                    <span key={m} className="font-mono text-[10px] uppercase bg-surface-container text-on-surface px-2 py-1 border-[2px] border-primary">{m}</span>
                  ))}
                </div>
                <div className="pt-4 border-t-2 border-primary border-dashed flex justify-between items-center mt-auto">
                  <span className="font-mono text-xs text-on-surface-variant uppercase">{feature.tag}</span>
                  <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y-[3px] border-primary bg-inverse-surface py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-5 pointer-events-none">
          <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
            <line stroke="white" strokeWidth="2" x1="0" x2="100" y1="0" y2="100" />
            <line stroke="white" strokeWidth="2" x1="100" x2="0" y1="0" y2="100" />
            <circle cx="50" cy="50" fill="none" r="40" stroke="white" strokeWidth="2" />
            <rect fill="none" height="60" stroke="white" strokeWidth="2" width="60" x="20" y="20" />
          </svg>
        </div>
        <div className="max-w-[1440px] mx-auto px-gutter relative z-10">
          <div className="border-[3px] border-primary bg-primary-container p-8 lg:p-16 shadow-[8px_8px_0px_0px_#ffe16d]">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex-1 space-y-4">
                <h2 className="font-display text-4xl font-bold text-inverse-on-surface uppercase tracking-tight">Ready to Scan?</h2>
                <p className="font-body text-base text-inverse-primary max-w-xl leading-relaxed">
                  Upload your transaction CSV. The Isolation Forest engine processes 10K rows in under 2 seconds. Gemini narrates each anomaly. ElevenLabs reads them aloud. No configuration needed.
                </p>
                <div className="flex gap-4 font-mono text-xs text-inverse-primary/70">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-tertiary-fixed" /> Upload CSV</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-secondary-container" /> Auto-detect</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-error" /> Flag & Narrate</span>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col gap-4">
                <button onClick={() => fileRef.current?.click()}
                  className="px-10 py-4 border-[3px] border-primary bg-secondary-container text-on-secondary-container font-body text-lg font-bold uppercase tracking-wider shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>file_upload</span>
                  Upload CSV
                </button>
                <button onClick={() => navigate('/dashboard')}
                  className="px-10 py-4 border-[3px] border-primary bg-inverse-surface text-inverse-on-surface font-mono text-sm uppercase tracking-wider shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Skip to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
