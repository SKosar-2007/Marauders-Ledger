import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getAnomaly, updateAnomalyStatus, getNarrative, getNarrativeAudio, SEVERITY_CONFIG, type NarrativeSeverity } from '../api/client'
import { useToast } from '../context/ToastContext'
import { LoadingSkeleton } from '../components/ui'

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('')
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setDisplayed('')
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1))
        idx.current++
      } else {
        clearInterval(interval)
      }
    }, 12)
    return () => clearInterval(interval)
  }, [text])

  return <span>{displayed}</span>
}

function AudioWaveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {Array.from({ length: 32 }).map((_, i) => {
        const h = 25 + Math.sin(i * 1.2) * 20 + Math.sin(i * 0.4) * 15
        return (
          <div key={i}
            className={`w-[3px] bg-current ${playing ? 'animate-waveform' : 'opacity-30'}`}
            style={{
              height: `${Math.max(15, h)}%`,
              animationDelay: playing ? `${i * 0.06}s` : '0s',
              animationDuration: playing ? `${0.6 + (i % 5) * 0.1}s` : '0s',
            }} />
        )
      })}
    </div>
  )
}

function getSeverity(score?: number): NarrativeSeverity {
  if (!score || score < 30) return 'low'
  if (score < 60) return 'medium'
  if (score < 80) return 'high'
  return 'critical'
}

