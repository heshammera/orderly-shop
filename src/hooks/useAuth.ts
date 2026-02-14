"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

export function useAuth() {
    const supabase = createClient();
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setAuthState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                });
            }
        );

        // Then check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const signUp = useCallback(async (email: string, password: string, fullName: string, redirectTo?: string, metadata?: any) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo || window.location.origin,
                data: {
                    full_name: fullName,
                    ...metadata
                },
            },
        });
        return { data, error };
    }, [supabase]);

    const signIn = useCallback(async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                // Ensure we get the session 
            }
        });
        return { data, error };
    }, [supabase]);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    }, [supabase]);

    const resetPassword = useCallback(async (email: string) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { data, error };
    }, [supabase]);

    const updatePassword = useCallback(async (newPassword: string) => {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        return { data, error };
    }, [supabase]);

    const value = useMemo(() => ({
        user: authState.user,
        session: authState.session,
        loading: authState.loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
    }), [authState, signUp, signIn, signOut, resetPassword, updatePassword]);

    return value;
}
