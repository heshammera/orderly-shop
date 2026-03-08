import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform,
    Alert, Switch, Image
} from 'react-native';
import { LogIn, Lock, Mail, Fingerprint } from 'lucide-react-native';
import { AuthService } from '../services/AuthService';

export default function LoginScreen({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [useBiometrics, setUseBiometrics] = useState(false);
    const [hasConfiguredBiometrics, setHasConfiguredBiometrics] = useState(false);

    useEffect(() => {
        const setup = async () => {
            const support = await AuthService.checkBiometricsSupport();
            setIsBiometricSupported(support.isSupported);

            const configured = await AuthService.isBiometricConfigured();
            setHasConfiguredBiometrics(configured);

            // Auto-trigger biometrics if configured
            if (configured) {
                handleBiometricLogin();
            }
        };
        setup();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        setLoading(true);

        try {
            console.log('[LoginScreen] Attempting login for:', email);
            const { user, session, stores } = await AuthService.login(email, password);
            console.log('[LoginScreen] Login success, user:', user?.id);

            if (useBiometrics && isBiometricSupported) {
                try {
                    await AuthService.enableBiometrics(email, password);
                } catch (bioErr) {
                    console.warn('[LoginScreen] Failed to enable biometrics:', bioErr);
                }
            }

            onLoginSuccess(user, session, stores);
        } catch (error) {
            console.error('[LoginScreen] Login error:', error);
            Alert.alert('خطأ في الدخول', error.message || 'فشل تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            const result = await AuthService.loginWithBiometrics();
            if (result) {
                const { user, session, stores } = result;
                onLoginSuccess(user, session, stores);
            }
        } catch (error) {
            // Error handled in service or user cancelled
            console.log('Biometric Login failed or cancelled');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.inner}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <LogIn color="#0f172a" size={48} />
                    </View>
                    <Text style={styles.title}>أهلاً بك في أوردرلي</Text>
                    <Text style={styles.subtitle}>دخول التجار للمنصة</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Mail color="#94a3b8" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="البريد الإلكتروني"
                            placeholderTextColor="#94a3b8"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="كلمة المرور"
                            placeholderTextColor="#94a3b8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {isBiometricSupported && (
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>تفعيل الدخول بالبصمة</Text>
                            <Switch
                                value={useBiometrics}
                                onValueChange={setUseBiometrics}
                                trackColor={{ false: '#e2e8f0', true: '#0f172a' }}
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>دخول</Text>
                        )}
                    </TouchableOpacity>

                    {hasConfiguredBiometrics && (
                        <TouchableOpacity
                            style={styles.bioButton}
                            onPress={handleBiometricLogin}
                        >
                            <Fingerprint color="#0f172a" size={32} />
                            <Text style={styles.bioButtonText}>دخول سريع</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>بوابة إدارة المتاجر - أوردرلي شوبس</Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    inner: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        flexDirection: 'row-reverse', // RTL Support
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
        textAlign: 'right', // RTL Support
    },
    switchRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    switchLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    loginButton: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    bioButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        padding: 12,
    },
    bioButtonText: {
        marginRight: 8,
        fontSize: 16,
        color: '#0f172a',
        fontWeight: '600',
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingVertical: 24,
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 12,
    }
});
