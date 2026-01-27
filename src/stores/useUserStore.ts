import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export interface User {
  id: number;
  employee_code: string;
  full_name: string;
  department: string;
}

export const useUserStore = defineStore("user", () => {
  const users = ref<User[]>([]);
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
