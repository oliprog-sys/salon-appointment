import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import SalonApprovalsDesk from '../../components/approvals/SalonApprovalsDesk';
import { INITIAL_SALON_APPROVALS } from '../../data/mockData';

export default function ApprovalsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Salon Approvals & Vendor KYC Desk"
          subtitle="Inspect trade licenses, TIN registrations & approve salon onboarding"
        />
        <main className="flex-1 overflow-y-auto">
          <SalonApprovalsDesk initialApprovals={INITIAL_SALON_APPROVALS} />
        </main>
      </div>
    </div>
  );
}
