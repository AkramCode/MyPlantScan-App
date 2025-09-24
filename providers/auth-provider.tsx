import { useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';

const clearStorageData = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('plant_identifications');
      localStorage.removeItem('plant_health_records');
      localStorage.removeItem('user_plants');
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiRemove([
        'plant_identifications',
        'plant_health_records',
        'user_plants'
      ]);
    }
  } catch (error) {
    console.error('Error clearing storage data:', error);
  }
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('AuthProvider: Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthProvider: Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          console.log('AuthProvider: Profile not found, will be created on first update');
        }
      } else {
        console.log('AuthProvider: Profile fetched successfully');
        setProfile(data);
      }
    } catch (error) {
      console.error('AuthProvider: Exception fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      console.log('AuthProvider: Getting initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        } else if (mounted) {
          console.log('AuthProvider: Initial session:', session?.user?.email || 'No session');
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Exception getting session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const eventStr = event || 'unknown';
        const userEmail = session?.user?.email || 'No session';
        console.log('AuthProvider: Auth state changed:', eventStr, userEmail);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || email.length > 254) {
      return { error: { message: 'Invalid email address' } as AuthError };
    }
    if (!password || password.length < 6 || password.length > 128) {
      return { error: { message: 'Password must be between 6 and 128 characters' } as AuthError };
    }
    
    const sanitizedEmail = email.trim().toLowerCase();
    console.log('AuthProvider: Signing in user:', sanitizedEmail);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        console.error('AuthProvider: Sign in error:', error);
      } else {
        console.log('AuthProvider: Sign in successful');
      }

      return { error };
    } catch (error) {
      console.error('AuthProvider: Sign in exception:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    if (!email?.trim() || email.length > 254) {
      return { error: { message: 'Invalid email address' } as AuthError };
    }
    if (!password || password.length < 6 || password.length > 128) {
      return { error: { message: 'Password must be between 6 and 128 characters' } as AuthError };
    }
    if (fullName && fullName.length > 100) {
      return { error: { message: 'Full name must be less than 100 characters' } as AuthError };
    }
    
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFullName = fullName?.trim() || '';
    console.log('AuthProvider: Signing up user:', sanitizedEmail);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            full_name: sanitizedFullName,
          },
        },
      });

      if (error) {
        console.error('AuthProvider: Sign up error:', error);
      } else if (data.user) {
        console.log('AuthProvider: Sign up successful, creating profile...');
        
        // Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: sanitizedFullName || null,
          });

        if (profileError) {
          console.error('AuthProvider: Error creating profile:', profileError);
        } else {
          console.log('AuthProvider: Profile created successfully');
        }
      }

      return { error };
    } catch (error) {
      console.error('AuthProvider: Sign up exception:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('AuthProvider: Signing out user');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthProvider: Sign out error:', error);
      } else {
        console.log('AuthProvider: Sign out successful');
        // Clear any cached data
        await clearStorageData();
      }

      return { error };
    } catch (error) {
      console.error('AuthProvider: Sign out exception:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!email?.trim() || email.length > 254) {
      return { error: { message: 'Invalid email address' } as AuthError };
    }
    
    const sanitizedEmail = email.trim().toLowerCase();
    console.log('AuthProvider: Resetting password for:', sanitizedEmail);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        sanitizedEmail,
        {
          redirectTo: 'myplantscan://reset-password',
        }
      );

      if (error) {
        console.error('AuthProvider: Reset password error:', error);
      } else {
        console.log('AuthProvider: Reset password email sent');
      }

      return { error };
    } catch (error) {
      console.error('AuthProvider: Reset password exception:', error);
      return { error: error as AuthError };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    console.log('AuthProvider: Updating profile for user:', user.id);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('AuthProvider: Update profile error:', error);
        return { error };
      } else {
        console.log('AuthProvider: Profile updated successfully');
        await fetchProfile(user.id);
        return { error: null };
      }
    } catch (error) {
      console.error('AuthProvider: Update profile exception:', error);
      return { error: error as Error };
    }
  }, [user, fetchProfile]);

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
  }), [session, user, profile, loading, signIn, signUp, signOut, resetPassword, updateProfile]);
});