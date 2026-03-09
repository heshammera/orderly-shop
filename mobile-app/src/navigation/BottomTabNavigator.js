import React, { useState, useRef, useEffect, useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { WebView } from 'react-native-webview';
import { Home, Search, ShoppingCart, User, Package, CreditCard, LogIn, LayoutDashboard, LogOut } from 'lucide-react-native';
import { View, BackHandler, Platform, ActivityIndicator } from 'react-native';
import { PushNotificationHandler } from '../services/PushNotificationHandler';
import { AuthService } from '../services/AuthService';
import LoginScreen from '../screens/LoginScreen';
import { UserContext } from '../contexts/UserContext';

const Tab = createBottomTabNavigator();
const INITIAL_URL = 'https://orderlyshops.com';


// Use Context to share setAppMode, currentDashboardBase, and baseUrl safely
const AppModeContext = React.createContext();

function WebScreen({ route }) {
    const { screenType, staticPath } = route.params;
    const {
        appMode,
        setAppMode,
        currentDashboardBase,
        setCurrentDashboardBase,
        baseUrl,
        setBaseUrl,
        pushToken,
        user,
        session,
        globalSsoAttempted,
        setGlobalSsoAttempted
    } = useContext(AppModeContext);
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const registeredStores = useRef(new Set());

    // Determine the final path reactively
    let finalPath = staticPath || '/';
    if (screenType === 'logout') return <LogoutRedirect />;
    if (screenType === 'orders') finalPath = `${currentDashboardBase}/orders`;
    if (screenType === 'settings') finalPath = `${currentDashboardBase}/settings`;
    if (screenType === 'dashboard') finalPath = currentDashboardBase;

    // Clean up double slashes
    finalPath = finalPath.replace(/\/+/g, '/');
    if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;

    // SSO Sync: Ensure EVERY admin hit carries the token in hash to avoid session loss
    // and route via /sso to handle cookie synchronization correctly
    // We only force this on the VERY FIRST source load to avoid loops
    const [currentUri, setCurrentUri] = useState(() => {
        if (appMode === 'admin' && session && !globalSsoAttempted) {
            const encodedPath = encodeURIComponent(finalPath);
            return `${baseUrl}/sso?return=${encodedPath}#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
        }
        return `${baseUrl}${finalPath}`;
    });

    useEffect(() => {
        // Mark SSO as attempted asynchronously to prevent forcing an immediate
        // re-render that would overwrite the WebView URI prop and abort the network request!
        if (currentUri.includes('/sso') && !globalSsoAttempted) {
            setGlobalSsoAttempted(true);
        }
    }, [currentUri]);

    // Update the URI only if navigating to a completely new store or base
    useEffect(() => {
        // Do not interrupt the SSO bridge process once it starts
        if (currentUri.includes('/sso')) return;

        const nextUri = `${baseUrl}${finalPath}`;
        if (currentUri !== nextUri) {
            setCurrentUri(nextUri);
        }
    }, [baseUrl, finalPath]);

    // Handle android physical back button
    useEffect(() => {
        if (Platform.OS === 'android') {
            const onBackPress = () => {
                if (webViewRef.current && canGoBack) {
                    webViewRef.current.goBack();
                    return true;
                }
                return false;
            };
            BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }
    }, [canGoBack]);

    const handleNavigationStateChange = (navState) => {
        setCanGoBack(navState.canGoBack);
        const url = navState.url;

        // Auto-detect Base URL from reality (local or prod)
        const baseMatch = url.match(/^(https?:\/\/[^\/]+)/);
        if (baseMatch && baseMatch[1] && baseMatch[1] !== baseUrl) {
            setBaseUrl(baseMatch[1]);
        }

        const pathname = url.replace(/^(https?:\/\/[^\/]+)/, '');

        // STRICT Dashboard Base Detection (UUID based)
        const dashboardRootRegex = /^(\/(?:s\/[^\/]+\/)?(?:dashboard|admin)(?:\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))?)(?:\/|$)/i;
        const match = pathname.match(dashboardRootRegex);

        if (match && match[1]) {
            const detectedBase = match[1];
            const storeId = match[2];

            if (detectedBase !== currentDashboardBase) {
                // Heuristic: Prefer bases with more path components (likely has store reference)
                if (detectedBase.length > currentDashboardBase.length || !currentDashboardBase.includes('/')) {
                    setCurrentDashboardBase(detectedBase);
                }
            }
            setAppMode('admin');

            if (storeId && pushToken && !registeredStores.current.has(storeId)) {
                PushNotificationHandler.savePushTokenToServer(storeId, pushToken);
                registeredStores.current.add(storeId);
            }
        }
        // Mode switch protection: Only drop to platform if really at a home path AND NO USER exists in context
        else if (!user && (pathname === '/' || pathname === '' || pathname.includes('/login') || pathname.includes('/pricing') || pathname.includes('/auth'))) {
            setAppMode('platform');
        } else if (!user && pathname.includes('/s/')) {
            // If logged out and stuck on a store, force back to homepage
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`window.location.href = '${baseUrl}/';`);
            }
            setAppMode('platform');
        }
    };

    return (
        <WebView
            key={`${screenType}-${staticPath}`} // REMOVED currentDashboardBase from key to stop remount loops
            ref={webViewRef}
            source={{ uri: currentUri }}
            style={{ flex: 1 }}
            startInLoadingState={true}
            onNavigationStateChange={handleNavigationStateChange}
            sharedCookiesEnabled={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
        />
    );
}

function LogoutRedirect() {
    const { setUser } = useContext(UserContext);
    const { setCurrentDashboardBase, setBaseUrl, setGlobalSsoAttempted } = useContext(AppModeContext);
    useEffect(() => {
        AuthService.logout().then(() => {
            setCurrentDashboardBase('/dashboard');
            setBaseUrl(INITIAL_URL);
            setGlobalSsoAttempted(false); // Reset SSO state for next login
            setUser(null, null, []);
        });
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color="#0f172a" />
        </View>
    );
}

function AuthScreen() {
    const { setUser } = useContext(UserContext);
    return <LoginScreen onLoginSuccess={(u, s, st) => setUser(u, s, st)} />;
}

export function BottomTabNavigator() {
    const { user, session, stores } = useContext(UserContext);
    const [appMode, setAppMode] = useState('platform');
    const [currentDashboardBase, setCurrentDashboardBase] = useState('/dashboard');
    const [baseUrl, setBaseUrl] = useState(INITIAL_URL);
    const [pushToken, setPushToken] = useState(null);
    const [globalSsoAttempted, setGlobalSsoAttempted] = useState(false);

    // Auto-switch mode and set dashboard base
    useEffect(() => {
        if (user) {
            setAppMode('admin');
            // If user has a store, use its UUID-based dashboard immediately
            if (stores && stores.length > 0) {
                const primaryStore = stores[0];
                const uuidBase = `/dashboard/${primaryStore.id}`;
                if (currentDashboardBase !== uuidBase) {
                    setCurrentDashboardBase(uuidBase);
                }
            }
        } else {
            setAppMode('platform');
        }
    }, [user, stores]);

    useEffect(() => {
        async function getInitialToken() {
            const token = await PushNotificationHandler.registerForPushNotificationsAsync();
            if (token) setPushToken(token);
        }
        getInitialToken();
    }, []);

    const renderIcon = (name, color, size) => {
        switch (name) {
            case 'الرئيسية': return <Home color={color} size={size} />;
            case 'الأسعار': return <CreditCard color={color} size={size} />;
            case 'دخول': return <LogIn color={color} size={size} />;
            case 'التحكم': return <LayoutDashboard color={color} size={size} />;
            case 'الطلبات': return <Package color={color} size={size} />;
            case 'الإعدادات': return <User color={color} size={size} />;
            case 'خروج': return <LogOut color={color} size={size} />;
            default: return <Home color={color} size={size} />;
        }
    };

    // Prevent rendering admin tabs until we have a real store UUID base
    // If it's just '/dashboard', we are still loading or resolving the store
    const isDashboardResolved = currentDashboardBase !== '/dashboard';

    return (
        <AppModeContext.Provider value={{
            appMode,
            setAppMode,
            currentDashboardBase,
            setCurrentDashboardBase,
            baseUrl,
            setBaseUrl,
            pushToken,
            user,
            session,
            globalSsoAttempted,
            setGlobalSsoAttempted
        }}>
            {appMode === 'admin' && !isDashboardResolved ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : (
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        tabBarIcon: ({ color, size }) => renderIcon(route.name, color, size),
                        tabBarActiveTintColor: '#0f172a',
                        tabBarInactiveTintColor: '#94a3b8',
                        headerShown: false,
                        tabBarStyle: {
                            paddingBottom: 5,
                            paddingTop: 5,
                            height: 60,
                            display: 'flex',
                        }
                    })}
                >
                    {appMode === 'admin' ? (
                        <>
                            <Tab.Screen name="التحكم" component={WebScreen} initialParams={{ screenType: 'dashboard' }} />
                            <Tab.Screen name="الطلبات" component={WebScreen} initialParams={{ screenType: 'orders' }} />
                            <Tab.Screen name="الإعدادات" component={WebScreen} initialParams={{ screenType: 'settings' }} />
                            <Tab.Screen name="خروج" component={WebScreen} initialParams={{ screenType: 'logout' }} />
                        </>
                    ) : (
                        <>
                            <Tab.Screen name="الرئيسية" component={WebScreen} initialParams={{ staticPath: '/' }} />
                            <Tab.Screen name="الأسعار" component={WebScreen} initialParams={{ staticPath: '/#pricing' }} />
                            <Tab.Screen name="دخول" component={AuthScreen} />
                        </>
                    )}
                </Tab.Navigator>
            )}
        </AppModeContext.Provider>
    );
}
