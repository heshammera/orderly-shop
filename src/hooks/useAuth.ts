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
        try {
            // Call our custom admin registration endpoint to bypass the 2 emails/hour Supabase limit
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                    metadata
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return { data: null, error: new Error(result.error || 'Registration failed') };
            }

            // Return a format that matches the Supabase signUp response so the frontend doesn't break
            return {
                data: { user: result.user, session: null },
                error: null
            };
        } catch (error: any) {
            console.error('[Auth] Custom SignUp Error:', error);
            return { data: null, error };
        }
    }, []);

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
