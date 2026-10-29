// Unified Auth Store for AuraSalon Web Apps

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: 'CUSTOMER' | 'SALON_OWNER' | 'SUPER_ADMIN';
  salonStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

const AUTH_USER_KEY = 'aurasalon_user';
const AUTH_TOKEN_KEY = 'aurasalon_token';

export const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user: UserProfile, token?: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  window.dispatchEvent(new Event('aurasalon_auth_changed'));
};

export const logoutUser = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event('aurasalon_auth_changed'));
};
