import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // Global Loading State
  const isLoading = ref(false)

  // Sidebar State
  const isDrawerOpen = ref(true)

  // Snackbar/Notification State
  const snackbar = ref({
    show: false,
    text: '',
    color: 'success',
    timeout: 3000
  })

  // Actions
  function toggleDrawer() {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  function setLoading(status) {
    isLoading.value = status
  }

  function showSnackbar(text, color = 'success') {
    snackbar.value = {
      show: true,
      text,
      color,
      timeout: 3000
    }
  }

  return {
    isLoading,
    isDrawerOpen,
    snackbar,
    toggleDrawer,
    setLoading,
    showSnackbar
  }
}, {
  persist: true // Enable persistence for UI preferences
})
