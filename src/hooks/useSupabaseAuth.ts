'use client';

import { AuthError, type Session, type User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  weight: number;
  height: number;
  gender: string;
  goals: string[];
  target_weight: number | null;
  membership_status: 'inactive' | 'active' | 'expired';
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    // Timeout de seguridad: si Supabase no responde (ej. local no está arriba), mostrar landing
    const fallbackTimer = setTimeout(() => {
      if (cancelled) return;
      setLoading((prev) => (prev ? false : prev));
    }, 3000);

    // Obtener sesión inicial
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        clearTimeout(fallbackTimer);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(fallbackTimer);
        setLoading(false);
      });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
      }

      if (data) {
        // Parsear goals si es JSON string
        let goals = data.goals;
        if (typeof goals === 'string') {
          try {
            goals = JSON.parse(goals);
          } catch (e) {
            goals = [];
          }
        }

        setProfile({
          ...data,
          goals: goals || [],
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      setLoading(false);
      return {
        error: {
          message:
            err instanceof Error
              ? err.message
              : 'Error desconocido al iniciar sesión',
          name: 'AuthError',
        },
      };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
  ) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    setLoading(false);

    if (error) {
      return { error };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error };
    }

    setUser(null);
    setProfile(null);
    setSession(null);
    router.push('/');

    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  return {
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  };
}

// Hook simplificado solo para obtener el usuario
export function useUser() {
  const { user, profile, loading } = useSupabaseAuth();
  return { user, profile, loading };
}
