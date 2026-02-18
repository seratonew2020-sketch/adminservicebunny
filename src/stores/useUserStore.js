import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const useUserStore = defineStore("user", () => {
  const users = ref([]);
  const loading = ref(false);

  const fetchUsers = async () => {
    loading.value = true;
    try {
      const { data } = await axios.get("/api/users");
      users.value = data;
    } finally {
      loading.value = false;
    }
  };

  return {
    users,
    loading,
    fetchUsers,
  };
});
