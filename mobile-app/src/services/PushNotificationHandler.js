import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const BASE_URL = 'https://orderlyshops.com';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidImportance.MAX,
    }),
});

export const PushNotificationHandler = {
    async registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permission not granted');
            return null;
        }

        try {
            // Get projectId from app.json (if eas init was run)
            const Constants = require('expo-constants').default;
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId ??
                '00000000-0000-0000-0000-000000000000'; // Fallback for local testing without EAS

            const expoTokenResponse = await Notifications.getExpoPushTokenAsync({
                projectId,
            });
            token = expoTokenResponse.data;
            console.log('Successfully generated Expo push token:', token);
        } catch (e) {
            console.error('Push notification setup failed:', e);
        }

        return token;
    },

    async savePushTokenToServer(storeId, token, baseUrl = 'https://orderlyshops.com') {
        if (!token || !storeId || storeId === '00000000-0000-0000-0000-000000000000') return;

        try {
            const response = await fetch(`${baseUrl}/api/mobile/push-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, storeId }),
            });
            const data = await response.json();
            if (data.success) {
                console.log('Push token saved to server for store:', storeId);
            }
        } catch (error) {
            console.error('Failed to save push token:', error);
        }
    }
};
