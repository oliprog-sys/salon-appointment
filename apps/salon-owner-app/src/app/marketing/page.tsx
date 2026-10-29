import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import MarketingDashboard from '../../components/marketing/MarketingDashboard';

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Marketing & Promotional Ads"
          subtitle="Manage featured salon listings, discount vouchers & promotional codes"
        />
        <main className="flex-1 overflow-y-auto">
          <MarketingDashboard />
        </main>
      </div>
    </div>
  );
}
