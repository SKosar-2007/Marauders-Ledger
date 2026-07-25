import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface SpendChartProps {
  data: Array<{ day: string; amount: number; hasAnomaly?: boolean }>
}

export default function SpendChart({ data }: SpendChartProps) {
  return (
    <div className="absolute bottom-0 w-full p-6 bg-[#faf3e6]/95 backdrop-blur-md border-t border-[#735c00]/20 z-20">
      <div className="flex justify-between items-end mb-2">
        <span className="font-cinzel text-sm text-[#2c1810]">Mischief Volume</span>
        <span className="font-mono text-xs text-[#735c00]">Last 7 Days</span>
      </div>
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: '#faf3e6',
                border: '1px solid #735c00',
                borderRadius: '8px',
                fontFamily: "'Crimson Pro', serif",
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#735c00"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (payload.hasAnomaly) {
                  return (
                    <g key={`dot-${cx}-${cy}`}>
                      <circle cx={cx} cy={cy} r={6} fill="#dc2626" opacity={0.3}>
                        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={cx} cy={cy} r={4} fill="#dc2626" stroke="#2c1810" strokeWidth={1} />
                    </g>
                  )
                }
                return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#d4af37" stroke="#2c1810" strokeWidth={1} />
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
