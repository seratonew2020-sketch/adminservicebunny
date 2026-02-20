import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";

// Create axios instance with interceptor
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Adjust base URL as needed
});

import { supabase } from "@/lib/supabase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null);
  const token = ref(localStorage.getItem('token') || null);
  const employee = ref(null);
  const loading = ref(false);

  // Set default auth header if token exists
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
  }

  const isAdmin = computed(() => {
    return user.value?.role === 'admin' || user.value?.role === 'manager';
  });

  const isAuthenticated = computed(() => !!token.value);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      token.value = session.access_token;
      // We still need to fetch the profile to get the role if it's in the 'users' table
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const userData = {
        id: session.user.id,
        email: session.user.email,
        role: profile?.role || 'user'
      };
      user.value = userData;
      localStorage.setItem('token', session.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      signOut();
    }
  };

  const signIn = async (email, password) => {
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { user: sbUser, session } = data;

      // Fetch profile for role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', sbUser.id)
        .single();

      const userData = {
        id: sbUser.id,
        email: sbUser.email,
        role: profile?.role || 'user'
      };

      token.value = session.access_token;
      user.value = userData;

      localStorage.setItem('token', session.access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;

    } catch (error) {
      console.error("Login Error:", error);
      throw new Error(error.message || 'Login failed');
    } finally {
      loading.value = false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    token.value = null;
    user.value = null;
    employee.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  return {
    user,
    token,
    employee, // Keep for compatibility if needed, though user object might have role
    loading,
    isAuthenticated,
    isAdmin,
    signIn,
    signOut,
    fetchSession
  };
});
