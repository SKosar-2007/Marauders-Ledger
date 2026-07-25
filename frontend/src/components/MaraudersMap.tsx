import { useState, useRef, useEffect } from 'react'
import type { AnomalyResult } from '../types'

interface MaraudersMapProps {
  anomalies: AnomalyResult[]
  onSelectAnomaly: (id: string) => void
}

interface Location {
  id: string
  label: string
  x: number
  y: number
  r: number
}

const LOCATIONS: Location[] = [
  { id: 'hogwarts', label: 'Hogwarts', x: 300, y: 300, r: 40 },
  { id: 'hogsmeade', label: 'Hogsmeade', x: 600, y: 250, r: 30 },
  { id: 'diagon', label: 'Diagon Alley', x: 700, y: 600, r: 35 },
  { id: 'gringotts', label: 'Gringotts', x: 400, y: 650, r: 25 },
  { id: 'platform', label: 'Platform 9¾', x: 150, y: 400, r: 20 },
]

const CATEGORY_TO_LOCATION: Record<string, string> = {
  Food: 'hogwarts', Shopping: 'hogsmeade', Bills: 'gringotts',
  Entertainment: 'diagon', Travel: 'platform',
}

const PATHS = [
  { id: 'path-hogwarts-hogsmeade', d: 'M 300,300 Q 400,200 600,250' },
  { id: 'path-hogsmeade-diagon', d: 'M 600,250 Q 750,350 700,600' },
  { id: 'path-hogwarts-gringotts', d: 'M 300,300 Q 200,500 400,650' },
  { id: 'path-hogwarts-platform', d: 'M 150,400 Q 250,350 300,300' },
]

function getAnomalyPos(anomaly: AnomalyResult, seed: number): { x: number; y: number } {
  const locId = CATEGORY_TO_LOCATION[anomaly.category] || 'hogwarts'
  const loc = LOCATIONS.find((l) => l.id === locId) || LOCATIONS[0]
  const offsetX = Math.sin(seed * 13.37) * loc.r * 0.8
  const offsetY = Math.cos(seed * 7.91) * loc.r * 0.8
  return { x: loc.x + offsetX, y: loc.y + offsetY }
}

