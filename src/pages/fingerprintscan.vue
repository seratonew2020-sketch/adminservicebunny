<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchAttendanceLogs } from '@/services/api'

// --- Constants & Mock Data ---
const { t } = useI18n()

// --- State ---
const currentTime = ref(new Date())
let timerInterval = null
const tab = ref('all-records')

// Attendance Logs State
const logs = ref([])
const allScansData = ref([]) // Dedicated state for visual "All Scans" tab
const loadingLogs = ref(false)
const totalLogs = ref(0)

// --- Logic ---

import { useAttendance } from '@/composables/useAttendance'

const updateClock = () => {
  currentTime.value = new Date()
}

// Helper to filter unique logs
const getUniqueLogs = (rawLogs) => {
  const seen = new Set()
  return rawLogs.filter(log => {
    const key = `${log.employee_id}|${log.timestamp}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Use Composable for Analysis (Process raw logs for "Forgot Scan" and other analysis)
const { dailyRecords } = useAttendance(logs)

const loadLogs = async () => {
  loadingLogs.value = true
  try {
    const { data, total } = await fetchAttendanceLogs({ page: 1, limit: 1000 })

    // 1. Raw Logs for Logic/Computation
    logs.value = data
    totalLogs.value = total

    // 2. Separate Data for "All Scans" Display
    allScansData.value = getUniqueLogs(data)

  } catch (error) {
    console.error('Failed to load logs', error)
  } finally {
    loadingLogs.value = false
  }
}

// --- Lifecycle ---
onMounted(() => {
  timerInterval = setInterval(updateClock, 1000)
  loadLogs()
})

const allHeaders = [
  { title: 'Date', key: 'date', align: 'start', sortable: true },
  { title: 'Time', key: 'time', align: 'start', sortable: true },
  { title: 'Employee ID', key: 'employee_id', sortable: true },
]

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <v-container fluid class="fill-height bg-grey-lighten-4 pa-0 flex-column overflow-hidden">
    <!-- Top System Bar -->
    <v-system-bar color="primary" window class="flex-grow-0">
      <v-icon icon="mdi-shield-check"></v-icon>
      <span>Secure Fingerprint System v2.0</span>
      <v-spacer></v-spacer>
      <span>{{ currentTime.toLocaleDateString() }}</span>
      <span class="mx-2">|</span>
      <span>{{ currentTime.toLocaleTimeString() }}</span>
    </v-system-bar>

    <div class="d-flex flex-row flex-grow-1 w-100 overflow-hidden">
      <!-- Left Panel: Scanner -->


      <!-- Right Panel: Info & Dashboard -->
      <v-sheet class="flex-grow-1 bg-transparent d-flex flex-column overflow-hidden">

        <v-tabs
          v-model="tab"
          align-tabs="center"
          color="warning"
          class="border-b bg-white"
        >
          <v-tab value="all-records">บันทึกทั้งหมด (All Scans)</v-tab>
        </v-tabs>

        <v-window v-model="tab" class="flex-grow-1 overflow-hidden d-flex flex-column">

          <!-- Tab 1: All Records -->
          <v-window-item value="all-records" class="fill-height overflow-y-auto d-flex flex-column">
             <div class="flex-grow-1 px-6 py-6 overflow-hidden d-flex flex-column">
               <div class="d-flex align-center justify-space-between mb-2">
                 <div class="text-subtitle-2 font-weight-bold text-primary">All Scans (Unique): {{ allScansData.length }} / Total: {{ logs.length }}</div>
               </div>

               <v-card class="flex-grow-1 rounded-lg border card-shadow d-flex flex-column" style="overflow: hidden;">
                 <v-data-table
                   :headers="allHeaders"
                   :items="allScansData"
                   :loading="loadingLogs"
                   :items-per-page="100"
                   density="compact"
                   fixed-header
                   height="100%"
                   class="flex-grow-1"
                   hover
                 >
                   <template v-slot:item.date="{ item }">
                     <span class="font-weight-medium">{{ new Date(item.timestamp).toLocaleDateString('th-TH') }}</span>
                   </template>

                   <template v-slot:item.time="{ item }">
                     <span class="font-weight-medium text-medium-emphasis">{{ new Date(item.timestamp).toLocaleTimeString('th-TH') }}</span>
                   </template>

                   <template v-slot:item.employee_id="{ item }">
                      <v-chip size="small" color="primary" variant="tonal">{{ item.employee_id }}</v-chip>
                   </template>
                 </v-data-table>
               </v-card>
            </div>
          </v-window-item>

        </v-window>

      </v-sheet>
    </div>
  </v-container>
</template>

<style scoped>


.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }

.card-shadow {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
  border: 1px solid rgba(0,0,0,0.05);
}
</style>