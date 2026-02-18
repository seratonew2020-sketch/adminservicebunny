<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const employee = computed(() => authStore.employee)

const quickActions = [
  { title: 'Request Leave', icon: 'mdi-calendar-plus', color: 'primary', route: '/leaves/request' },
  { title: 'My Schedule', icon: 'mdi-calendar-clock', color: 'success', route: '/schedule' },
  { title: 'Leave History', icon: 'mdi-history', color: 'info', route: '/leaves/history' },
  { title: 'Profile', icon: 'mdi-account-details', color: 'secondary', route: '/profile' },
]

const stats = [
  { title: 'Leave Balance', value: '10 Days', icon: 'mdi-beach', color: 'orange' },
  { title: 'Attendance Rate', value: '98%', icon: 'mdi-check-circle', color: 'green' },
  { title: 'Late Arrivals', value: '0', icon: 'mdi-clock-alert', color: 'red' },
]
</script>

<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4 pa-4" elevation="2" rounded="lg">
          <div class="d-flex align-center">
            <v-avatar size="64" color="primary" class="mr-4">
              <span class="text-h5 text-white">{{ employee?.first_name?.charAt(0) }}{{ employee?.last_name?.charAt(0) }}</span>
            </v-avatar>
            <div>
              <h2 class="text-h5 font-weight-bold">Welcome, {{ employee?.first_name }} {{ employee?.last_name }}</h2>
              <p class="text-body-1 text-medium-emphasis">{{ employee?.position }} • {{ employee?.department }}</p>
              <v-chip size="small" :color="employee?.status === 'active' ? 'success' : 'grey'" class="mt-1">
                {{ employee?.status }}
              </v-chip>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4" v-for="(stat, index) in stats" :key="index">
        <v-card class="pa-4 d-flex align-center" elevation="2" rounded="lg">
          <v-avatar :color="stat.color" variant="tonal" size="48" class="mr-4">
            <v-icon :icon="stat.icon" size="24"></v-icon>
          </v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">{{ stat.title }}</div>
            <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12">
        <h3 class="text-h6 font-weight-bold mb-3">Quick Actions</h3>
      </v-col>
      <v-col cols="6" md="3" v-for="(action, index) in quickActions" :key="index">
        <v-card @click="router.push(action.route)" class="pa-4 text-center cursor-pointer hover-card" elevation="2" rounded="lg">
          <v-icon :icon="action.icon" :color="action.color" size="32" class="mb-2"></v-icon>
          <div class="font-weight-medium">{{ action.title }}</div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.hover-card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s;
}
</style>
