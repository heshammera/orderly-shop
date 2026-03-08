import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
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
            return null; // Permission not granted
        }

        try {
            // Use your Firebase/Expo project ID here if relying on EAS
            token = (await Notifications.getExpoPushTokenAsync()).data;
        } catch (e) {
            console.log(e);
        }

        return token;
    },

    async savePushTokenToServer(storeId, token) {
        if (!token || !storeId) return;

        try {
            await fetch('https://your-domain.com/api/mobile/push-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, storeId }),
            });
        } catch (error) {
            console.error('Failed to save push token:', error);
        }
    }
};