export default function MaraudersMap({ anomalies, onSelectAnomaly }: MaraudersMapProps) {
  const [scale, setScale] = useState(1)
  const [inkWipe, setInkWipe] = useState(false)
  const [footprints, setFootprints] = useState<Array<{ x: number; y: number; id: number }>>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const fpIdRef = useRef(0)

  // Animated footprint trails
  useEffect(() => {
    const interval = setInterval(() => {
      const pathEl = document.getElementById('path-hogwarts-hogsmeade') as SVGPathElement | null
      if (!pathEl || inkWipe) return
      const len = pathEl.getTotalLength()
      const progress = (Date.now() / 50) % len
      const pt = pathEl.getPointAtLength(progress)
      const id = fpIdRef.current++
      setFootprints((prev) => [...prev.slice(-15), { x: pt.x, y: pt.y, id }])
    }, 150)
    return () => clearInterval(interval)
  }, [inkWipe])

  const handleMischiefManaged = () => {
    setInkWipe(true)
    setTimeout(() => setInkWipe(false), 3000)
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#faf3e6]">
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 100px rgba(115,92,0,0.2), inset 0 0 20px rgba(44,24,16,0.1)' }} />
      <div className="absolute inset-2 border border-[#735c00]/20 pointer-events-none rounded-lg" />

      {/* Map Title */}
      <div className="absolute top-8 left-8 z-10 p-4 bg-[#faf3e6]/90 backdrop-blur-md rounded-lg shadow-sm border border-[#735c00]/20 pointer-events-none">
        <span className="font-cinzel text-sm text-[#735c00] uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>
          Hogwarts & Environs
        </span>
        <span className="font-crimson text-xs text-[#504440] italic mt-2 -ml-2">Live Tracking</span>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-20 p-2 bg-[#e8d5b0] border border-[#d4af37] rounded-full shadow-xl">
        <button onClick={() => setScale((s) => Math.min(s + 0.2, 2.5))} className="w-10 h-10 wax-seal bg-[#8b732a] text-[#f5e6c8] flex items-center justify-center shadow-md hover:scale-110 transition-all">
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
        <button onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))} className="w-10 h-10 wax-seal bg-[#8b732a] text-[#f5e6c8] flex items-center justify-center shadow-md hover:scale-110 transition-all">
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
        <div className="w-full h-px bg-[#d4af37]/30 my-1" />
        <button onClick={() => setScale(1)} className="w-10 h-10 wax-seal bg-[#c5b38a] text-[#735c00] flex items-center justify-center shadow-sm hover:scale-110 transition-all">
          <span className="material-symbols-outlined text-[20px]">explore</span>
        </button>
      </div>

      {/* Mischief Managed Button */}
      <button
        onClick={handleMischiefManaged}
        className="absolute top-8 right-8 z-20 px-6 py-2 bg-[#f5e6c8] border-2 border-[#d4af37] rounded shadow-md text-[#735c00] font-cinzel uppercase tracking-widest transition-all duration-500 hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 wax-seal"
      >
        Mischief Managed
      </button>

      {/* Ink Wipe Overlay */}
      {inkWipe && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-4 bg-[#2c1810] rounded-full" style={{ animation: 'ink-wipe-expand 1s forwards', filter: 'blur(8px)' }} />
        </div>
      )}

      {/* SVG Map */}
      <div className="w-full h-full overflow-auto p-8" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', transition: 'transform 0.7s ease-out' }}>
        <svg ref={svgRef} className="w-[150%] h-[150%] max-w-none" viewBox="0 0 1000 800">
          {/* Terrain */}
          <path d="M 100,150 Q 200,50 400,100 T 800,200 Q 900,300 850,500 T 500,700 Q 300,750 150,600 Z" fill="none" opacity="0.3" stroke="#735c00" strokeDasharray="10 5" strokeWidth="1.5" />
          <path d="M 200,250 Q 300,150 500,200 T 700,300 Q 750,400 700,550 T 450,650 Q 250,600 200,450 Z" fill="none" opacity="0.4" stroke="#5c3d2e" strokeDasharray="5 5" strokeWidth="1" />

          {/* Walking Paths */}
          {PATHS.map((p) => (
            <path key={p.id} id={p.id} d={p.d} fill="none" stroke="#735c00" strokeDasharray="4 8" strokeWidth="1" opacity="0.3" />
          ))}

          {/* Locations */}
          {LOCATIONS.map((loc) => (
            <g key={loc.id} className="cursor-pointer transition-transform hover:scale-105" transform={`translate(${loc.x}, ${loc.y})`}>
              <circle cx="0" cy="0" fill="#faf3e6" r={loc.r} stroke="#2c1810" strokeWidth="2" style={{ filter: 'drop-shadow(0px 4px 8px rgba(115,92,0,0.2))' }} />
              <path d={`M ${-loc.r*0.5},${loc.r*0.25} L 0,${-loc.r*0.6} L ${loc.r*0.5},${loc.r*0.25} Z`} fill="none" stroke="#2c1810" strokeWidth="2" />
              <rect fill="none" height={loc.r*0.4} stroke="#2c1810" strokeWidth="2" width={loc.r*0.5} x={-loc.r*0.25} y={loc.r*0.25} />
              <text fill="#2c1810" fontFamily="'Cinzel Decorative',serif" fontSize="12" fontWeight="700" textAnchor="middle" x="0" y={loc.r+15} className="uppercase tracking-wider">
                {loc.label}
              </text>
            </g>
          ))}

          {/* Anomaly Markers */}
          {!inkWipe && anomalies.map((a, i) => {
            const pos = getAnomalyPos(a, i)
            return (
              <g key={a.anomaly_id} className="cursor-pointer" onClick={() => onSelectAnomaly(a.anomaly_id)}>
                <circle cx={pos.x} cy={pos.y} fill="#dc2626" r="6" opacity="0.3">
                  <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={pos.x} cy={pos.y} fill="#dc2626" r="4" stroke="#2c1810" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.6))' }} />
              </g>
            )
          })}

          {/* Footprint Trails */}
          {!inkWipe && footprints.map((fp) => (
            <circle key={fp.id} cx={fp.x} cy={fp.y} r="2" fill="#2c1810" className="animate-trail-fade" />
          ))}
        </svg>
      </div>

      <style>{`
        @keyframes ink-wipe-expand {
          0% { transform: translate(-50%,-50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(200); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
