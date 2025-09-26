import { useEffect, useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import {
  signIn as backendSignIn,
  signUp as backendSignUp,
  signOut as backendSignOut,
  resetPassword as backendResetPassword,
  refreshSession as backendRefreshSession,
  getUser as backendGetUser,
  getProfile as backendGetProfile,
  upsertProfile as backendUpsertProfile,
  confirmEmail as backendConfirmEmail,
  updatePassword as backendUpdatePassword,
  type AuthSession,
  type AuthUser,
  type Profile,
  type ProfileUpdate,
} from '@/lib/supabase';

const clearStorageData = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('plant_identifications');
      localStorage.removeItem('plant_health_records');
      localStorage.removeItem('user_plants');
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.multiRemove([
        'plant_identifications',
        'plant_health_records',
        'user_plants',
        SESSION_STORAGE_KEY,
      ]);
    }
  } catch (error) {
    console.error('Error clearing storage data:', error);
  }
};

const SESSION_STORAGE_KEY = 'myplantscan_auth_session';

type AuthError = { message: string };

type AuthResult = { error: AuthError | null };

type StoredSession = AuthSession & { expires_at: number };

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  const AsyncStorage = await import('@react-native-async-storage/async-storage');
  return await AsyncStorage.default.getItem(key);
};

const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  const AsyncStorage = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.default.setItem(key, value);
};

const removeStorageItem = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  const AsyncStorage = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.default.removeItem(key);
};

const normaliseSession = (session: AuthSession): StoredSession => {
  const expiresAt = session.expires_at
    ? session.expires_at
    : Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600);

  return {
    ...session,
    expires_at: expiresAt,
  };
};

