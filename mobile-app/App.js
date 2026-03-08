import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';
import { PushNotificationHandler } from './src/services/PushNotificationHandler';
import { DeepLinkHandler } from './src/utils/DeepLinkHandler';
import { SplashScreen } from './src/screens/SplashScreen';
import { supabase } from './src/config/supabase';
import { UserContext } from './src/contexts/UserContext';

export default function App() {
    const [isAppReady, setIsAppReady] = useState(false);
    const [authState, setAuthState] = useState({ user: null, session: null, stores: [] });
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        // 1. Initial Auth Check
        async function checkInitialSession() {
            const { data: { session } } = await supabase.auth.getSession();
            let stores = [];

            if (session?.user) {
                const { data } = await supabase
                    .from('store_members')
                    .select('role, stores(id, name, slug)')
                    .eq('user_id', session.user.id);
                stores = data?.map(s => ({ ...s.stores, role: s.role })) || [];
            }

            setAuthState({
                user: session?.user ?? null,
                session: session ?? null,
                stores
            });
            // Small delay for branding
            setTimeout(() => setIsAppReady(true), 1500);
        }

        checkInitialSession();

        // 2. Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            let stores = [];
            if (session?.user) {
                const { data } = await supabase
                    .from('store_members')
                    .select('role, stores(id, name, slug)')
                    .eq('user_id', session.user.id);
                stores = data?.map(s => ({ ...s.stores, role: s.role })) || [];
            }

            setAuthState({
                user: session?.user ?? null,
                session: session ?? null,
                stores
            });
        });

        // 3. Notification Setup
        async function setupNotifications() {
            try {
                await PushNotificationHandler.registerForPushNotificationsAsync();
                notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                    console.log('Notification received:', notification);
                });
                responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                    console.log('User interacted with notification:', response);
                });
            } catch (e) {
                console.warn(e);
            }
        }

        setupNotifications();

        return () => {
            subscription.unsubscribe();
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    if (!isAppReady) {
        return <SplashScreen onFinish={() => { }} />;
    }

    return (
        <UserContext.Provider value={{ ...authState, setUser: (user, session, stores) => setAuthState({ user, session, stores: stores || [] }) }}>
            <SafeAreaView style={styles.container}>
                <StatusBar style="auto" />
                <NavigationContainer linking={DeepLinkHandler}>
                    <BottomTabNavigator />
                </NavigationContainer>
            </SafeAreaView>
        </UserContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
});
