import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import ServicesConfigurator from '../../components/services/ServicesConfigurator';
import { INITIAL_SERVICES } from '../../data/mockData';

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Services Configurator"
          subtitle="Manage salon service menu offerings, durations & pricing in ETB"
        />
        <main className="flex-1 overflow-y-auto">
          <ServicesConfigurator initialServices={INITIAL_SERVICES} />
        </main>
      </div>
    </div>
  );
}
