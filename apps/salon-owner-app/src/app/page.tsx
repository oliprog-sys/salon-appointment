'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CalendarView from '../components/appointments/CalendarView';
import OnboardingStepForm from '../components/onboarding/OnboardingStepForm';
import KycResubmission from '../components/onboarding/KycResubmission';
import { INITIAL_APPOINTMENTS, INITIAL_STAFF, INITIAL_SERVICES } from '../data/mockData';

export default function DashboardPage() {
  const [salonStatus, setSalonStatus] = useState<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('APPROVED');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={
            salonStatus === 'APPROVED'
              ? 'Live Workspace Timetable'
              : salonStatus === 'PENDING_REVIEW'
              ? 'Vendor Onboarding Desk'
              : 'KYC Resubmission'
          }
          subtitle="Vendor Management Suite for Addis Ababa"
        />
        <main className="flex-1 overflow-y-auto">
          {salonStatus === 'APPROVED' && (
            <CalendarView
              initialAppointments={INITIAL_APPOINTMENTS}
              staffList={INITIAL_STAFF}
              services={INITIAL_SERVICES}
            />
          )}

          {salonStatus === 'PENDING_REVIEW' && (
            <OnboardingStepForm
              salonName="Queen Saba Beauty Lounge"
              subCity="Bole Medhanialem"
              onStatusChange={(status) => setSalonStatus(status)}
            />
          )}

          {salonStatus === 'REJECTED' && (
            <KycResubmission
              salonName="Queen Saba Beauty Lounge"
              rejectionReason="Trade License scan is blurry. Please upload a clear digital PDF showing the Ministry seal."
              onResubmitSuccess={() => setSalonStatus('PENDING_REVIEW')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
