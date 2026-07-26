import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { path: '/', icon: 'grid_view', label: 'Overview' },
  { path: '/ledger', icon: 'menu_book', label: 'Ledger Books' },
  { path: '/transactions', icon: 'receipt_long', label: 'Transactions' },
  { path: '/anomalies', icon: 'warning', label: 'Anomalies' },
  { path: '/global-feed', icon: 'rss_feed', label: 'Global Feed' },
  { path: '/activity', icon: 'history', label: 'Activity' },
  { path: '/vault', icon: 'account_balance', label: 'Vault' },
  { path: '/analysis', icon: 'insights', label: 'Analysis' },
  { path: '/reporting', icon: 'description', label: 'Reporting' },
  { path: '/fleet', icon: 'rocket_launch', label: 'Fleet Mgmt' },
  { path: '/performance', icon: 'speed', label: 'Performance' },
  { path: '/integrations', icon: 'api', label: 'Integrations' },
  { path: '/access-control', icon: 'admin_panel_settings', label: 'Access Control' },
  { path: '/access-logs', icon: 'fingerprint', label: 'Access Logs' },
  { path: '/messaging', icon: 'mail', label: 'Messaging' },
  { path: '/system', icon: 'monitor_heart', label: 'System' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]

export default function SidebarLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex">
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low border-r-[3px] border-primary z-50 flex flex-col overflow-y-auto">
        <div className="p-6 mb-4 border-b-[3px] border-primary flex items-center gap-3 bg-secondary-container">
          <div className="w-8 h-8 bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">bolt</span>
          </div>
          <span className="font-display text-xl uppercase tracking-tighter text-on-secondary-container font-bold">OmniLedger</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 border-[3px] border-primary font-mono text-xs uppercase tracking-wider transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-secondary hover:text-on-secondary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`
              }
            >
              <span className="material-symbols-outlined mr-3 text-[18px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t-[3px] border-primary mt-4">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-[2px] border-primary bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">person</span>
              </div>
              <div>
                <p className="font-mono text-xs uppercase text-on-surface">{user?.name || user?.email || 'User'}</p>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase">Online</p>
              </div>
            </div>
            <button onClick={handleLogout} className="border-[2px] border-primary p-1.5 hover:bg-error-container transition-colors">
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-72 flex-1 min-h-screen bg-surface">
        <Outlet />
      </main>
    </div>
  )
}
