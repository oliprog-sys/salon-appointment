import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import EscalationTicketsView from '../../components/escalations/EscalationTicketsView';
import { INITIAL_ESCALATIONS } from '../../data/mockData';

export default function EscalationsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Platform Escalations & Customer Disputes"
          subtitle="Manage dispute tickets, no-show reports, and customer refund processing"
        />
        <main className="flex-1 overflow-y-auto">
          <EscalationTicketsView initialEscalations={INITIAL_ESCALATIONS} />
        </main>
      </div>
    </div>
  );
}
