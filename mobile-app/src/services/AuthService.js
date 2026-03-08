import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../config/supabase';

const SECURE_AUTH_KEY = 'user_auth_credentials';

export const AuthService = {
    // Standard Login
    async login(email, password) {
        console.log('[AuthService] Attempting login with email:', email);

        // Wrap signInWithPassword in a 10-second timeout to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network request timed out after 10 seconds. Check your connection or AsyncStorage.')), 10000)
        );

        console.log('[AuthService] Calling supabase.auth.signInWithPassword...');

        try {
            const { data, error } = await Promise.race([
                supabase.auth.signInWithPassword({ email, password }),
                timeoutPromise
            ]);

            console.log('[AuthService] Supabase Auth response received. Error:', error?.message || 'None');

            if (error) throw error;

            console.log('[AuthService] User authenticated successfully. Fetching store members for user ID:', data.user.id);
            // Fetch stores for this user to help with navigation
            const { data: stores, error: storeError } = await Promise.race([
                supabase
                    .from('store_members')
                    .select('role, stores(id, name, slug)')
                    .eq('user_id', data.user.id),
                timeoutPromise
            ]);

            console.log('[AuthService] Store members response received. Error:', storeError?.message || 'None');
            if (storeError) console.warn('[AuthService] Failed to load stores:', storeError);

            console.log('[AuthService] Login flow complete. Returning user data.');
            return {
                user: data.user,
                session: data.session,
                stores: stores?.map(s => ({ ...s.stores, role: s.role })) || []
            };
        } catch (e) {
            console.error('[AuthService] Exception in login method:', e);
            throw e;
        }
    },

    // Logout
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Biometrics support check
    async checkBiometricsSupport() {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        return {
            hasHardware,
            isEnrolled,
            supportedTypes,
            isSupported: hasHardware && isEnrolled
        };
    },

    // Enable Biometrics for future logins
    async enableBiometrics(email, password) {
        const credentials = JSON.stringify({ email, password });
        await SecureStore.setItemAsync(SECURE_AUTH_KEY, credentials);
    },

    // Disable Biometrics
    async disableBiometrics() {
        await SecureStore.deleteItemAsync(SECURE_AUTH_KEY);
    },

    // Check if biometric login is configured
    async isBiometricConfigured() {
        const credentials = await SecureStore.getItemAsync(SECURE_AUTH_KEY);
        return !!credentials;
    },

    // Perform Biometric Login
    async loginWithBiometrics() {
        try {
            console.log('[AuthService] Biometrics: Fetching credentials from SecureStore...');
            const credentialsStr = await SecureStore.getItemAsync(SECURE_AUTH_KEY);

            if (!credentialsStr) {
                console.log('[AuthService] Biometrics: No credentials stored.');
                throw new Error('No credentials stored');
            }

            console.log('[AuthService] Biometrics: Credentials found, parsing...');
            const { email, password } = JSON.parse(credentialsStr);

            console.log('[AuthService] Biometrics: Prompting native authentication...');
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'الدخول باستخدام البصمة',
                cancelLabel: 'إلغاء',
                fallbackLabel: 'استخدام كلمة المرور',
            });

            console.log('[AuthService] Biometrics: Native prompt result:', result);

            if (result.success) {
                console.log('[AuthService] Biometrics: Success. Logging in via Supabase...');
                return await this.login(email, password);
            } else {
                console.log('[AuthService] Biometrics: User cancelled or failed:', result.error);
                throw new Error('فشل التحقق من البصمة');
            }
        } catch (error) {
            console.error('[AuthService] Biometric Auth Error:', error);
            throw error;
        }
    }
};
