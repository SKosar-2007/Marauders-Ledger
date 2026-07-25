import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnomalyResult } from '../types'

interface MaraudersMapProps {
  anomalies: AnomalyResult[]
  onSelectAnomaly: (id: string) => void
}

interface Location {
  id: string
  label: string
  icon: string
  x: number
  y: number
}

const LOCATIONS: Location[] = [
  { id: 'hogwarts', label: 'Hogwarts', icon: 'M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z', x: 300, y: 280 },
  { id: 'hogsmeade', label: 'Hogsmeade', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', x: 580, y: 200 },
  { id: 'diagon', label: 'Diagon Alley', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z', x: 680, y: 520 },
  { id: 'gringotts', label: 'Gringotts', icon: 'M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z', x: 380, y: 580 },
  { id: 'platform', label: 'Platform 9¾', icon: 'M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm-1 14c-.83 0-1.5-.67-1.5-1.5S10.17 13 11 13s1.5.67 1.5 1.5S11.83 16 11 16zm2-5c-.83 0-1.5-.67-1.5-1.5S12.17 8 13 8s1.5.67 1.5 1.5S13.83 11 13 11z', x: 140, y: 380 },
]

const CATEGORY_TO_LOCATION: Record<string, string> = {
  Food: 'hogwarts', Shopping: 'hogsmeade', Bills: 'gringotts',
  Entertainment: 'diagon', Travel: 'platform',
}

const PATHS = [
  'M 300,280 C 380,220 480,210 580,200',
  'M 580,200 C 640,300 680,400 680,520',
  'M 300,280 C 320,400 350,500 380,580',
  'M 140,380 C 200,340 260,300 300,280',
  'M 680,520 C 560,560 460,580 380,580',
]

function getAnomalyPos(anomaly: AnomalyResult, index: number): { x: number; y: number } {
  const locId = CATEGORY_TO_LOCATION[anomaly.category] || 'hogwarts'
  const loc = LOCATIONS.find((l) => l.id === locId) || LOCATIONS[0]
  const angle = (index * 137.508) * Math.PI / 180
  const radius = 30 + (index % 3) * 15
  return { x: loc.x + Math.cos(angle) * radius, y: loc.y + Math.sin(angle) * radius }
}

const SEVERITY_CONFIG = {
  high: { color: '#dc2626', glow: 'rgba(220,38,38,0.15)', label: 'Dementor' },
  medium: { color: '#d4af37', glow: 'rgba(212,175,55,0.15)', label: 'Boggart' },
  low: { color: '#2d6a4f', glow: 'rgba(45,106,79,0.15)', label: 'Peeves' },
}

export default function MaraudersMap({ anomalies, onSelectAnomaly }: MaraudersMapProps) {
  const [scale, setScale] = useState(1)
  const [inkWipe, setInkWipe] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [footprints, setFootprints] = useState<Array<{ x: number; y: number; id: number; angle: number }>>([])
  const fpIdRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (inkWipe) return
      const pathIndex = Math.floor(Math.random() * PATHS.length)
      const pathEl = document.getElementById(`map-path-${pathIndex}`) as SVGPathElement | null
      if (!pathEl) return
      const len = pathEl.getTotalLength()
      const progress = (Date.now() / 80) % len
      const pt = pathEl.getPointAtLength(progress)
      const nextPt = pathEl.getPointAtLength(Math.min(progress + 2, len))
      const angle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * 180 / Math.PI
      const id = fpIdRef.current++
      setFootprints((prev) => [...prev.slice(-20), { x: pt.x, y: pt.y, id, angle }])
    }, 200)
    return () => clearInterval(interval)
  }, [inkWipe])

  const handleMischiefManaged = () => {
    setInkWipe(true)
    setFootprints([])
    setTimeout(() => setInkWipe(false), 2500)
  }

  const anomalyCounts = anomalies.reduce((acc, a) => {
    const loc = CATEGORY_TO_LOCATION[a.category] || 'hogwarts'
    acc[loc] = (acc[loc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#faf3e6]">
      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 120px rgba(115,92,0,0.15), inset 0 0 40px rgba(44,24,16,0.05)'
      }} />

      {/* Border frame */}
      <div className="absolute inset-3 border border-[#735c00]/15 pointer-events-none rounded-lg" />
      <div className="absolute inset-4 border border-[#735c00]/8 pointer-events-none rounded-lg" />

      {/* Map Title */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="bg-[#faf3e6]/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#735c00]/15 shadow-sm">
          <h2 className="font-cinzel text-sm text-[#735c00] tracking-widest">HOGWARTS & ENVIRONS</h2>
          <p className="font-crimson text-[10px] text-[#504440] italic">Marauder's Map — Live Tracking</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-6 right-6 z-10 pointer-events-none">
        <div className="bg-[#faf3e6]/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-[#735c00]/15 shadow-sm space-y-1">
          {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="font-crimson text-[10px] text-[#504440]">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
        <div className="bg-[#faf3e6] border border-[#735c00]/20 rounded-lg shadow-lg overflow-hidden">
          <button onClick={() => setScale((s) => Math.min(s + 0.2, 2.5))}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#735c00]/10 transition-colors text-[#735c00]">
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <div className="w-full h-px bg-[#735c00]/10" />
          <button onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#735c00]/10 transition-colors text-[#735c00]">
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <div className="w-full h-px bg-[#735c00]/10" />
          <button onClick={() => setScale(1)}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#735c00]/10 transition-colors text-[#735c00]">
            <span className="material-symbols-outlined text-[18px]">explore</span>
          </button>
        </div>
      </div>

      {/* Mischief Managed Button */}
      <div className="absolute bottom-6 left-6 z-20">
        <button onClick={handleMischiefManaged}
          className="px-5 py-2 bg-[#faf3e6] border border-[#735c00]/30 rounded-lg shadow-md font-cinzel text-xs text-[#735c00] uppercase tracking-widest hover:bg-[#735c00]/5 hover:border-[#735c00]/50 transition-all active:scale-95">
          Mischief Managed
        </button>
      </div>

      {/* Ink Wipe Overlay */}
      <AnimatePresence>
        {inkWipe && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none">
            <motion.div initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 100, opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: 'radial-gradient(circle, #2c1810 0%, transparent 70%)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Map */}
      <div className="w-full h-full overflow-auto p-6" style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        transition: 'transform 0.5s ease-out'
      }}>
        <svg className="w-full h-full" viewBox="0 0 850 700" style={{ minWidth: '700', minHeight: '580' }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Terrain contours */}
          <path d="M 80,120 Q 180,40 350,80 T 650,160 Q 750,250 720,420 T 400,600 Q 220,640 120,500 Z"
            fill="none" stroke="#735c00" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.2" />
          <path d="M 150,200 Q 280,120 450,170 T 620,280 Q 660,380 620,500 T 380,580 Q 200,540 150,380 Z"
            fill="none" stroke="#735c00" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.15" />

          {/* Paths between locations */}
          {PATHS.map((d, i) => (
            <path key={i} id={`map-path-${i}`} d={d} fill="none" stroke="#735c00" strokeWidth="1.2"
              strokeDasharray="6 6" opacity="0.2" />
          ))}

          {/* Footprint trails */}
          {!inkWipe && footprints.map((fp) => (
            <g key={fp.id} transform={`translate(${fp.x}, ${fp.y}) rotate(${fp.angle})`} opacity="0.4">
              <ellipse cx="-3" cy="0" rx="2" ry="3.5" fill="#2c1810" />
              <ellipse cx="3" cy="2" rx="2" ry="3.5" fill="#2c1810" />
            </g>
          ))}

          {/* Location markers */}
          {LOCATIONS.map((loc) => {
            const count = anomalyCounts[loc.id] || 0
            const isSelected = selectedLocation === loc.id
            return (
              <g key={loc.id} className="cursor-pointer" onClick={() => setSelectedLocation(isSelected ? null : loc.id)}
                filter="url(#softShadow)">
                {/* Location background */}
                <circle cx={loc.x} cy={loc.y} r="28" fill="#faf3e6" stroke="#735c00" strokeWidth="1.5" opacity="0.9" />
                <circle cx={loc.x} cy={loc.y} r="28" fill="none" stroke="#735c00" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />

                {/* Location icon */}
                <g transform={`translate(${loc.x - 12}, ${loc.y - 12})`}>
                  <path d={loc.icon} fill="#735c00" opacity="0.7" />
                </g>

                {/* Location label */}
                <text x={loc.x} y={loc.y + 42} textAnchor="middle" fill="#2c1810"
                  fontFamily="'Cinzel Decorative',serif" fontSize="10" fontWeight="700" letterSpacing="0.5">
                  {loc.label.toUpperCase()}
                </text>

                {/* Anomaly count badge */}
                {count > 0 && (
                  <g>
                    <circle cx={loc.x + 20} cy={loc.y - 20} r="8" fill="#dc2626" />
                    <text x={loc.x + 20} y={loc.y - 16} textAnchor="middle" fill="white"
                      fontFamily="'JetBrains Mono',monospace" fontSize="8" fontWeight="bold">
                      {count}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Anomaly markers — ink quill style */}
          {!inkWipe && anomalies.map((a, i) => {
            const pos = getAnomalyPos(a, i)
            const cfg = SEVERITY_CONFIG[a.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.low
            return (
              <g key={a.anomaly_id} className="cursor-pointer" onClick={() => onSelectAnomaly(a.anomaly_id)}>
                {/* Outer ring — subtle */}
                <circle cx={pos.x} cy={pos.y} r="10" fill="none" stroke={cfg.color} strokeWidth="0.5" opacity="0.3" />
                {/* Main dot */}
                <circle cx={pos.x} cy={pos.y} r="4" fill={cfg.color} opacity="0.8" />
                {/* Inner highlight */}
                <circle cx={pos.x} cy={pos.y} r="1.5" fill="white" opacity="0.4" />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
