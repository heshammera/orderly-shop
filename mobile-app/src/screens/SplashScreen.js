import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as SplashScreenApi from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreenApi.preventAutoHideAsync().catch(() => { });

export function SplashScreen({ onFinish }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        // Simple animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start(() => {
            // Once animation is done, wait a bit and hide the native splash
            setTimeout(() => {
                SplashScreenApi.hideAsync().catch(() => { });
                if (onFinish) onFinish();
            }, 1000);
        });
    }, [fadeAnim, scaleAnim, onFinish]);

    return (
        <View style={styles.container}>
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }}
            >
                {/* Normally we'd use an Image source here for the logo */}
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoText}>Store App</Text>
                </View>
                <Text style={styles.subtitle}>Welcome back!</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    logoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    }
});
