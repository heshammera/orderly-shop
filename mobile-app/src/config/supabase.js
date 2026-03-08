import 'react-native-url-polyfill/auto'; // VERY IMPORTANT: Keep this here
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as crossFetch } from 'cross-fetch';

// Override global fetch just in case any internal Supabase library relies on it instead of the passed option
global.fetch = crossFetch;
global.Headers = crossFetch.Headers || global.Headers;

const SUPABASE_URL = 'https://iuggymtefgbunbiieosn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Z2d5bXRlZmdidW5iaWllb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTk2OTgsImV4cCI6MjA4NTk5NTY5OH0.uuhnSlFopQcB68hkcBBf_YRod4DT7E5NYDi1CAv2qvY';

// Create a bomb-proof wrapper around AsyncStorage to prevent it from permanently hanging Supabase
const runWithTimeout = (promise, ms, name) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`[Storage Timeout] ${name} took longer than ${ms}ms`)), ms))
    ]);
};

const HardTimeoutAsyncStorage = {
    getItem: async (key) => {
        console.log(`[Supabase Storage] Requesting getItem: ${key}`);
        try {
            const res = await runWithTimeout(AsyncStorage.getItem(key), 3000, `getItem(${key})`);
            console.log(`[Supabase Storage] getItem success: ${key}`);
            return res;
        } catch (e) {
            console.error(e.message);
            return null;
        }
    },
    setItem: async (key, value) => {
        console.log(`[Supabase Storage] Requesting setItem: ${key}`);
        try {
            await runWithTimeout(AsyncStorage.setItem(key, value), 3000, `setItem(${key})`);
            console.log(`[Supabase Storage] setItem success: ${key}`);
        } catch (e) {
            console.error(e.message);
        }
    },
    removeItem: async (key) => {
        console.log(`[Supabase Storage] Requesting removeItem: ${key}`);
        try {
            await runWithTimeout(AsyncStorage.removeItem(key), 3000, `removeItem(${key})`);
            console.log(`[Supabase Storage] removeItem success: ${key}`);
        } catch (e) {
            console.error(e.message);
        }
    }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: HardTimeoutAsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    global: {
        fetch: crossFetch, // Explicitly tell Supabase to use cross-fetch to avoid React Native silent network hangs
    }
});