const isSessionExpired = (session: StoredSession) => {
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at - now < 30; // refresh if expiring within 30 seconds
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (accessToken: string, userId: string) => {
    const { data, error } = await backendGetProfile(accessToken, userId);
    if (error) {
      if (error.status === 404) {
        setProfile(null);
      } else {
        console.error('AuthProvider: Error fetching profile:', error.message);
      }
      return;
    }

    if (data) {
      setProfile(data.profile);
    }
  }, []);

  const persistSession = useCallback(async (nextSession: StoredSession | null) => {
    if (!nextSession) {
      await removeStorageItem(SESSION_STORAGE_KEY);
      return;
    }
    await setStorageItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
  }, []);

  const bootstrapSession = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await getStorageItem(SESSION_STORAGE_KEY);
      if (!stored) {
        return;
      }

      let parsed: StoredSession | null = null;
      try {
        parsed = JSON.parse(stored) as StoredSession;
      } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
        console.warn('AuthProvider: Failed to parse stored session, clearing.');
        await removeStorageItem(SESSION_STORAGE_KEY);
        return;
      }

      if (!parsed?.access_token) {
        await removeStorageItem(SESSION_STORAGE_KEY);
        return;
      }

      let activeSession = parsed;
      if (isSessionExpired(parsed) && parsed.refresh_token) {
        const { data, error } = await backendRefreshSession(parsed.refresh_token);
        if (error) {
          console.warn('AuthProvider: Failed to refresh session:', error.message);
          await removeStorageItem(SESSION_STORAGE_KEY);
          return;
        }
        if (data && data.session) {
          activeSession = normaliseSession(data.session);
        }
      }

      const { data: userData, error: userError } = await backendGetUser(activeSession.access_token);
      if (userError) {
        console.warn('AuthProvider: Failed to fetch user for stored session:', userError.message);
        await removeStorageItem(SESSION_STORAGE_KEY);
        return;
      }

      if (userData && userData.user) {
        setSession(activeSession);
        setUser(userData.user);
        await loadProfile(activeSession.access_token, userData.user.id);
      }
      await persistSession(activeSession);
    } catch (error) {
      console.error('AuthProvider: bootstrap error:', error);
      await removeStorageItem(SESSION_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [loadProfile, persistSession]);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!email?.trim() || email.length > 254) {
      return { error: { message: 'Invalid email address' } };
    }
    if (!password || password.length < 6 || password.length > 128) {
      return { error: { message: 'Password must be between 6 and 128 characters' } };
    }

    const sanitizedEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      const { data, error } = await backendSignIn(sanitizedEmail, password);
      if (error) {
        return { error: { message: error.message } };
      }
      if (!data || !data.session || !data.user) {
        return { error: { message: 'Unable to sign in with the provided credentials.' } };
      }

      const nextSession = normaliseSession(data.session);
      setSession(nextSession);
      setUser(data.user);
      await persistSession(nextSession);
      await loadProfile(nextSession.access_token, data.user.id);

      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Sign in exception:', error);
      return { error: { message: 'Unable to sign in. Please try again.' } };
    } finally {
      setLoading(false);
    }
  }, [loadProfile, persistSession]);

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    if (!email?.trim() || email.length > 254) {
      return { error: { message: 'Invalid email address' } };
    }
    if (!password || password.length < 6 || password.length > 128) {
      return { error: { message: 'Password must be between 6 and 128 characters' } };
    }
    if (!fullName?.trim()) {
      return { error: { message: 'Full name is required' } };
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = fullName.trim();
    setLoading(true);

    try {
      const { data, error } = await backendSignUp(sanitizedEmail, password, sanitizedName);
      if (error) {
        return { error: { message: error.message } };
      }

      if (data && data.session && data.user) {
        const nextSession = normaliseSession(data.session);
        setSession(nextSession);
        setUser(data.user);
        await persistSession(nextSession);
        await loadProfile(nextSession.access_token, data.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Sign up exception:', error);
      return { error: { message: 'Unable to sign up. Please try again.' } };
    } finally {
      setLoading(false);
    }
  }, [loadProfile, persistSession]);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!session) {
      await clearStorageData();
      setUser(null);
      setProfile(null);
      setSession(null);
      return { error: null };
    }

    setLoading(true);
    try {
      const { error } = await backendSignOut(session.access_token);
      if (error) {
        console.error('AuthProvider: Sign out error:', error.message);
      }
    } catch (error) {
      console.error('AuthProvider: Sign out exception:', error);
    } finally {
      await clearStorageData();
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
    }

    return { error: null };
  }, [session]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!email?.trim() || email.length > 254) {
      return { error: { message: 'Invalid email address' } };
    }

    const sanitizedEmail = email.trim().toLowerCase();

    try {
      const { error } = await backendResetPassword(sanitizedEmail, 'myplantscan://reset-password');
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Reset password exception:', error);
      return { error: { message: 'Unable to send reset instructions. Please try again.' } };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    if (!session || !user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const payload: ProfileUpdate = {
        id: user.id,
        email: user.email ?? '',
        full_name: updates.full_name ?? profile?.full_name ?? null,
        avatar_url: updates.avatar_url ?? profile?.avatar_url ?? null,
      };

      const { data, error } = await backendUpsertProfile(session.access_token, payload);
      if (error) {
        console.error('AuthProvider: Update profile error:', error.message);
        return { error: new Error(error.message) };
      }

      if (data) {
        setProfile(data.profile);
      }
      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Update profile exception:', error);
      return { error: error instanceof Error ? error : new Error('Unable to update profile') };
    }
  }, [session, user, profile]);

  const confirmEmail = useCallback(async (token: string): Promise<AuthResult> => {
    if (!token?.trim()) {
      return { error: { message: 'Invalid confirmation token' } };
    }

    setLoading(true);
    try {
      const { data, error } = await backendConfirmEmail(token);
      if (error) {
        return { error: { message: error.message } };
      }

      if (data && data.session && data.user) {
        const nextSession = normaliseSession(data.session);
        setSession(nextSession);
        setUser(data.user);
        await persistSession(nextSession);
        await loadProfile(nextSession.access_token, data.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Email confirmation exception:', error);
      return { error: { message: 'Unable to confirm email. Please try again.' } };
    } finally {
      setLoading(false);
    }
  }, [loadProfile, persistSession]);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!session) {
      return { error: { message: 'No user logged in' } };
    }
    if (!password || password.length < 6 || password.length > 128) {
      return { error: { message: 'Password must be between 6 and 128 characters' } };
    }

    try {
      const { error } = await backendUpdatePassword(session.access_token, password);
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Update password exception:', error);
      return { error: { message: 'Unable to update password. Please try again.' } };
    }
  }, [session]);

  return useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    confirmEmail,
    updatePassword,
  }), [session, user, profile, loading, signIn, signUp, signOut, resetPassword, updateProfile, confirmEmail, updatePassword]);
});
