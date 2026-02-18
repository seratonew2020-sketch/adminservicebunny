import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchAttendanceLogs } from "@/services/logs";
import dayjs from "dayjs";

export const useLogStore = defineStore("log", () => {
  const logs = ref([]);
  const loading = ref(false);

  // Filter State
  const startDate = ref(new Date().toISOString().substring(0, 10));
  const endDate = ref(new Date().toISOString().substring(0, 10));
  const searchId = ref("");
  const searchName = ref("");

  const fetchLogs = async () => {
    loading.value = true;
    try {
      const data = await fetchAttendanceLogs({
        startDate: startDate.value,
        endDate: endDate.value,
        empId: searchId.value,
        name: searchName.value,
      });
      logs.value = data;
    } catch (e) {
      console.error("Failed to load logs:", e);
    } finally {
      loading.value = false;
    }
  };

  return {
    logs,
    loading,
    startDate,
    endDate,
    searchId,
    searchName,
    fetchLogs,
  };
});
