import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import CalendarView from '../../components/appointments/CalendarView';
import { INITIAL_APPOINTMENTS, INITIAL_STAFF, INITIAL_SERVICES } from '../../data/mockData';

export default function AppointmentsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Appointments & Live Timetable"
          subtitle="Manage client bookings, staff schedules & status updates"
        />
        <main className="flex-1 overflow-y-auto">
          <CalendarView
            initialAppointments={INITIAL_APPOINTMENTS}
            staffList={INITIAL_STAFF}
            services={INITIAL_SERVICES}
          />
        </main>
      </div>
    </div>
  );
}
