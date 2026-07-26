export default function Reporting() {
  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b-[3px] border-primary pb-6 gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase bg-surface-container text-on-surface border-[2px] border-primary px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-fit">INTELLIGENCE // REPORT</span>
            <h1 className="font-display text-5xl font-bold text-primary uppercase mt-2">Reporting Center</h1>
            <p className="font-body text-base text-on-surface-variant max-w-xl">Generate, schedule, and export audit-grade intelligence reports across all data domains.</p>
          </div>
          <button className="px-6 py-3 bg-primary text-on-primary border-[3px] border-primary font-display text-sm uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            Generate Report
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="font-display text-lg font-bold uppercase mb-6 border-b-[3px] border-primary pb-2">Active Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-[10px] uppercase text-on-surface-variant block mb-2">Time Series Delta</label>
                  <div className="relative">
                    <select className="w-full appearance-none border-[3px] border-primary bg-surface-container p-4 font-mono text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-0.5 focus:translate-y-0.5 transition-all">
                      <option>Last 24 Hours</option>
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                      <option>Custom Range</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">arrow_drop_down</span>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-on-surface-variant block mb-2">Output Format Stream</label>
                  <div className="relative">
                    <select className="w-full appearance-none border-[3px] border-primary bg-surface-container p-4 font-mono text-sm outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-0.5 focus:translate-y-0.5 transition-all">
                      <option>PDF</option>
                      <option>CSV</option>
                      <option>JSON</option>
                      <option>HTML</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">arrow_drop_down</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="font-display text-lg font-bold uppercase mb-4 border-b-[3px] border-primary pb-2">Data Vector Selection</h2>
              <div className="flex flex-wrap gap-3">
                {['Anomaly Events', 'Transaction Logs', 'Access Audit', 'System Health', 'Network Topology', 'Compliance Status'].map((vec) => (
                  <button key={vec} className={`px-4 py-2 border-[3px] border-primary font-mono text-xs uppercase transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none ${
                    vec === 'Anomaly Events' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-secondary-fixed hover:text-on-secondary-fixed'
                  }`}>
                    {vec}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-primary px-6 py-3 border-b-[3px] border-primary">
                <h2 className="font-display text-base font-bold text-on-primary uppercase">Query Preview</h2>
              </div>
              <div className="p-6 bg-[#1e2020] font-mono text-xs space-y-1 min-h-[120px]">
                <div className="text-tertiary-fixed">$ SELECT * FROM anomaly_events</div>
                <div className="text-tertiary-fixed">$ WHERE timestamp &gt; NOW() - INTERVAL '24 hours'</div>
                <div className="text-tertiary-fixed">$ AND severity &gt;= 'HIGH'</div>
                <div className="text-tertiary-fixed">$ ORDER BY timestamp DESC LIMIT 100;</div>
                <div className="text-surface-dim animate-pulse mt-2">_</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="font-display text-base font-bold uppercase mb-4 border-b-[3px] border-primary pb-2">Quick Templates</h2>
              <div className="space-y-3">
                {[
                  { name: 'Daily Threat Matrix', desc: 'Summary of all security anomalies in last 24h' },
                  { name: 'Resource Drain Report', desc: 'Top resource consumers across all silos' },
                  { name: 'Create Custom Template', desc: 'Build a bespoke report configuration' },
                ].map((tmpl, i) => (
                  <div key={i} className={`border-[2px] border-primary p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${i < 2 ? 'bg-surface-container hover:bg-secondary-fixed/20' : 'border-dashed bg-surface-container-low hover:bg-surface-container'}`}>
                    <span className="font-mono text-xs uppercase text-primary font-bold block">{tmpl.name}</span>
                    <span className="font-mono text-[10px] text-on-surface-variant block mt-1">{tmpl.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="font-display text-base font-bold uppercase mb-4 border-b-[3px] border-primary pb-2">Recent Reports</h2>
              <div className="space-y-3">
                {[
                  { name: 'Weekly_Threat_Assessment.pdf', time: '2h ago' },
                  { name: 'Monthly_Compliance_Q4.csv', time: '1d ago' },
                  { name: 'Anomaly_Cluster_Report.json', time: '3d ago' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-primary/10 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">description</span>
                      <span className="font-mono text-xs text-on-surface truncate max-w-[180px]">{r.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant">{r.time}</span>
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
