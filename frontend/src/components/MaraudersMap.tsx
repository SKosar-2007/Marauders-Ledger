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
  Food: 'hogwarts',
  Shopping: 'hogsmeade',
  Bills: 'gringotts',
  Entertainment: 'diagon',
  Travel: 'platform',
}

function getAnomalyLocation(anomaly: AnomalyResult): { x: number; y: number } {
  const locId = CATEGORY_TO_LOCATION[anomaly.category] || 'hogwarts'
  const loc = LOCATIONS.find((l) => l.id === locId) || LOCATIONS[0]
  const offsetX = (Math.random() - 0.5) * loc.r * 1.2
  const offsetY = (Math.random() - 0.5) * loc.r * 1.2
  return { x: loc.x + offsetX, y: loc.y + offsetY }
}

export default function MaraudersMap({ anomalies, onSelectAnomaly }: MaraudersMapProps) {
  return (
    <div className="w-full h-full relative overflow-auto overscroll-none p-8 bg-[#faf3e6]">
      {/* Parchment noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Map Title */}
      <div className="absolute top-8 left-8 z-10 p-4 bg-[#faf3e6]/90 backdrop-blur-md rounded-lg shadow-sm border border-[#735c00]/20 flex flex-col pointer-events-none">
        <span className="font-cinzel text-sm text-[#735c00] uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>
          Hogwarts & Environs
        </span>
        <span className="font-crimson text-xs text-[#504440] italic mt-2 -ml-2">Live Tracking</span>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 100px rgba(115, 92, 0, 0.2), inset 0 0 20px rgba(44, 24, 16, 0.1)' }} />

      {/* Gold border inner */}
      <div className="absolute inset-2 border border-[#735c00]/20 pointer-events-none rounded-lg" />

      {/* SVG Map */}
      <svg className="w-full h-full" viewBox="0 0 1000 800">
        {/* Base terrain paths */}
        <path d="M 100,150 Q 200,50 400,100 T 800,200 Q 900,300 850,500 T 500,700 Q 300,750 150,600 Z" fill="none" opacity="0.3" stroke="#735c00" strokeDasharray="10 5" strokeWidth="1.5" />
        <path d="M 200,250 Q 300,150 500,200 T 700,300 Q 750,400 700,550 T 450,650 Q 250,600 200,450 Z" fill="none" opacity="0.4" stroke="#5c3d2e" strokeDasharray="5 5" strokeWidth="1" />

        {/* Walking paths */}
        <path d="M 300,300 Q 400,200 600,250" fill="none" stroke="#735c00" strokeDasharray="4 8" strokeWidth="1" opacity="0.3" />
        <path d="M 600,250 Q 750,350 700,600" fill="none" stroke="#735c00" strokeDasharray="4 8" strokeWidth="1" opacity="0.3" />
        <path d="M 300,300 Q 200,500 400,650" fill="none" stroke="#735c00" strokeDasharray="4 8" strokeWidth="1" opacity="0.3" />
        <path d="M 150,400 Q 250,350 300,300" fill="none" stroke="#735c00" strokeDasharray="4 8" strokeWidth="1" opacity="0.3" />

        {/* Location clusters */}
        {LOCATIONS.map((loc) => (
          <g key={loc.id} className="cursor-pointer transition-transform hover:scale-105" transform={`translate(${loc.x}, ${loc.y})`}>
            <circle cx="0" cy="0" fill="#faf3e6" r={loc.r} stroke="#2c1810" strokeWidth="2" style={{ filter: 'drop-shadow(0px 4px 8px rgba(115, 92, 0, 0.2))' }} />
            <path d={`M ${-loc.r * 0.5},${loc.r * 0.25} L 0,${-loc.r * 0.6} L ${loc.r * 0.5},${loc.r * 0.25} Z`} fill="none" stroke="#2c1810" strokeWidth="2" />
            <rect fill="none" height={loc.r * 0.4} stroke="#2c1810" strokeWidth="2" width={loc.r * 0.5} x={-loc.r * 0.25} y={loc.r * 0.25} />
            <text className="uppercase tracking-wider" fill="#2c1810" fontFamily="'Cinzel Decorative', serif" fontSize="12" fontWeight="700" textAnchor="middle" x="0" y={loc.r + 15}>
              {loc.label}
            </text>
          </g>
        ))}

        {/* Anomaly markers */}
        {anomalies.map((anomaly) => {
          const pos = getAnomalyLocation(anomaly)
          return (
            <g
              key={anomaly.anomaly_id}
              className="cursor-pointer"
              onClick={() => onSelectAnomaly(anomaly.anomaly_id)}
            >
              <circle cx={pos.x} cy={pos.y} fill="#dc2626" r="6" opacity="0.3">
                <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={pos.x} cy={pos.y} fill="#dc2626" r="4" stroke="#2c1810" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 6px rgba(220, 38, 38, 0.6))' }} />
            </g>
          )
        })}

        {/* Normal transaction footprints */}
        {anomalies
          .filter((a) => !a.is_anomaly)
          .slice(0, 20)
          .map((a, i) => {
            const pos = getAnomalyLocation(a)
            return <circle key={`fp-${i}`} cx={pos.x} cy={pos.y} r="2" fill="#2c1810" opacity="0.4" />
          })}
      </svg>
    </div>
  )
}
