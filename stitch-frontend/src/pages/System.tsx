export default function System() {
  const logLines = [
    { level: 'info', msg: '[INIT] System boot sequence initiated. Loader v2.4.1', ts: '14:02:45' },
    { level: 'ok', msg: '[OK] Kernel modules loaded: 24/24', ts: '14:02:45' },
    { level: 'info', msg: '[NET] Peer discovery complete. 24 nodes active.', ts: '14:02:46' },
    { level: 'warn', msg: '[WARN] Latency spike detected on LATAM-01 (250ms)', ts: '14:02:47' },
    { level: 'ok', msg: '[OK] Batch #8812 reconciled. 0 errors.', ts: '14:02:48' },
    { level: 'error', msg: '[ERR] Anomaly threshold breach on TX-A4421', ts: '14:02:49' },
    { level: 'info', msg: '[AUDIT] Compliance snapshot written to chain.', ts: '14:02:50' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-12 gap-gutter h-full">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-gutter">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {[
                { label: 'Uptime', value: '99.998', unit: '%', accent: 'shadow-[4px_4px_0px_0px_rgba(252,212,0,1)]' },
                { label: 'Latency', value: '42', unit: 'ms', accent: 'shadow-[4px_4px_0px_0px_rgba(0,221,221,1)]', sparkline: true },
              ].map((metric) => (
                <div key={metric.label} className="bg-surface-container border-[3px] border-primary p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-48 transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 border-l-[3px] border-b-[3px] border-primary bg-primary/5 -mt-8 -mr-8 rotate-45" />
                  <div className="flex items-start justify-between z-10">
                    <h2 className={`font-display text-lg font-bold text-on-surface uppercase tracking-tight bg-primary text-on-primary px-3 py-1 inline-block border-[3px] border-primary ${metric.accent}`}>
                      {metric.label}
                    </h2>
                    <div className="bg-secondary-container border-[3px] border-primary px-2 py-1 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="w-3 h-3 bg-primary animate-pulse" />
                      <span className="font-mono text-xs text-on-secondary-container">LIVE</span>
                    </div>
                  </div>
                  <div className="z-10 mt-auto">
                    <span className="font-display text-5xl font-bold text-on-surface tracking-tighter block leading-none group-hover:text-primary-container transition-colors">
                      {metric.value}<span className="text-lg align-top">{metric.unit}</span>
                    </span>
                    {!metric.sparkline && <div className="w-full h-1 bg-primary mt-2 flex">
                      <div className="h-full bg-secondary-fixed w-[99.998%]" />
                    </div>}
                    {metric.sparkline && <div className="flex items-end h-12 gap-1 w-full mt-2">
                      {[2, 4, 3, 6, 8, 4, 5].map((h, i) => (
                        <div key={i} className={`w-full ${i === 4 ? 'bg-secondary-container border-t-2 border-primary' : 'bg-primary'} transition-all`} style={{ height: `${h * 12}%` }} />
                      ))}
                    </div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary flex-1 border-[3px] border-primary shadow-[6px_6px_0px_0px_rgba(0,251,251,1)] flex flex-col relative overflow-hidden">
              <div className="bg-surface-container border-b-[3px] border-primary p-3 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">terminal</span>
                  <h3 className="font-display text-base font-bold text-on-surface uppercase">System Logs</h3>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 border-[3px] border-primary bg-primary text-on-primary font-mono text-xs shadow-[2px_2px_0px_0px_rgba(252,212,0,1)] cursor-pointer hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0px_0px_rgba(252,212,0,1)] transition-all">TAIL -F</span>
                  <span className="px-2 py-1 border-[3px] border-primary bg-surface-container text-on-surface font-mono text-xs cursor-pointer hover:bg-surface-variant transition-colors">CLEAR</span>
                </div>
              </div>
              <div className="flex-1 bg-[#1e2020] p-4 font-mono text-xs leading-relaxed space-y-1 min-h-[300px] overflow-y-auto">
                {logLines.map((line, i) => (
                  <div key={i} className={`flex gap-2 ${
                    line.level === 'error' ? 'text-error' :
                    line.level === 'warn' ? 'text-secondary-container' :
                    line.level === 'ok' ? 'text-tertiary-fixed' :
                    'text-surface-dim'
                  }`}>
                    <span className="opacity-50 shrink-0">[{line.ts}]</span>
                    <span>{line.msg}</span>
                  </div>
                ))}
                <div className="flex gap-2 text-surface-dim animate-pulse mt-2">
                  <span className="opacity-50 shrink-0">[14:02:51]</span>
                  <span className="text-tertiary-fixed">_</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
            {[
              { label: 'Active Nodes', value: '24/24', status: 'Operational', color: 'bg-tertiary-fixed', barColor: 'bg-tertiary-fixed', barWidth: '100%' },
              { label: 'Avg Response', value: '12ms', status: 'Nominal', color: 'bg-secondary-container', barColor: 'bg-secondary-container', barWidth: '85%' },
              { label: 'Error Rate', value: '0.02%', status: 'Within Threshold', color: 'bg-error', barColor: 'bg-error', barWidth: '2%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-container border-[3px] border-primary p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-mono text-xs uppercase text-on-surface">{stat.label}</h3>
                  <span className={`px-2 py-0.5 border-2 border-primary font-mono text-[10px] uppercase ${stat.color} text-on-tertiary-fixed`}>{stat.status}</span>
                </div>
                <span className="font-display text-3xl font-bold text-primary">{stat.value}</span>
                <div className="w-full h-2 border-2 border-primary bg-surface-container-highest mt-3">
                  <div className={`h-full ${stat.barColor} border-r-2 border-primary`} style={{ width: stat.barWidth }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
