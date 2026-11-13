'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import ServicesConfigurator from '../../components/services/ServicesConfigurator';
import { ServiceOffering } from '../../types';

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        let salonId = localStorage.getItem('aurasalon_active_salon_id');
        if (!salonId) {
          const storedUser = localStorage.getItem('aurasalon_owner_user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            salonId = user.ownedSalons?.[0]?.id || user.staffProfile?.salon?.id || '';
          }
        }

        if (salonId) {
          const res = await fetch(`http://localhost:4000/salons/${salonId}`);
          if (res.ok) {
            const salon = await res.json();
            if (Array.isArray(salon.categories)) {
              const mapped: ServiceOffering[] = salon.categories.flatMap((cat: any) =>
                (cat.services || []).map((srv: any) => ({
                  id: srv.id,
                  name: srv.name,
                  category: 'HAIR',
                  durationMinutes: srv.durationMin || 60,
                  priceETB: Number(srv.priceETB) || 0,
                  description: srv.description || '',
                  isActive: srv.isActive ?? true,
                  assignedStaffIds: [],
                }))
              );
              setServices(mapped);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
    window.addEventListener('aurasalon_active_salon_changed', loadServices);
    return () => {
      window.removeEventListener('aurasalon_active_salon_changed', loadServices);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Services Configurator"
          subtitle="Manage salon service menu offerings, durations & pricing in ETB"
        />
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium text-xs">
              Loading service catalog from database...
            </div>
          ) : (
            <ServicesConfigurator initialServices={services} />
          )}
        </main>
      </div>
    </div>
  );
}
