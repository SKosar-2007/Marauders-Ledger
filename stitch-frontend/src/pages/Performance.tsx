export default function Performance() {
  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-10 border-b-[3px] border-primary pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase text-surface-tint tracking-widest bg-primary text-on-primary w-fit px-2 py-1 border-[2px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">SRE // MONITOR</span>
            <h1 className="font-display text-5xl font-bold text-primary uppercase mt-2">Performance Metrics</h1>
            <p className="font-body text-base text-on-surface-variant max-w-2xl">Real-time system load, capacity benchmarking, and historical run comparisons.</p>
          </div>
          <button className="px-6 py-3 bg-secondary-container text-primary border-[3px] border-primary font-display text-sm uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined">play_arrow</span>
            Run Benchmark
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-gutter">
          <div className="lg:col-span-8 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-primary px-6 py-3 border-b-[3px] border-primary flex justify-between items-center">
              <h2 className="font-display text-base font-bold text-on-primary uppercase">Global System Load vs Capacity</h2>
              <span className="font-mono text-[10px] text-on-primary uppercase border-[2px] border-on-primary px-2">Last 24H</span>
            </div>
            <div className="p-6 h-64 bg-surface-container relative">
              <svg className="w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="100" y2="20" stroke="#000" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                <line x1="0" y1="40" x2="100" y2="40" stroke="#000" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                <line x1="0" y1="60" x2="100" y2="60" stroke="#000" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                <polygon fill="#000" opacity="0.08" points="0,80 0,60 10,55 20,50 30,45 40,55 50,40 60,50 70,35 80,45 90,30 100,35 100,80" />
                <polyline fill="none" points="0,60 10,55 20,50 30,45 40,55 50,40 60,50 70,35 80,45 90,30 100,35" stroke="#000" strokeWidth="2" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="#fcd400" strokeWidth="1.5" strokeDasharray="4,4" />
                <rect x="0" y="26" width="18" height="8" fill="#fcd400" />
                <text x="2" y="32" fill="#000" fontFamily="JetBrains Mono" fontSize="4" fontWeight="bold">CAPACITY</text>
              </svg>
            </div>
          </div>
          <div className="lg:col-span-4 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
            <h2 className="font-display text-lg font-bold uppercase mb-4 border-b-[3px] border-primary pb-2">Critical Subsystems</h2>
            <div className="space-y-5">
              {[
                { label: 'Core Routing', used: 72, color: 'bg-secondary-container' },
                { label: 'Auth Matrix', used: 45, color: 'bg-tertiary-fixed' },
                { label: 'Data Ingestion', used: 88, color: 'bg-error' },
              ].map((sys) => (
                <div key={sys.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs uppercase text-on-surface">{sys.label}</span>
                    <span className="font-mono text-xs font-bold text-primary">{sys.used}%</span>
                  </div>
                  <div className="w-full h-4 border-[3px] border-primary bg-surface-container-higher">
                    <div className={`h-full ${sys.color} border-r-[3px] border-primary transition-all`} style={{ width: `${sys.used}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t-[3px] border-primary pt-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-error border-[2px] border-primary animate-pulse" />
                <span className="font-mono text-xs uppercase text-error font-bold">Alert: Ingestion near capacity</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-primary px-6 py-3 border-b-[3px] border-primary flex justify-between items-center">
            <h2 className="font-display text-base font-bold text-on-primary uppercase">Benchmark Runs</h2>
            <button className="px-4 py-1 border-[2px] border-on-primary text-on-primary font-mono text-[10px] uppercase hover:bg-on-primary hover:text-primary transition-colors">Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b-[2px] border-primary/20 bg-surface-container font-mono text-[10px] uppercase text-on-surface">
                <div className="col-span-2">Run ID</div>
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Throughput</div>
                <div className="col-span-2">Latency p99</div>
                <div className="col-span-2">Result</div>
              </div>
              {[
                { id: 'B-128', time: '2024.10.27_14:00', dur: '1.2s', tp: '2.4 Gbps', lat: '8ms', result: 'PASS', resultColor: 'bg-tertiary-fixed text-on-tertiary-fixed' },
                { id: 'B-127', time: '2024.10.27_12:30', dur: '1.5s', tp: '1.8 Gbps', lat: '12ms', result: 'PASS', resultColor: 'bg-tertiary-fixed text-on-tertiary-fixed' },
                { id: 'B-126', time: '2024.10.27_08:00', dur: '3.2s', tp: '1.1 Gbps', lat: '45ms', result: 'WARN', resultColor: 'bg-secondary-container text-on-secondary-container' },
                { id: 'B-125', time: '2024.10.26_23:00', dur: '0.9s', tp: '3.1 Gbps', lat: '5ms', result: 'PASS', resultColor: 'bg-tertiary-fixed text-on-tertiary-fixed' },
              ].map((run) => (
                <div key={run.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-primary/10 hover:bg-surface-container-low transition-colors items-center">
                  <div className="col-span-2 font-mono text-xs font-bold text-primary">{run.id}</div>
                  <div className="col-span-2 font-mono text-xs text-on-surface-variant">{run.time}</div>
                  <div className="col-span-2 font-mono text-xs">{run.dur}</div>
                  <div className="col-span-2 font-mono text-xs font-bold">{run.tp}</div>
                  <div className="col-span-2 font-mono text-xs">{run.lat}</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 border-[2px] border-primary font-mono text-[10px] uppercase ${run.resultColor}`}>{run.result}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
