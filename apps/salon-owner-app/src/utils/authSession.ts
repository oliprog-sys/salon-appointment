// Session and Authentication Utilities for AuraSalon Partner Suite

const TOKEN_KEY = 'aurasalon_owner_token';
const USER_KEY = 'aurasalon_owner_user';
const SESSION_TIME_KEY = 'aurasalon_owner_session_time';
const ACTIVE_SALON_KEY = 'aurasalon_active_salon_id';
const SALON_STATUS_KEY = 'aurasalon_salon_status';

// Standard 8-hour working shift session expiration window
export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

/**
 * Checks whether a JWT token has expired using its internal `exp` claim.
 */
export function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode Base64Url payload
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
    // Buffer by 30 seconds to prevent race conditions
    return Date.now() >= payload.exp * 1000 - 30000;
  } catch {
    return true;
  }
}

/**
 * Checks if the local session has expired either due to token expiration
 * or session inactivity timeout.
 */
export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || isTokenExpired(token)) {
    return true;
  }

  const sessionTimeStr = localStorage.getItem(SESSION_TIME_KEY);
  if (!sessionTimeStr) {
    // If no session timestamp is found, initialize or treat as expired if older session
    return false;
  }

  const sessionTime = parseInt(sessionTimeStr, 10);
  if (isNaN(sessionTime) || Date.now() - sessionTime > SESSION_MAX_AGE_MS) {
    return true;
  }

  return false;
}

/**
 * Returns the current auth token only if the session is still active and valid.
 * Automatically flushes expired credentials.
 */
export function getOwnerToken(): string | null {
  if (typeof window === 'undefined') return null;

  if (isSessionExpired()) {
    clearOwnerSession();
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Returns stored owner user profile only if the session is still active and valid.
 */
export function getOwnerUser(): any | null {
  if (typeof window === 'undefined') return null;

  if (isSessionExpired()) {
    clearOwnerSession();
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persists owner session credentials and updates the session activity timestamp.
 */
export function saveOwnerSession(token: string, user: any) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_TIME_KEY, Date.now().toString());

  const salonStatus =
    user.ownedSalons?.[0]?.status ||
    user.staffProfile?.salon?.status ||
    user.salonStatus ||
    'APPROVED';

  localStorage.setItem(SALON_STATUS_KEY, salonStatus);

  const defaultId =
    user.ownedSalons?.[0]?.id ||
    user.staffProfile?.salon?.id ||
    user.staffProfile?.salonId ||
    '';

  const currentActive = localStorage.getItem(ACTIVE_SALON_KEY);
  if (!currentActive && defaultId) {
    localStorage.setItem(ACTIVE_SALON_KEY, defaultId);
  }

  window.dispatchEvent(new Event('aurasalon_auth_changed'));
}

/**
 * Refreshes the last active timestamp for the current session.
 */
export function touchOwnerSession() {
  if (typeof window === 'undefined') return;
  if (!isSessionExpired()) {
    localStorage.setItem(SESSION_TIME_KEY, Date.now().toString());
  }
}

/**
 * Clears all owner portal authentication and salon session state.
 */
export function clearOwnerSession() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_TIME_KEY);
  localStorage.removeItem(ACTIVE_SALON_KEY);
  localStorage.removeItem(SALON_STATUS_KEY);

  window.dispatchEvent(new Event('aurasalon_auth_changed'));
}

/**
 * Checks an HTTP Response. If 401 or 403, flushes session and redirects to login.
 */
export function handleAuthResponse(res: Response): boolean {
  if (res.status === 401 || res.status === 403) {
    clearOwnerSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login?expired=true';
    }
    return false;
  }
  return true;
}

/**
 * Validates the current session against backend /auth/me.
 * Returns the verified user profile or null if session is expired or invalid.
 */
export async function verifyOwnerSession(): Promise<any | null> {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || isSessionExpired()) {
    clearOwnerSession();
    return null;
  }

  try {
    const res = await fetch('http://localhost:4000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const verified = await res.json();
      saveOwnerSession(token, verified);
      return verified;
    } else if (res.status === 401 || res.status === 403) {
      clearOwnerSession();
      return null;
    }
    return getOwnerUser();
  } catch (e) {
    // If backend is temporarily offline/reconnecting:
    // If the token is expired, reject. Otherwise keep temporary cached state.
    if (isTokenExpired(token)) {
      clearOwnerSession();
      return null;
    }
    return getOwnerUser();
  }
}
