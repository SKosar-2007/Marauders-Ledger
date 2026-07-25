import { Link, useLocation } from 'react-router-dom'
import UserMenu from './UserMenu'

export default function Header() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <header className="fixed top-0 left-[72px] right-0 z-40 bg-[#f5e6c8]/90 backdrop-blur-sm shadow-[0_4px_12px_rgba(44,24,16,0.08)]">
      <div className="h-16 max-w-[1200px] mx-auto px-4 lg:px-10 flex items-center justify-between">
        <Link to="/" className="flex flex-col">
          <span className="font-cinzel text-sm tracking-widest text-[#2c1810] uppercase">
            The Marauder's Ledger
          </span>
          <span className="font-crimson text-[10px] text-[#735c00] italic -mt-1 tracking-tighter">
            I solemnly swear that I am up to no good
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          {['/', '/dashboard', '/mischief-list'].map((path) => (
            <Link
              key={path}
              to={path}
              className={`font-crimson text-xs transition-all px-2 py-1 ${
                isActive(path)
                  ? 'text-[#735c00] border-b-2 border-[#735c00]'
                  : 'text-[#504440] hover:text-[#735c00]'
              }`}
            >
              {path === '/' ? 'Landing' : path === '/dashboard' ? 'Dashboard' : 'Mischief List'}
            </Link>
          ))}
          <UserMenu />
        </nav>
      </div>
      <div className="gold-divider w-full" />
    </header>
  )
}
