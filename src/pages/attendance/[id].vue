<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchAttendanceLogs } from '@/services/api'
import { useAttendance } from '@/composables/useAttendance'

const route = useRoute()
const employeeId = route.params.id

const logs = ref([])
const loading = ref(false)

// Use Shared Logic
// Note: We'll filter client-side for this demo, but real API should support filtering by employee_id
const { dailyRecords, analysisStats } = useAttendance(logs)

// Filter records for this specific employee
const employeeRecords = computed(() => {
  return dailyRecords.value.filter(r => r.employee_id === employeeId)
})

// Filter stats for this employee (Need to re-calc based on filtered records if logic was purely local)
// But since our composable takes `logs` ref, we can just feed it filtered logs?
// No, simplest is to filter the logs FIRST before passing to composable, or compute stats locally here.
// Let's create a specific computed for *this* employee's stats using the same logic pattern or just re-use composable on a filtered ref.

const filteredLogs = computed(() => logs.value.filter(l => l.employee_id === employeeId))
const { analysisStats: employeeStats, dailyRecords: employeeDailyRecords } = useAttendance(filteredLogs)


const loadEmployeeLogs = async () => {
  loading.value = true
  try {
    // In a real app, pass employee_id to query
    const { data } = await fetchAttendanceLogs({ page: 1, limit: 500 })
    logs.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEmployeeLogs()
})

const headers = [
  { title: 'Date', key: 'date', align: 'start' },
  { title: 'Check In', key: 'checkIn' },
  { title: 'Check Out', key: 'checkOut' },
  { title: 'Late (min)', key: 'lateMinutes' },
  { title: 'Status', key: 'status' },
]
</script>

<template>
  <v-container fluid class="fill-height bg-grey-lighten-4 pa-0 flex-column">
    <!-- Header -->
    <v-app-bar flat border-b class="bg-white">
      <v-btn icon="mdi-arrow-left" to="/fingerprint-scan" class="mr-2"></v-btn>
      <v-toolbar-title class="font-weight-bold">Attendance History: {{ employeeId }}</v-toolbar-title>
    </v-app-bar>

    <div class="d-flex flex-column flex-grow-1 w-100 overflow-hidden pa-6">

      <!-- Stats Cards -->
      <v-row class="flex-grow-0 mb-6">
        <v-col cols="12" md="4">
           <v-card class="pa-4 d-flex align-center justify-space-between card-shadow">
             <div>
              <div class="text-caption text-medium-emphasis">TOTAL LATE (MIN)</div>
              <div class="text-h4 font-weight-bold text-error">{{ employeeStats.totalLateMinutes }}</div>
            </div>
            <v-icon color="error" size="48" icon="mdi-clock-alert-outline"></v-icon>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
           <v-card class="pa-4 d-flex align-center justify-space-between card-shadow">
             <div>
              <div class="text-caption text-medium-emphasis">FORGOT SCAN</div>
              <div class="text-h4 font-weight-bold text-warning">{{ employeeStats.forgotScanCount }}</div>
            </div>
            <v-icon color="warning" size="48" icon="mdi-alert-circle-outline"></v-icon>
          </v-card>
        </v-col>
         <v-col cols="12" md="4">
           <v-card class="pa-4 d-flex align-center justify-space-between card-shadow">
             <div>
              <div class="text-caption text-medium-emphasis">LATE COUNT</div>
              <div class="text-h4 font-weight-bold">{{ employeeStats.lateCount }}</div>
            </div>
            <v-icon color="primary" size="48" icon="mdi-counter"></v-icon>
          </v-card>
        </v-col>
      </v-row>

      <!-- History Table -->
      <v-card class="flex-grow-1 rounded-lg border card-shadow d-flex flex-column">
        <v-data-table
          :headers="headers"
          :items="employeeDailyRecords"
          :loading="loading"
          density="compact"
          fixed-header
          height="100%"
          class="flex-grow-1"
        >
          <template v-slot:item.checkIn="{ item }">
            <span class="font-weight-medium">{{ item.checkIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
          </template>

          <template v-slot:item.checkOut="{ item }">
            <span v-if="item.checkOut" class="font-weight-medium">{{ item.checkOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
            <span v-else class="text-disabled">-</span>
          </template>

          <template v-slot:item.lateMinutes="{ item }">
            <span v-if="item.lateMinutes > 0" class="text-error font-weight-bold">{{ item.lateMinutes }}m</span>
            <span v-else class="text-grey">-</span>
          </template>

          <template v-slot:item.status="{ item }">
              <v-chip
              size="x-small"
              :color="item.status === 'Forgot Scan' ? 'warning' : (item.lateMinutes > 0 ? 'error' : 'success')"
            >
              {{ item.status === 'Normal' && item.lateMinutes > 0 ? 'Late' : item.status }}
              </v-chip>
          </template>

        </v-data-table>
      </v-card>
    </div>
  </v-container>
</template>

<style scoped>
.card-shadow {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
