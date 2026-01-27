import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  fetchEmployees,
  fetchStats,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/services/api";

export const useEmployeeStore = defineStore("employee", () => {
  // State
  const employees = ref([]);
  const stats = ref({
    total_employees: 0,
    currently_clocked_in: 0,
    late_arrivals: 0,
  });
  const loading = ref(false);
  const totalItems = ref(0);
  const page = ref(1);
  const itemsPerPage = ref(10);
  const search = ref("");

  // Getters
  const totalPages = computed(() =>
    Math.ceil(totalItems.value / itemsPerPage.value),
  );

  // Actions
  const loadData = async () => {
    loading.value = true;
    try {
      const [empResponse, statsData] = await Promise.all([
        fetchEmployees({ page: page.value, limit: itemsPerPage.value }),
        fetchStats(),
      ]);

      employees.value = empResponse.data.map((emp) => ({
        ...emp,
        status: emp.status || (emp.is_active ? "active" : "inactive"),
      }));
      totalItems.value = empResponse.total;

      // Update stats
      stats.value = statsData;
    } catch (error) {
      console.error("Failed to load employee data:", error);
    } finally {
      loading.value = false;
    }
  };

  const setPage = (newPage) => {
    page.value = newPage;
    loadData();
  };

  return {
    employees,
    stats,
    loading,
    totalItems,
    page,
    itemsPerPage,
    totalPages,
    search,
    loadData,
    setPage,
    addEmployee: async (employee: any) => {
      try {
        await createEmployee(employee);
        await loadData();
        return true;
      } catch (error) {
        console.error("Store: Failed to add employee", error);
        return false;
      }
    },
    editEmployee: async (id: string, updates: any) => {
      try {
        await updateEmployee(id, updates);
        await loadData();
        return true;
      } catch (error) {
        console.error("Store: Failed to update employee", error);
        return false;
      }
    },
    removeEmployee: async (id: string) => {
      try {
        await deleteEmployee(id);
        await loadData();
        return true;
      } catch (error) {
        console.error("Store: Failed to delete employee", error);
        return false;
      }
    },
  };
});
