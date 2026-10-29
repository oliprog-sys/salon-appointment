import { Appointment } from '@/types';
import { INITIAL_APPOINTMENTS } from '@/data/mockData';

const APPOINTMENTS_STORAGE_KEY = 'aurasalon_appointments';

export const getStoredAppointments = (): Appointment[] => {
  if (typeof window === 'undefined') return INITIAL_APPOINTMENTS;
  const data = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
    return INITIAL_APPOINTMENTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_APPOINTMENTS;
  }
};

export const saveNewAppointment = (newApp: Appointment): Appointment[] => {
  if (typeof window === 'undefined') return [newApp];
  const current = getStoredAppointments();
  const updated = [newApp, ...current];
  localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
  
  // Notify same window and other tabs
  window.dispatchEvent(new Event('aurasalon_appointments_changed'));
  return updated;
};

export const updateAppointmentStatusInStore = (id: string, newStatus: any): Appointment[] => {
  if (typeof window === 'undefined') return [];
  const current = getStoredAppointments();
  const updated = current.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
  localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('aurasalon_appointments_changed'));
  return updated;
};
