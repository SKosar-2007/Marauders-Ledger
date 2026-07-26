export default function Integrations() {
  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-4 border-b-[3px] border-primary gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-5xl font-bold text-primary uppercase">API Gateway</h1>
            <p className="font-body text-base text-on-surface-variant max-w-xl">Manage active data bridges, service endpoints, and inter-system payload configurations.</p>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'Active', value: '7', color: 'text-tertiary-fixed' },
              { label: 'Throttled', value: '2', color: 'text-secondary-container' },
              { label: 'Error', value: '1', color: 'text-error' },
            ].map((s) => (
              <div key={s.label} className="border-[3px] border-primary bg-surface-container-lowest px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                <span className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</span>
                <span className="font-mono text-[10px] uppercase text-on-surface-variant block">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-primary px-6 py-3 border-b-[3px] border-primary flex justify-between items-center">
                <h2 className="font-display text-base font-bold text-on-primary uppercase">Active Endpoints</h2>
                <span className="font-mono text-[10px] text-on-primary uppercase border-[2px] border-on-primary px-2">3/7 Active</span>
              </div>
              <div className="flex flex-col">
                {[
                  { name: 'Stargate Relay', protocol: 'gRPC', status: 'Connected', latency: '12ms', throughput: '1.2 Gbps', bg: '' },
                  { name: 'Quantum Bridge', protocol: 'WebSocket', status: 'Degraded', latency: '340ms', throughput: '400 Mbps', bg: 'bg-secondary-container/10' },
                  { name: 'Legacy Sync', protocol: 'REST', status: 'Connected', latency: '45ms', throughput: '800 Mbps', bg: '' },
                ].map((ep, i) => (
                  <div key={i} className={`flex items-center gap-4 px-6 py-4 border-b border-primary/10 hover:bg-surface-container-low transition-colors ${ep.bg}`}>
                    <div className={`w-3 h-3 rounded-full border-2 border-primary ${ep.status === 'Connected' ? 'bg-tertiary-fixed' : 'bg-secondary-container'}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm font-bold text-primary truncate">{ep.name}</h3>
                      <span className="font-mono text-[10px] text-on-surface-variant uppercase">{ep.protocol}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-on-surface-variant">{ep.latency}</span>
                      <span className="font-mono text-[10px] text-on-surface-variant block uppercase">{ep.throughput}</span>
                    </div>
                    <button className="px-3 py-1 border-[2px] border-primary font-mono text-[10px] uppercase hover:bg-primary hover:text-on-primary transition-colors">Details</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="font-display text-lg font-bold uppercase mb-4 border-b-[3px] border-primary pb-2">Payload Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Enable Compression', desc: 'Gzip payloads > 1KB' },
                  { label: 'TLS Mutual Auth', desc: 'mTLS for all bridges' },
                  { label: 'Audit Logging', desc: 'Log all requests/responses' },
                  { label: 'Rate Limiting', desc: '10K req/min per endpoint' },
                ].map((cfg, i) => (
                  <div key={i} className="flex items-center justify-between border-[2px] border-primary p-4 bg-surface-container">
                    <div>
                      <span className="font-mono text-xs uppercase text-primary font-bold block">{cfg.label}</span>
                      <span className="font-mono text-[10px] text-on-surface-variant">{cfg.desc}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                      <div className="w-14 h-7 bg-surface-container-highest border-[3px] border-primary peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary after:border-[3px] after:border-primary after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-on-primary" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="font-display text-lg font-bold uppercase mb-4">Create New Bridge</h2>
              <div className="flex gap-4">
                <input className="flex-1 border-[3px] border-primary bg-surface-container p-4 font-mono text-sm placeholder:text-on-surface-variant/50 outline-none focus:bg-surface-container-low" placeholder="Endpoint URL (e.g., grpc://bridge.internal:8443)" />
                <button className="px-6 py-4 bg-primary text-on-primary border-[3px] border-primary font-display text-sm uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all">Deploy</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-primary px-6 py-3 border-b-[3px] border-primary">
                <h2 className="font-display text-base font-bold text-on-primary uppercase">Traffic Volume</h2>
              </div>
              <div className="p-6 h-48 bg-surface-container relative">
                <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
                  <polygon fill="#000" opacity="0.08" points="0,60 0,40 20,35 40,45 60,25 80,30 100,15 100,60" />
                  <polyline fill="none" points="0,40 20,35 40,45 60,25 80,30 100,15" stroke="#000" strokeWidth="1.5" />
                  <polyline fill="none" points="0,50 20,48 40,52 60,45 80,47 100,42" stroke="#00fbfb" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="font-display text-base font-bold uppercase mb-4 border-b-[3px] border-primary pb-2">Latest Audit Log</h2>
              <div className="space-y-3">
                {[
                  { time: '14:02', action: 'Bridge [Stargate Relay] health check passed.' },
                  { time: '13:58', action: 'Rate limit triggered on [Quantum Bridge].' },
                  { time: '13:42', action: 'New endpoint registered: [Legacy Sync v2].' },
                ].map((entry, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-[10px] text-on-surface-variant shrink-0">{entry.time}</span>
                    <span className="font-body text-xs text-on-surface">{entry.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
