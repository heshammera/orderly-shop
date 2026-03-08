import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://iuggymtefgbunbiieosn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Z2d5bXRlZmdidW5iaWllb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTk2OTgsImV4cCI6MjA4NTk5NTY5OH0.uuhnSlFopQcB68hkcBBf_YRod4DT7E5NYDi1CAv2qvY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
