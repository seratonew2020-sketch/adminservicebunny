import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { fetchEmployeeByUserId } from "@/services/api"; // Use backend API

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const session = ref(null);
  const employee = ref(null);
  const loading = ref(false);

  const adminEmails = [
    'adm001@bunny.com',
    'admin@bunny.com',
    'adm002@bunny.com',
    'manager1@bunny.com',
    'manager2@bunny.com'
  ];

  const isAdmin = computed(() => {
    return user.value && adminEmails.includes(user.value.email);
  });

  const fetchEmployeeProfile = async () => {
    if (!user.value) {
      employee.value = null;
      return;
    }

    try {
      // Use backend API to bypass RLS issues
      const data = await fetchEmployeeByUserId(user.value.id);
      employee.value = data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  };

  const fetchSession = async () => {
    loading.value = true;
    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    user.value = data.session?.user ?? null;

    if (user.value) {
      await fetchEmployeeProfile();
    }

    loading.value = false;

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, _session) => {
      session.value = _session;
      user.value = _session?.user ?? null;
      if (user.value) {
        await fetchEmployeeProfile();
      } else {
        employee.value = null;
      }
    });
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    await fetchSession();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    user.value = null;
    session.value = null;
    employee.value = null;
  };

  return {
    user,
    session,
    employee,
    loading,
    fetchSession,
    fetchEmployeeProfile,
    signIn,
    signOut,
    isAdmin,
  };
});