export default function AnomalyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const anomalyId = Number(id)

  const { data: anomaly, isLoading } = useQuery({
    queryKey: ['anomaly', anomalyId],
    queryFn: () => getAnomaly(anomalyId),
    enabled: !!anomalyId,
  })

  const { data: narrative } = useQuery({
    queryKey: ['narrative', anomalyId],
    queryFn: () => getNarrative(anomalyId),
    enabled: !!anomalyId,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateAnomalyStatus(anomalyId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomaly', anomalyId] })
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      addToast('Status updated', 'success')
    },
    onError: () => addToast('Failed to update status', 'error'),
  })

  const handlePlay = useCallback(async () => {
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    setLoadingAudio(true)
    try {
      const blob = await getNarrativeAudio(anomalyId)
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.onended = () => setPlaying(false)
        audioRef.current.play()
        setPlaying(true)
      }
    } catch {
      addToast('Audio not available', 'error')
    } finally {
      setLoadingAudio(false)
    }
  }, [anomalyId, playing, addToast])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-[1440px] mx-auto space-y-6">
          <LoadingSkeleton lines={1} />
          <div className="grid grid-cols-12 gap-gutter">
            <div className="col-span-8"><LoadingSkeleton lines={6} /></div>
            <div className="col-span-4"><LoadingSkeleton lines={4} /></div>
          </div>
        </div>
      </div>
    )
  }

  if (!anomaly) {
    return (
      <div className="p-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="border-[3px] border-primary bg-error-container p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-mono text-sm uppercase text-on-error-container">Anomaly record not found</p>
            <button onClick={() => navigate('/anomalies')} className="mt-4 border-[2px] border-primary bg-primary text-on-primary px-4 py-2 font-mono text-xs uppercase">Back to Anomalies</button>
          </div>
        </div>
      </div>
    )
  }

  const sev = getSeverity(anomaly.score)
  const cfg = SEVERITY_CONFIG[sev]
  const isCritical = sev === 'critical'
  const narrativeText = narrative?.text || anomaly.narrative || ''

  return (
    <motion.div className="p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <audio ref={audioRef} className="hidden" />
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/anomalies')} className="border-[2px] border-primary p-2 hover:bg-surface-variant transition-colors group">
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          </button>
          <h1 className="font-display text-4xl font-bold uppercase tracking-tighter text-primary">Forensic Analysis</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className={`px-3 py-1 border-[2px] font-mono text-xs uppercase flex items-center gap-1.5 ${cfg.bg} ${cfg.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
              {cfg.label}
            </span>
            <span className={`font-mono text-sm px-4 py-2 border-[2px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isCritical ? 'bg-error text-on-error animate-pulse' : 'bg-secondary-container text-on-secondary-container'}`}>
              STATUS: {anomaly.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-gutter">
            <div className="bg-surface-container-highest border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="bg-primary px-4 py-2 border-b-[3px] border-primary flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-on-primary tracking-tight uppercase">Anomaly Profile</h2>
                <span className={`material-symbols-outlined ${isCritical ? 'text-error animate-pulse' : 'text-secondary-container'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Incident ID', value: `#ANOM-${anomaly.anomaly_id}` },
                  { label: 'Amount', value: `${anomaly.amount?.toFixed(2) || '?'} G` },
                  { label: 'Category', value: anomaly.category || 'N/A' },
                  { label: 'Merchant', value: anomaly.merchant || 'N/A' },
                  { label: 'Timestamp', value: anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleString('en-US') : 'N/A' },
                  { label: 'Confidence', value: anomaly.score ? `${anomaly.score.toFixed(1)}%` : 'N/A' },
                  { label: 'Rules Triggered', value: Array.isArray(anomaly.triggered_rules) ? anomaly.triggered_rules.length.toString() : '0' },
                  { label: 'Narrative', value: narrativeText ? 'Available' : 'Generating...' },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider">{f.label}</span>
                    <span className="font-mono text-sm text-primary font-bold">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col flex-1 relative overflow-hidden">
              <div className="bg-primary px-4 py-2 border-b-[3px] border-primary flex items-center justify-between z-10 relative">
                <h2 className="font-display text-lg font-bold text-on-primary tracking-tight uppercase">Anomaly Amplitude</h2>
                <span className="font-mono text-[10px] text-tertiary-fixed-dim uppercase tracking-widest bg-tertiary px-2 py-1 border-[2px] border-tertiary-fixed-dim">Live Stream</span>
              </div>
              <div className="flex-1 p-6 relative min-h-[300px]">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)' }} />
                <svg className="absolute inset-0 w-full h-full p-6" preserveAspectRatio="none" viewBox="0 0 1000 100">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00dddd" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00dddd" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 80 L50 75 L100 85 L150 40 L200 90 L250 88 L300 95 L350 20 L400 85 L450 90 L500 10 L550 92 L600 88 L650 95 L700 85 L750 15 L800 88 L850 90 L900 85 L950 92 L1000 80" fill="none" stroke="#00dddd" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  <polygon fill="url(#areaGrad)" points="0,80 0,100 1000,100 1000,80 950,92 900,85 850,90 800,88 750,15 700,85 650,95 600,88 550,92 500,10 450,90 400,85 350,20 300,95 250,88 200,90 150,40 100,85 50,75 0,80" />
                  <line stroke="#fcd400" strokeDasharray="8,8" strokeWidth="2" vectorEffect="non-scaling-stroke" x1="0" x2="1000" y1="50" y2="50" />
                  <rect fill="#fcd400" height="10" width="18" x="0" y="45" />
                  <text fill="#fcd400" fontFamily="JetBrains Mono" fontSize="12" x="2" y="52">THRESHOLD ALPHA</text>
                  {[[150, 40], [350, 20], [500, 10], [750, 15]].map(([cx, cy], i) => (
                    <g key={i}>
                      <circle cx={cx} cy={cy} fill="#fcd400" r="10" stroke="#000" strokeWidth="3">
                        <animate attributeName="r" dur="1.5s" from="10" repeatCount="indefinite" to="14" />
                      </circle>
                      <text fill="#fcd400" fontFamily="JetBrains Mono" fontSize="8" x={cx - 4} y={cy - 12}>ANOM-{i + 1}</text>
                    </g>
                  ))}
                </svg>
                <div className="absolute bottom-6 right-6 bg-surface-container border-[3px] border-primary p-3 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <span className="font-mono text-[10px] uppercase text-on-surface-variant">Peak Spike</span>
                  <span className="font-mono text-lg text-primary font-bold">{anomaly.amount?.toFixed(2) || '0.00'} G</span>
                </div>
              </div>
            </div>

            {narrativeText && (
              <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-primary px-4 py-2 border-b-[3px] border-primary flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-on-primary tracking-tight uppercase">AI Narrative</h2>
                  <div className="flex items-center gap-3">
                    <AudioWaveform playing={playing} />
                    <span className="font-mono text-[10px] text-on-primary/70 uppercase">ElevenLabs</span>
                    <button onClick={handlePlay} disabled={loadingAudio}
                      className={`flex items-center gap-2 px-4 py-1.5 border-[2px] border-on-primary font-mono text-xs uppercase text-on-primary hover:bg-on-primary hover:text-primary transition-all disabled:opacity-50 ${playing ? 'bg-on-primary text-primary' : ''}`}>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{playing ? 'stop' : loadingAudio ? 'hourglass_top' : 'play_arrow'}</span>
                      {playing ? 'Stop' : loadingAudio ? 'Generating...' : 'Narrate'}
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-[#1e2020] min-h-[120px]">
                  <div className="flex items-start gap-3">
                    <span className="text-tertiary-fixed font-mono text-sm mt-0.5">&gt;</span>
                    <div className="font-mono text-sm text-tertiary-fixed leading-relaxed flex-1">
                      <TypewriterText text={narrativeText} />
                      <span className="animate-pulse text-surface-dim">_</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {narrativeText && (
              <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-primary px-4 py-2 border-b-[3px] border-primary">
                  <h2 className="font-display text-lg font-bold text-on-primary tracking-tight uppercase">Case Timeline</h2>
                </div>
                <div className="p-6">
                  <div className="relative pl-8 border-l-[3px] border-primary space-y-6">
                    {[
                      { time: anomaly.timestamp || 'Unknown', title: 'Transaction Detected', desc: `${anomaly.amount?.toFixed(2)} G — ${anomaly.merchant || 'Unknown'}`, color: 'bg-primary' },
                      { time: anomaly.timestamp || 'Unknown', title: 'ML Engine Scored', desc: `Isolation Forest returned score: ${anomaly.score?.toFixed(1) || '?'}%`, color: 'bg-tertiary-fixed' },
                      ...(Array.isArray(anomaly.triggered_rules) ? anomaly.triggered_rules.map((r) => ({
                        time: anomaly.timestamp || 'Unknown', title: 'Rule Triggered', desc: r, color: 'bg-secondary-container'
                      })) : []),
                      { time: 'Now', title: 'Narrative Generated', desc: 'Gemini AI completed analysis. Ready for review.', color: 'bg-error' },
                    ].map((step, i) => (
                      <div key={i} className="relative group">
                        <div className={`absolute -left-[35px] top-1 w-4 h-4 ${step.color} border-[3px] border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:scale-125 transition-transform`} />
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[10px] text-on-surface-variant">{step.time}</span>
                          <span className={`font-mono text-[10px] uppercase px-1.5 py-0.5 border-[1px] border-primary ${step.color === 'bg-error' ? 'bg-error/20 text-error' : 'bg-surface-container text-on-surface'}`}>{step.title}</span>
                        </div>
                        <p className="font-body text-sm text-on-surface ml-0">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
            {anomaly.status !== 'valid' && anomaly.status !== 'fraud' && (
              <>
                <button onClick={() => statusMutation.mutate('valid')} disabled={statusMutation.isPending}
                  className="w-full bg-secondary-container border-[3px] border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-on-secondary-container group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="font-display text-lg font-bold text-on-secondary-container uppercase tracking-tight">Mark Valid</span>
                </button>
                <button onClick={() => statusMutation.mutate('fraud')} disabled={statusMutation.isPending}
                  className="w-full bg-error border-[3px] border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-on-error group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
                  <span className="font-display text-lg font-bold text-on-error uppercase tracking-tight">Confirm Fraud</span>
                </button>
              </>
            )}
            {anomaly.status === 'valid' && (
              <div className="bg-surface-container border-[3px] border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,251,251,0.08),transparent_70%)] pointer-events-none" />
                <span className="material-symbols-outlined text-4xl text-secondary-container relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-mono text-sm uppercase text-on-surface relative z-10">Marked as Valid</span>
                <p className="font-mono text-[10px] text-on-surface-variant relative z-10">This transaction was reviewed and cleared</p>
                <button onClick={() => statusMutation.mutate('pending')} className="mt-2 font-mono text-xs underline text-on-surface-variant hover:text-primary relative z-10">Undo</button>
              </div>
            )}
            {anomaly.status === 'fraud' && (
              <div className="bg-error-container border-[3px] border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(186,26,26,0.1),transparent_70%)] pointer-events-none" />
                <span className="material-symbols-outlined text-4xl text-on-error-container group-hover:scale-110 transition-transform relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                <span className="font-mono text-sm uppercase text-on-error-container relative z-10">Confirmed Fraud</span>
                <p className="font-mono text-[10px] text-on-error-container relative z-10">Flagged for investigation and reporting</p>
                <button onClick={() => statusMutation.mutate('pending')} className="mt-2 font-mono text-xs underline text-on-error-container hover:text-primary relative z-10">Undo</button>
              </div>
            )}

            {Array.isArray(anomaly.triggered_rules) && anomaly.triggered_rules.length > 0 && (
              <div className="bg-surface border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                <div className="bg-primary px-4 py-2 border-b-[3px] border-primary">
                  <h2 className="font-display text-base font-bold text-on-primary tracking-tight uppercase">Triggered Rules</h2>
                </div>
                <div className="p-4 space-y-2">
                  {anomaly.triggered_rules.map((rule, i) => {
                    const icons = ['rule', 'trending_up', 'schedule', 'person_search', 'content_copy', 'priority']
                    return (
                      <div key={i} className="flex items-center gap-2 font-mono text-xs border-[2px] border-primary px-3 py-2 bg-surface-container hover:bg-surface-variant transition-colors group">
                        <span className="material-symbols-outlined text-[14px] text-error group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>{icons[i % icons.length]}</span>
                        <span>{rule}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-surface-container-lowest border-[3px] border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
              <h3 className="font-mono text-[10px] uppercase text-on-surface-variant mb-3">Actions</h3>
              <div className="flex flex-col gap-2">
                {[
                  { icon: 'download', label: 'Download Report' },
                  { icon: 'link', label: 'Copy Share Link' },
                  { icon: 'flag', label: 'Flag for Review' },
                ].map((action) => (
                  <button key={action.label} className="flex items-center gap-2 py-2 px-3 border-[2px] border-primary font-mono text-xs uppercase bg-surface-container hover:bg-surface-variant hover:-translate-y-0.5 transition-all text-left">
                    <span className="material-symbols-outlined text-sm">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
