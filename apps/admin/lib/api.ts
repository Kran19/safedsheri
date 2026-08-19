const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/safedsheri/api/v1';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('safedsheri_jwt');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('safedsheri_jwt', token);
  }
}

export function setStoredAuth(token: string, user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('safedsheri_jwt', token);
    localStorage.setItem('safedsheri_user', JSON.stringify(user));
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('safedsheri_jwt');
    localStorage.removeItem('safedsheri_user');
  }
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const str = localStorage.getItem('safedsheri_user');
  return str ? JSON.parse(str) : null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (res.status === 401) {
      clearAuthToken();
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', statusCode: 401, message: 'Session expired or unauthenticated. Please log in.' },
      };
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to connect to API server' },
    };
  }
}
