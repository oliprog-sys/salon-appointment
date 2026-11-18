// Unified Auth Store for AuraSalon Customer Web App

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: 'CUSTOMER' | 'SALON_OWNER' | 'SUPER_ADMIN';
  salonStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  ownedSalons?: any[];
}

const AUTH_USER_KEY = 'aurasalon_user';
const AUTH_TOKEN_KEY = 'aurasalon_token';
const SESSION_TIME_KEY = 'aurasalon_session_time';

// Max session lifetime (24 hours for customer sessions)
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Checks whether a JWT token has expired using its internal `exp` claim.
 */
export function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000 - 30000;
  } catch {
    return true;
  }
}

/**
 * Checks if the customer session has expired.
 */
export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token || isTokenExpired(token)) {
    return true;
  }

  const sessionTimeStr = localStorage.getItem(SESSION_TIME_KEY);
  if (sessionTimeStr) {
    const time = parseInt(sessionTimeStr, 10);
    if (!isNaN(time) && Date.now() - time > SESSION_MAX_AGE_MS) {
      return true;
    }
  }

  return false;
}

export const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;

  if (isSessionExpired()) {
    logoutUser();
    return null;
  }

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
  localStorage.setItem(SESSION_TIME_KEY, Date.now().toString());
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  window.dispatchEvent(new Event('aurasalon_auth_changed'));
};

export const logoutUser = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(SESSION_TIME_KEY);
  window.dispatchEvent(new Event('aurasalon_auth_changed'));
};

export const validateSession = async (): Promise<UserProfile | null> => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token || isSessionExpired()) {
    logoutUser();
    return null;
  }

  try {
    const res = await fetch('http://localhost:4000/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const user = await res.json();
      setStoredUser(user, token);
      return user;
    } else if (res.status === 401 || res.status === 403) {
      logoutUser();
      return null;
    }
    return getStoredUser();
  } catch (err) {
    // If backend is temporarily offline, check if token is expired
    if (isTokenExpired(token)) {
      logoutUser();
      return null;
    }
    return getStoredUser();
  }
};
