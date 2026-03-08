import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../config/supabase';

const SECURE_AUTH_KEY = 'user_auth_credentials';

export const AuthService = {
    // Standard Login
    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Fetch stores for this user to help with navigation
        const { data: stores } = await supabase
            .from('store_members')
            .select('role, stores(id, name, slug)')
            .eq('user_id', data.user.id);

        return {
            user: data.user,
            session: data.session,
            stores: stores?.map(s => ({ ...s.stores, role: s.role })) || []
        };
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
            const credentialsStr = await SecureStore.getItemAsync(SECURE_AUTH_KEY);
            if (!credentialsStr) throw new Error('No credentials stored');

            const { email, password } = JSON.parse(credentialsStr);

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'الدخول باستخدام البصمة',
                cancelLabel: 'إلغاء',
                fallbackLabel: 'استخدام كلمة المرور',
            });

            if (result.success) {
                return await this.login(email, password);
            } else {
                throw new Error('فشل التحقق من البصمة');
            }
        } catch (error) {
            console.error('Biometric Auth Error:', error);
            throw error;
        }
    }
};
