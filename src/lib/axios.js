import axios from 'axios';

// Get Supabase Config from Environment Variables
// Allow injecting mock env via global window/import.meta for tests
const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Fallback for some testing environments
  return process.env[key];
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Create a centralized Axios instance for Supabase API calls
const supabaseApi = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Prefer': 'return=representation' // Default preference
  }
});

// Request Interceptor: Automatically attach API Key and Authorization Token
supabaseApi.interceptors.request.use(
  (config) => {
    // Re-read env vars inside interceptor to support runtime mocking/changes in tests
    const currentAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
    
    // 1. Attach API Key (Required for all requests to Supabase)
    if (currentAnonKey) {
      config.headers['apikey'] = currentAnonKey;
      
      // 2. Attach Authorization Header
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${currentAnonKey}`;
      }
    } else {
      console.warn('⚠️ Supabase API Key is missing in environment variables!');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized Error Handling
supabaseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Helper to extract clear error messages from Supabase responses
    if (error.response) {
      const { status, data } = error.response;
      console.error(`[Supabase API Error ${status}]:`, data);
      
      // specific handling for 401/403
      if (status === 401 || status === 403) {
        console.error('Authentication/Permission Error. Check your API Key or RLS policies.');
      }
    } else if (error.request) {
      console.error('[Supabase API Error]: No response received', error.request);
    } else {
      console.error('[Supabase API Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default supabaseApi;
