const DEFAULT_API_URL = 'http://localhost:4000';

export const getApiBaseUrl = () => import.meta.env.VITE_API_URL || DEFAULT_API_URL;

const getAuthToken = () => localStorage.getItem('uiu_auth_token');

const getErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return 'Request failed';

  const maybeError = payload as {
    error?: { message?: string; code?: string };
    message?: string;
  };

  return maybeError.error?.message || maybeError.message || 'Request failed';
};

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body != null) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }
    throw new Error(getErrorMessage(payload));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (payload?.data ?? payload ?? null) as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};

export const readStoredAuthSession = () => {
  try {
    const token = localStorage.getItem('uiu_auth_token');
    const rawUser = localStorage.getItem('uiu_user');
    if (!token || !rawUser) return null;

    const user = JSON.parse(rawUser) as { role?: string; name?: string };
    if (!user.role || !user.name) return null;

    return {
      token,
      user: {
        role: user.role,
        name: user.name,
      },
    };
  } catch {
    return null;
  }
};

export const persistAuthSession = (token: string, user: { role: string; name: string }) => {
  localStorage.setItem('uiu_auth_token', token);
  localStorage.setItem('uiu_user', JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem('uiu_auth_token');
  localStorage.removeItem('uiu_user');
};
