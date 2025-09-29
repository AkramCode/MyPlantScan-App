import type { PlantHealth, PlantIdentification, UserPlant } from '@/types/plant';
const DEFAULT_BACKEND_URL = 'https://www.myplantscan.com';

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
    guestToken,
  }: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown>;
    accessToken?: string;
    guestToken?: string;
  } = {}
): Promise<{ data: T | null; error: BackendError | null }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    if (guestToken) {
      headers['x-guest-token'] = guestToken;
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

export async function confirmEmail(token: string) {
  return request<{ session: AuthSession; user: AuthUser }>('/auth/confirm', {
    method: 'POST',
    body: { token },
  });
}

export async function updatePassword(accessToken: string, password: string) {
  return request<{ message: string }>('/auth/update-password', {
    method: 'PUT',
    body: { password },
    accessToken,
  });
}


type PlantDataScope = {
  accessToken?: string;
  guestToken?: string;
};

type SaveIdentificationPayload = PlantDataScope & {
  identification: PlantIdentification;
};

type SaveHealthRecordPayload = PlantDataScope & {
  healthRecord: PlantHealth;
};

type SaveGardenPlantPayload = PlantDataScope & {
  plant: UserPlant;
};

type UpdateGardenPlantPayload = SaveGardenPlantPayload;

type DeleteGardenPlantPayload = PlantDataScope & {
  plantId: string;
};

const IDENTIFICATIONS_ENDPOINT = '/api/plants/identifications';
const HEALTH_RECORDS_ENDPOINT = '/api/plants/health-records';
const GARDEN_ENDPOINT = '/api/plants/garden';

export async function fetchPlantIdentifications(
  scope: PlantDataScope
): Promise<{ data: PlantIdentification[]; error: BackendError | null }> {
  const { data, error } = await request<{ identifications: PlantIdentification[] | undefined }>(
    IDENTIFICATIONS_ENDPOINT,
    {
      method: 'GET',
      accessToken: scope.accessToken,
      guestToken: scope.guestToken,
    }
  );

  if (error) {
    return { data: [], error };
  }

  return {
    data: data?.identifications ?? [],
    error: null,
  };
}

export async function savePlantIdentification(
  payload: SaveIdentificationPayload
): Promise<{ data: PlantIdentification | null; error: BackendError | null }> {
  const { data, error } = await request<{ identification: PlantIdentification }>(IDENTIFICATIONS_ENDPOINT, {
    method: 'POST',
    body: { identification: payload.identification },
    accessToken: payload.accessToken,
    guestToken: payload.guestToken,
  });

  return {
    data: data?.identification ?? null,
    error,
  };
}

export async function fetchPlantHealthRecords(
  scope: PlantDataScope
): Promise<{ data: PlantHealth[]; error: BackendError | null }> {
  const { data, error } = await request<{ healthRecords: PlantHealth[] | undefined }>(
    HEALTH_RECORDS_ENDPOINT,
    {
      method: 'GET',
      accessToken: scope.accessToken,
      guestToken: scope.guestToken,
    }
  );

  if (error) {
    return { data: [], error };
  }

  return {
    data: data?.healthRecords ?? [],
    error: null,
  };
}

export async function savePlantHealthRecord(
  payload: SaveHealthRecordPayload
): Promise<{ data: PlantHealth | null; error: BackendError | null }> {
  const { data, error } = await request<{ healthRecord: PlantHealth }>(HEALTH_RECORDS_ENDPOINT, {
    method: 'POST',
    body: { healthRecord: payload.healthRecord },
    accessToken: payload.accessToken,
    guestToken: payload.guestToken,
  });

  return {
    data: data?.healthRecord ?? null,
    error,
  };
}

export async function fetchGardenPlants(
  scope: PlantDataScope
): Promise<{ data: UserPlant[]; error: BackendError | null }> {
  const { data, error } = await request<{ plants: UserPlant[] | undefined }>(
    GARDEN_ENDPOINT,
    {
      method: 'GET',
      accessToken: scope.accessToken,
      guestToken: scope.guestToken,
    }
  );

  if (error) {
    return { data: [], error };
  }

  return {
    data: data?.plants ?? [],
    error: null,
  };
}

export async function saveGardenPlant(
  payload: SaveGardenPlantPayload
): Promise<{ data: UserPlant | null; error: BackendError | null }> {
  const { data, error } = await request<{ plant: UserPlant }>(GARDEN_ENDPOINT, {
    method: 'POST',
    body: { plant: payload.plant },
    accessToken: payload.accessToken,
    guestToken: payload.guestToken,
  });

  return {
    data: data?.plant ?? null,
    error,
  };
}

export async function updateGardenPlant(
  payload: UpdateGardenPlantPayload
): Promise<{ data: UserPlant | null; error: BackendError | null }> {
  const { data, error } = await request<{ plant: UserPlant }>(GARDEN_ENDPOINT, {
    method: 'PUT',
    body: { plant: payload.plant },
    accessToken: payload.accessToken,
    guestToken: payload.guestToken,
  });

  return {
    data: data?.plant ?? null,
    error,
  };
}

export async function deleteGardenPlant(
  payload: DeleteGardenPlantPayload
): Promise<{ data: { success: boolean } | null; error: BackendError | null }> {
  const query = new URLSearchParams({ id: payload.plantId }).toString();
  const { data, error } = await request<{ success: boolean }>(`${GARDEN_ENDPOINT}?${query}`, {
    method: 'DELETE',
    accessToken: payload.accessToken,
    guestToken: payload.guestToken,
  });

  return {
    data: data ? { success: Boolean(data.success) } : null,
    error,
  };
}
