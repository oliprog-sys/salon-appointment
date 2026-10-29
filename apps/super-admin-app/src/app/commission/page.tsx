import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import CommissionLedgersView from '../../components/commission/CommissionLedgersView';
import { INITIAL_COMMISSION_LEDGERS } from '../../data/mockData';

export default function CommissionPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Commission Ledgers & Bank Disbursements"
          subtitle="Track 10% platform share and 90% payouts to Telebirr, CBE Birr & Awash Bank"
        />
        <main className="flex-1 overflow-y-auto">
          <CommissionLedgersView initialLedgers={INITIAL_COMMISSION_LEDGERS} />
        </main>
      </div>
    </div>
  );
}
