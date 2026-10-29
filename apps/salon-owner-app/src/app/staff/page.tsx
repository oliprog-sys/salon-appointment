import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import StaffDirectory from '../../components/staff/StaffDirectory';
import { INITIAL_STAFF } from '../../data/mockData';

export default function StaffPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Staff Directory & Shift Schedules"
          subtitle="Monitor active specialists, working hours, and duty status"
        />
        <main className="flex-1 overflow-y-auto">
          <StaffDirectory initialStaff={INITIAL_STAFF} />
        </main>
      </div>
    </div>
  );
}
