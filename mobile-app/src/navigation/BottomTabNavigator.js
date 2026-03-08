import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { WebView } from 'react-native-webview';
import { Home, Search, ShoppingCart, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const STORE_URL = 'http://10.0.2.2:3000'; // For android emulator testing

function WebScreen({ route }) {
    // Route params can supply the path, e.g. /cart, /profile
    const path = route?.params?.path || '';
    const uri = `${STORE_URL}${path}`;

    return (
        <WebView
            source={{ uri }}
            style={{ flex: 1 }}
            startInLoadingState={true}
        />
    );
}

export function BottomTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Home') return <Home color={color} size={size} />;
                    if (route.name === 'Search') return <Search color={color} size={size} />;
                    if (route.name === 'Cart') return <ShoppingCart color={color} size={size} />;
                    if (route.name === 'Profile') return <User color={color} size={size} />;
                },
                tabBarActiveTintColor: '#0f172a',
                tabBarInactiveTintColor: '#94a3b8',
                headerShown: false,
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                }
            })}
        >
            <Tab.Screen name="Home" component={WebScreen} initialParams={{ path: '/' }} />
            <Tab.Screen name="Search" component={WebScreen} initialParams={{ path: '/search' }} />
            <Tab.Screen name="Cart" component={WebScreen} initialParams={{ path: '/checkout' }} />
            <Tab.Screen name="Profile" component={WebScreen} initialParams={{ path: '/account' }} />
        </Tab.Navigator>
    );
}
