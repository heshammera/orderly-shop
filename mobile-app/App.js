import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

// Change this to your production URL when deploying
// For local dev with Android Emulator, use 'http://10.0.2.2:3000'
// For local dev with iOS Simulator, use 'http://localhost:3000'
const STORE_URL = 'http://10.0.2.2:3000';

export default function App() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />
            <WebView
                source={{ uri: STORE_URL }}
                style={styles.webview}
                startInLoadingState={true}
                scalesPageToFit={true}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
    webview: {
        flex: 1,
    },
});
