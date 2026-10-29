'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  currentPath?: string;
}

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Timetable & Bookings',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: 'Live'
    },
    {
      name: 'Service Catalog',
      href: '/services',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      name: 'Staff & Schedules',
      href: '/staff',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Marketing & Ads',
      href: '/marketing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-900 font-extrabold text-xl shadow-md">
            A
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-snug tracking-tight">AuraSalon</h1>
            <p className="text-xs text-slate-400 font-mono">Vendor Suite v2.0</p>
          </div>
        </div>

        {/* Salon Branch Switcher */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">Aura Lounge & Spa</p>
              <p className="text-[11px] text-slate-400 truncate">Bole Medhanialem, Addis Ababa</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Management
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-200 border border-slate-600">
            KM
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Kedir Mohammed</p>
            <p className="text-[11px] text-slate-400">Salon Manager</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
