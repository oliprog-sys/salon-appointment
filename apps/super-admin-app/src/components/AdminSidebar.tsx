'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Revenue Analytics',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: 'Live'
    },
    {
      name: 'Salon Approvals (KYC)',
      href: '/approvals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: '2 Pending'
    },
    {
      name: 'Commission Ledgers',
      href: '/commission',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Platform Escalations',
      href: '/escalations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30">
      <div>
        {/* Command Portal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            🛡️
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-snug tracking-tight">AuraSalon HQ</h1>
            <p className="text-xs text-sky-400 font-mono">Platform Admin Portal</p>
          </div>
        </div>

        {/* Executive Sub-City Filter Badge */}
        <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 animate-pulse"></span>
            <div>
              <p className="text-xs font-bold text-slate-200">Addis Ababa Network</p>
              <p className="text-[11px] text-slate-400 font-mono">14 Active Salons</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Platform Command
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-500 rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-sky-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                    item.badge.includes('Pending')
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400 border border-slate-600 font-mono">
            HQ
          </div>
          <div>
            <p className="text-xs font-bold text-white">Super Admin HQ</p>
            <p className="text-[11px] text-slate-400 font-mono">Executive Access</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
