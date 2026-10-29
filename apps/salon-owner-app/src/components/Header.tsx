'use client';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNewAppointment?: () => void;
  onNewService?: () => void;
}

export default function Header({
  title,
  subtitle,
  onNewAppointment,
  onNewService
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-900">Salon Open</span>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-slate-600">ETB (Birr)</span>
        </div>

        {/* Action buttons */}
        {onNewService && (
          <button
            onClick={onNewService}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md border border-slate-300 transition flex items-center gap-1.5 shadow-xs"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Service
          </button>
        )}

        {onNewAppointment && (
          <button
            onClick={onNewAppointment}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </button>
        )}
      </div>
    </header>
  );
}
