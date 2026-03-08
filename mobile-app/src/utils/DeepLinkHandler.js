import * as Linking from 'expo-linking';

export const DeepLinkHandler = {
    // Prefix for the app scheme e.g myapp://
    prefix: Linking.createURL('/'),

    config: {
        screens: {
            HomeTab: {
                initialRouteName: 'Home',
                screens: {
                    Home: 'home',
                    Search: 'search',
                    Cart: 'cart',
                    Profile: 'profile',
                }
            },
            Product: 'p/:id',
            Category: 'c/:slug',
        }
    },

    // Optional utility to parse incoming URL specifically
    parseUrl(url) {
        if (!url) return null;
        const parsed = Linking.parse(url);
        return parsed;
    }
};
