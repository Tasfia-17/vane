'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store/useStore'

const NAV = [
  { href: '/',          label: 'Dashboard',  icon: (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  )},
  { href: '/history',   label: 'History',    icon: (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
    </svg>
  )},
  { href: '/settings',  label: 'Settings',   icon: (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
    </svg>
  )},
]

export function Nav() {
  const pathname = usePathname()
  const wsConnected = useStore(s => s.wsConnected)
  const positions = useStore(s => s.positions)

  return (
    <header className="relative z-20 border-b border-slate-800/80 bg-[#020817]/90 backdrop-blur-xl sticky top-0">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
              <path d="M10 2L10 18M4 8L10 2L16 8" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 14L10 10L18 14" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-base font-black tracking-tight text-slate-100">VANE</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {icon}
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: status */}
        <div className="flex items-center gap-3 shrink-0">
          {positions.length > 0 && (
            <span className="text-xs text-slate-600 font-mono">{positions.length} open</span>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition-all ${
            wsConnected
              ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400'
              : 'border-slate-700 bg-slate-800/50 text-slate-500'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            {wsConnected ? 'live' : 'connecting'}
          </div>
        </div>
      </div>
    </header>
  )
}
