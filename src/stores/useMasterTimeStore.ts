import { defineStore } from "pinia";
import { ref } from "vue";
import {
  fetchMasterTimes,
  createMasterTime,
  updateMasterTime,
  deleteMasterTime,
} from "@/services/api.ts";

export const useMasterTimeStore = defineStore("masterTime", () => {
  const masterTimes = ref([]);
  const loading = ref(false);

  const loadMasterTimes = async () => {
    loading.value = true;
    try {
      masterTimes.value = await fetchMasterTimes();
    } catch (error) {
      console.error("Failed to load master times:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addMasterTime = async (data) => {
    try {
      await createMasterTime(data);
      await loadMasterTimes();
    } catch (error) {
      console.error("Failed to create master time:", error);
      throw error;
    }
  };

  const updateMasterTimeItem = async (id, data) => {
    try {
      await updateMasterTime(id, data);
      await loadMasterTimes();
    } catch (error) {
      console.error("Failed to update master time:", error);
      throw error;
    }
  };

  const removeMasterTime = async (id) => {
    try {
      await deleteMasterTime(id);
      await loadMasterTimes();
    } catch (error) {
      console.error("Failed to delete master time:", error);
      throw error;
    }
  };

  return {
    masterTimes,
    loading,
    loadMasterTimes,
    addMasterTime,
    updateMasterTimeItem,
    removeMasterTime,
  };
});
