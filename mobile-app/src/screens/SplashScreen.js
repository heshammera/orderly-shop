import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as SplashScreenApi from 'expo-splash-screen';
import { LogIn } from 'lucide-react-native';

SplashScreenApi.preventAutoHideAsync().catch(() => { });

export function SplashScreen({ onFinish }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start(() => {
            setTimeout(() => {
                SplashScreenApi.hideAsync().catch(() => { });
                if (onFinish) onFinish();
            }, 800);
        });
    }, [fadeAnim, scaleAnim, onFinish]);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[styles.content, {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }]}
            >
                <View style={styles.logoContainer}>
                    <LogIn color="#0f172a" size={60} />
                </View>
                <Text style={styles.logoText}>أوردرلي</Text>
                <Text style={styles.subtitle}>بوابتك لإدارة التجارة الاجتماعية</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 24,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0f172a',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
        textAlign: 'center',
    }
});
