import VoiceChatPanel from '../components/VoiceChatPanel'

export default function Messaging() {
  const messages = [
    { priority: 'Critical', sender: 'SYS_ADMIN', time: '10:42 AM', title: 'Sector 7 Node Failure Detected', desc: 'Automated diagnostic confirms loss of signal from Sector 7 cooling nodes. Initiate manual override sequence immediately to prevent cascade failure.', unread: true },
    { priority: 'Warning', sender: 'NET_OPS', time: '09:15 AM', title: 'Bandwidth Threshold Exceeded', desc: 'Traffic on primary uplink (US-WEST-01) has exceeded 85% capacity. Recommend traffic shaping or failover to secondary link.', unread: true },
    { priority: 'Info', sender: 'AUDIT', time: '08:00 AM', title: 'Daily Compliance Report', desc: 'Automated compliance check complete. 0 violations found across all 24 monitored nodes.', unread: false },
    { priority: 'Warning', sender: 'SEC_OPS', time: 'Yesterday', title: 'Failed Login Attempts Spike', desc: '12 failed login attempts detected from IP range 192.168.x.x within 5 minutes. No breach confirmed.', unread: false },
    { priority: 'Info', sender: 'SYS_ADMIN', time: 'Yesterday', title: 'Scheduled Maintenance Complete', desc: 'Core router firmware updated to v2.4.1. Zero downtime achieved.', unread: false },
  ]

  return (
    <div className="p-8">
      <div className="max-w-[1440px] mx-auto">
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter relative">
          <div className="col-span-1 md:col-span-12 relative bg-surface-container-lowest border-[3px] border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-end p-8 min-h-[30vh] overflow-hidden group">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_100%_100%,rgba(0,251,251,0.4)_0%,transparent_50%)]" />
            <div className="absolute top-0 left-0 w-full h-[3px] bg-primary" />
            <div className="relative z-10 flex flex-col gap-4 max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-primary text-on-primary font-mono text-xs uppercase border-[3px] border-primary">System Notice</span>
                <span className="font-mono text-xs text-on-surface-variant uppercase">ID: 0x9F4A.22</span>
              </div>
              <h1 className="font-display text-5xl font-bold text-on-surface uppercase leading-none tracking-tighter">Automated Dispatches</h1>
              <p className="font-body text-base text-on-surface-variant max-w-2xl mt-4">
                Centralized aggregation of all autonomous system alerts, inter-departmental communications, and critical incident reports.
              </p>
            </div>
            <div className="absolute top-8 right-8 flex items-center justify-center w-24 h-24 border-[3px] border-primary bg-secondary-container shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-pulse">
              <span className="material-symbols-outlined text-[48px] text-primary">warning</span>
            </div>
          </div>
        </section>

        <section className="mt-gutter">
          <VoiceChatPanel />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start mt-gutter">
          <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-[3px] border-primary pb-4">
              <h2 className="font-display text-2xl font-bold uppercase flex items-center gap-4">
                <span className="w-4 h-4 bg-primary block" />
                Priority Inbox
              </h2>
              <button className="px-6 py-2 border-[3px] border-primary bg-primary text-on-primary font-mono text-xs uppercase hover:bg-tertiary-fixed hover:text-on-tertiary-fixed transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:translate-x-[3px] active:shadow-none">
                Mark All Read
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <article key={i} className={`bg-surface-container-lowest border-[3px] border-primary p-6 relative group transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${msg.unread ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'opacity-70'}`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${msg.priority === 'Critical' ? 'bg-error' : msg.priority === 'Warning' ? 'bg-secondary-container' : 'bg-primary'}`} />
                  <div className="ml-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 font-mono text-[10px] uppercase border-[3px] border-primary ${msg.priority === 'Critical' ? 'bg-error text-on-error' : msg.priority === 'Warning' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface'}`}>{msg.priority}</span>
                        <span className="font-mono text-xs text-on-surface-variant">{msg.sender}</span>
                      </div>
                      <span className="font-mono text-xs text-on-surface-variant">{msg.time}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold uppercase truncate group-hover:text-error transition-colors">{msg.title}</h3>
                    <p className="font-body text-sm text-on-surface-variant line-clamp-2">{msg.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-5 border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="bg-primary px-4 py-2 border-b-[3px] border-primary flex items-center gap-3">
              <span className="material-symbols-outlined text-on-primary">notifications</span>
              <h2 className="font-display text-lg font-bold text-on-primary uppercase">Alert Summary</h2>
            </div>
            <div className="p-6 space-y-6">
              {[
                { label: 'Critical', count: 1, color: 'bg-error', textColor: 'text-error' },
                { label: 'Warnings', count: 2, color: 'bg-secondary-container', textColor: 'text-secondary' },
                { label: 'Resolved', count: 14, color: 'bg-tertiary-fixed', textColor: 'text-tertiary-container' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b-2 border-primary/20 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 ${item.color} border-2 border-primary`} />
                    <span className="font-mono text-xs uppercase text-on-surface">{item.label}</span>
                  </div>
                  <span className={`font-display text-2xl font-bold ${item.textColor}`}>{item.count.toString().padStart(2, '0')}</span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t-[3px] border-primary">
                <button className="w-full py-3 border-[3px] border-primary bg-surface-container text-on-surface font-mono text-xs uppercase hover:bg-secondary-fixed transition-colors">
                  View All Alerts
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
