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

export default function App() {
    const [isAppReady, setIsAppReady] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        async function setupApp() {
            try {
                // Initialize push notifications
                const token = await PushNotificationHandler.registerForPushNotificationsAsync();
                if (token) {
                    console.log('Push token:', token);
                    // Temporarily using generic store UUID. In production, pass the current viewed store or login ID.
                    PushNotificationHandler.savePushTokenToServer('00000000-0000-0000-0000-000000000000', token);
                }

                // Listen for notifications
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

        setupApp();

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    // Show custom flash screen while the app holds its first load
    if (!isAppReady) {
        return <SplashScreen onFinish={() => setIsAppReady(true)} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />
            <NavigationContainer linking={DeepLinkHandler}>
                <BottomTabNavigator />
            </NavigationContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
});
