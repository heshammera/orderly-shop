import AsyncStorage from '@react-native-async-storage/async-storage';

export const CacheManager = {
    async setCache(key, value) {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(`@cache_${key}`, jsonValue);
        } catch (e) {
            console.error('Error saving cache', e);
        }
    },

    async getCache(key) {
        try {
            const jsonValue = await AsyncStorage.getItem(`@cache_${key}`);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error('Error reading cache', e);
            return null;
        }
    },

    async clearCache() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith('@cache_'));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (e) {
            console.error('Error clearing cache', e);
        }
    }
};
