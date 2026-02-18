<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import UserDashboard from '@/components/UserDashboard.vue'
import AdminDashboard from '@/components/AdminDashboard.vue'

const authStore = useAuthStore()
const isEmployee = computed(() => authStore.employee?.role === 'employee')
</script>

<template>
  <UserDashboard v-if="isEmployee" />
  <AdminDashboard v-else />
</template>
