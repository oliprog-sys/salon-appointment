'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface UserData {
  id?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  staffProfile?: {
    id?: string;
    title?: string;
    salonId?: string;
    salon?: {
      id?: string;
      name?: string;
      address?: string;
      subCity?: string;
      city?: string;
    };
  };
  ownedSalons?: Array<{
    id?: string;
    name?: string;
    address?: string;
    subCity?: string;
    city?: string;
    status?: string;
  }>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [activeSalonId, setActiveSalonId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('aurasalon_owner_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        const savedActive = localStorage.getItem('aurasalon_active_salon_id');
        const defaultId =
          parsed.ownedSalons?.[0]?.id ||
          parsed.staffProfile?.salon?.id ||
          parsed.staffProfile?.salonId ||
          '';

        if (savedActive && parsed.ownedSalons?.some((s: any) => s.id === savedActive)) {
          setActiveSalonId(savedActive);
        } else if (defaultId) {
          setActiveSalonId(defaultId);
          localStorage.setItem('aurasalon_active_salon_id', defaultId);
        }
      } catch (e) {
        console.error('Failed to parse aurasalon_owner_user:', e);
      }
    }

    const onSalonChange = () => {
      const active = localStorage.getItem('aurasalon_active_salon_id');
      if (active) setActiveSalonId(active);
    };

    window.addEventListener('aurasalon_active_salon_changed', onSalonChange);
    return () => {
      window.removeEventListener('aurasalon_active_salon_changed', onSalonChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aurasalon_owner_token');
    localStorage.removeItem('aurasalon_owner_user');
    localStorage.removeItem('aurasalon_salon_status');
    localStorage.removeItem('aurasalon_active_salon_id');
    router.push('/login');
  };

  // Derive Active Salon Information
  const activeSalon =
    user?.ownedSalons?.find((s) => s.id === activeSalonId) ||
    user?.ownedSalons?.[0] ||
    user?.staffProfile?.salon;

  const salonName = activeSalon?.name || 'AuraSalon Partner';
  const salonLocation =
    activeSalon?.address ||
    (activeSalon?.subCity
      ? `${activeSalon.subCity}, Addis Ababa`
      : 'Addis Ababa, Ethiopia');

  // Derive User Display Name, Initials, and Role
  const displayName = user?.fullName || 'Salon Partner';
  const displayRole =
    user?.role === 'SALON_OWNER'
      ? 'Salon Owner'
      : user?.role === 'STAFF'
      ? user?.staffProfile?.title || 'Specialist Staff'
      : user?.role === 'SUPER_ADMIN'
      ? 'Platform Admin'
      : user?.role === 'CLIENT'
      ? 'Client Account'
      : 'Partner Member';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SP';

  const isStaff = user?.role === 'STAFF';

  // Navigation Items with RBAC visibility
  const allNavItems = [
    {
      name: 'Timetable & Bookings',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      badge: 'Live',
      allowedRoles: ['SALON_OWNER', 'STAFF', 'SUPER_ADMIN'],
    },
    {
      name: 'Service Catalog',
      href: '/services',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      allowedRoles: ['SALON_OWNER', 'STAFF', 'SUPER_ADMIN'],
    },
    {
      name: 'Staff & Schedules',
      href: '/staff',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      allowedRoles: ['SALON_OWNER', 'SUPER_ADMIN'],
    },
    {
      name: 'Marketing & Ads',
      href: '/marketing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
          />
        </svg>
      ),
      allowedRoles: ['SALON_OWNER', 'SUPER_ADMIN'],
    },
  ];

  const visibleNavItems = allNavItems.filter((item) => {
    if (!mounted || !user?.role) return true;
    return item.allowedRoles.includes(user.role);
  });

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
            <p className="text-xs text-slate-400 font-mono">
              {isStaff ? 'Staff Portal v2.0' : 'Vendor Suite v2.0'}
            </p>
          </div>
        </div>

        {/* Salon Branch Display / Multi-Branch Switcher */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
          {user?.role === 'SALON_OWNER' && user?.ownedSalons && user.ownedSalons.length > 1 ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Switch Branch ({user.ownedSalons.length})
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Owner
                </span>
              </div>
              <select
                value={activeSalonId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveSalonId(newId);
                  localStorage.setItem('aurasalon_active_salon_id', newId);
                  window.dispatchEvent(new Event('aurasalon_active_salon_changed'));
                }}
                className="w-full bg-slate-900 border border-slate-700 text-xs font-semibold text-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                {user.ownedSalons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subCity || 'Branch'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate" title={salonName}>
                    {salonName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate" title={salonLocation}>
                    {salonLocation}
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                {user?.role === 'STAFF' ? 'Staff' : 'Owner'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            {isStaff ? 'My Workspace' : 'Management'}
          </p>
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
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
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
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

      {/* Dynamic Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-200 border border-slate-600 shrink-0">
            {initials}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate" title={displayName}>
              {displayName}
            </p>
            <p className="text-[11px] text-slate-400 truncate" title={displayRole}>
              {displayRole}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out of vendor suite"
          className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition shrink-0 ml-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}
