import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);
  const router = useRouter();

  const fetchSession = async () => {
    loading.value = true;
    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    user.value = data.session?.user ?? null;
    loading.value = false;

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, _session) => {
      session.value = _session;
      user.value = _session?.user ?? null;
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
  };

  return {
    user,
    session,
    loading,
    fetchSession,
    signIn,
    signOut,
  };
});
