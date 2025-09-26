const DEFAULT_BACKEND_URL = 'https://myplantscan.com';

const getBackendBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_BACKEND_URL;
};

const baseUrl = getBackendBaseUrl();

export type BackendError = {
  message: string;
  status?: number;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
};

export type AuthUser = {
  id: string;
  email: string | null;
  role?: string;
  aud?: string;
  [key: string]: unknown;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'email'>> & {
  id: string;
  email: string;
};

async function request<T>(
  path: string,
  {
    method = 'GET',
    body,
    accessToken,
  }: {
    method?: 'GET' | 'POST' | 'PUT';
    body?: Record<string, unknown>;
    accessToken?: string;
  } = {}
): Promise<{ data: T | null; error: BackendError | null }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const maybeJson = await response.json().catch(() => null);

    if (!response.ok) {
      const message = (maybeJson as Record<string, unknown> | null)?.error;
      return {
        data: null,
        error: {
          message: typeof message === 'string' ? message : `Request failed (${response.status})`,
          status: response.status,
        },
      };
    }

    return {
      data: maybeJson as T,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return {
      data: null,
      error: { message },
    };
  }
}

export async function signIn(email: string, password: string) {
  return request<{ session: AuthSession | null; user: AuthUser | null }>('/api/auth/sign-in', {
    method: 'POST',
    body: { email, password },
  });
}

export async function signUp(email: string, password: string, fullName?: string) {
  return request<{ session: AuthSession | null; user: AuthUser | null }>('/api/auth/sign-up', {
    method: 'POST',
    body: { email, password, fullName },
  });
}

export async function signOut(accessToken: string) {
  return request<{ success: boolean }>('/api/auth/sign-out', {
    method: 'POST',
    body: { accessToken },
    accessToken,
  });
}

export async function resetPassword(email: string, redirectTo?: string) {
  return request<{ success: boolean }>('/api/auth/reset-password', {
    method: 'POST',
    body: { email, redirectTo },
  });
}

export async function refreshSession(refreshToken: string) {
  return request<{ session: AuthSession | null; user: AuthUser | null }>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}

export async function getUser(accessToken: string) {
  return request<{ user: AuthUser }>('/api/auth/session', {
    method: 'POST',
    body: { accessToken },
    accessToken,
  });
}

export async function getProfile(accessToken: string, userId: string) {
  return request<{ profile: Profile }>(`/api/profiles/${userId}`, {
    method: 'GET',
    accessToken,
  });
}

export async function upsertProfile(accessToken: string, profile: ProfileUpdate) {
  const { id, email, ...rest } = profile;
  return request<{ profile: Profile }>(`/api/profiles/${id}`, {
    method: 'PUT',
    body: {
      email,
      ...rest,
    },
    accessToken,
  });
}
