'use client';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  selectedSubCity?: string;
  onSubCityChange?: (subCity: string) => void;
}

export default function AdminHeader({
  title,
  subtitle,
  selectedSubCity = 'ALL',
  onSubCityChange
}: AdminHeaderProps) {
  const subCities = ['ALL', 'Bole', 'Kazanchis', 'Sarbet', 'Old Airport', 'Piassa'];

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Sub-City Filter Dropdown */}
        {onSubCityChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Sub-City:</span>
            <select
              value={selectedSubCity}
              onChange={(e) => onSubCityChange(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            >
              {subCities.map(sc => (
                <option key={sc} value={sc}>
                  {sc === 'ALL' ? 'All Addis Ababa' : sc}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Network Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>AuraSalon Core API v2.0</span>
        </div>
      </div>
    </header>
  );
}
