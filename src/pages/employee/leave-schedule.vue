<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { fetchLeaves } from '@/services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const authStore = useAuthStore()
const { employee, user } = storeToRefs(authStore)

const loading = ref(false)
const error = ref('')
const leaves = ref([])

const headers = [
  { title: 'วันที่เริ่มต้น', key: 'start_date', sortable: true },
  { title: 'วันที่สิ้นสุด', key: 'end_date', sortable: true },
  { title: 'จำนวนวัน', key: 'duration', sortable: true },
  { title: 'ประเภทการลา', key: 'leave_type', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'เหตุผล', key: 'reason', sortable: false },
]

const stats = computed(() => {
  const approved = leaves.value.filter(l => l.status === 'approved')
  const totalDays = approved.reduce((acc, l) => acc + calculateDuration(l.start_date, l.end_date), 0)
  const pending = leaves.value.filter(l => l.status === 'pending').length

  return {
    totalApprovedDays: totalDays,
    pendingCount: pending,
    approvedCount: approved.length,
    remainingDays: 30 - totalDays // Example: 30 days total quota
  }
})

const calculateDuration = (start, end) => {
  if (!start) return 0
  const s = dayjs(start)
  const e = dayjs(end || start)
  return Math.max(0, e.diff(s, 'day') + 1)
}

const loadMyLeaves = async () => {
  if (!employee.value?.employee_code) return

  loading.value = true
  error.value = ''
  try {
    const data = await fetchLeaves({
      employeeCode: employee.value.employee_code
    })
    leaves.value = (data || []).map(l => ({
      ...l,
      duration: calculateDuration(l.start_date, l.end_date)
    }))
  } catch (err) {
    console.error('Error loading leaves:', err)
    error.value = 'ไม่สามารถโหลดข้อมูลการลาได้'
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'error'
    default: return 'grey'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'approved': return 'อนุมัติแล้ว'
    case 'pending': return 'รออนุมัติ'
    case 'rejected': return 'ไม่อนุมัติ'
    default: return status
  }
}

const getLeaveTypeLabel = (type) => {
  switch (type) {
    case 'annual': return 'ลาพักร้อน'
    case 'sick': return 'ลาป่วย'
    case 'personal': return 'ลากิจ'
    default: return type
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('D MMM YYYY')
}

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchSession()
  }
  await loadMyLeaves()
})
</script>

<template>
  <v-container fluid class="pa-4 pa-sm-6 pa-md-8">
    <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-4 mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">ตารางการลาของฉัน</h1>
        <p class="text-medium-emphasis">ติดตามสถานะและประวัติการลาหยุดของคุณ</p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        rounded="xl"
        size="large"
        to="/leaves/request"
        elevation="2"
      >
        ยื่นคำร้องขอลา
      </v-btn>
    </div>

    <!-- Quick Stats -->
    <v-row dense class="mb-8">
      <v-col cols="12" sm="6" md="3">
        <v-card flat rounded="xl" class="border pa-6 bg-blue-lighten-5">
          <div class="d-flex align-center gap-3 mb-2">
            <v-icon color="blue" size="32">mdi-calendar-check</v-icon>
            <div class="text-subtitle-2 font-weight-medium text-blue-darken-2">วันที่ลาแล้ว</div>
          </div>
          <div class="text-h3 font-weight-bold text-blue-darken-3">{{ stats.totalApprovedDays }} <small class="text-h6">วัน</small></div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card flat rounded="xl" class="border pa-6 bg-orange-lighten-5">
          <div class="d-flex align-center gap-3 mb-2">
            <v-icon color="orange" size="32">mdi-clock-outline</v-icon>
            <div class="text-subtitle-2 font-weight-medium text-orange-darken-2">รออนุมัติ</div>
          </div>
          <div class="text-h3 font-weight-bold text-orange-darken-3">{{ stats.pendingCount }} <small class="text-h6">รายการ</small></div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card flat rounded="xl" class="border pa-6 bg-green-lighten-5">
          <div class="d-flex align-center gap-3 mb-2">
            <v-icon color="green" size="32">mdi-check-decagram</v-icon>
            <div class="text-subtitle-2 font-weight-medium text-green-darken-2">สิทธิ์คงเหลือ</div>
          </div>
          <div class="text-h3 font-weight-bold text-green-darken-3">{{ stats.remainingDays }} <small class="text-h6">วัน</small></div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card flat rounded="xl" class="border pa-6 bg-purple-lighten-5">
          <div class="d-flex align-center gap-3 mb-2">
            <v-icon color="purple" size="32">mdi-history</v-icon>
            <div class="text-subtitle-2 font-weight-medium text-purple-darken-2">รวมทั้งหมด</div>
          </div>
          <div class="text-h3 font-weight-bold text-purple-darken-3">{{ leaves.length }} <small class="text-h6">รายการ</small></div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Leaves Table -->
    <v-card flat rounded="xl" class="border overflow-hidden">
      <div class="pa-4 border-b bg-grey-lighten-5 d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-bold">ประวัติการลาหยุด</div>
        <v-btn icon="mdi-refresh" variant="text" size="small" @click="loadMyLeaves" :loading="loading"></v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="leaves"
        :loading="loading"
        hover
        density="comfortable"
        class="bg-transparent"
      >
        <template #item.start_date="{ item }">
          <span class="font-weight-medium text-body-2">{{ formatDate(item.start_date) }}</span>
        </template>

        <template #item.end_date="{ item }">
          <span class="font-weight-medium text-body-2">{{ formatDate(item.end_date) }}</span>
        </template>

        <template #item.duration="{ item }">
          <v-chip size="small" variant="outlined" color="primary">{{ item.duration }} วัน</v-chip>
        </template>

        <template #item.leave_type="{ item }">
          <span class="text-body-2">{{ getLeaveTypeLabel(item.leave_type) }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip
            size="small"
            :color="getStatusColor(item.status)"
            variant="flat"
            class="font-weight-bold"
          >
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.reason="{ item }">
          <div class="text-truncate text-body-2 text-medium-emphasis" style="max-width: 200px;">
            {{ item.reason || '-' }}
          </div>
          <v-tooltip activator="parent" location="top" v-if="item.reason">
            {{ item.reason }}
          </v-tooltip>
        </template>

        <template #no-data>
          <div class="pa-12 text-center">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-calendar-remove</v-icon>
            <div class="text-h6 text-medium-emphasis">คุณยังไม่มีประวัติการลาหยุด</div>
            <v-btn color="primary" variant="text" class="mt-2" to="/leaves/request">ยื่นคำร้องใบแรก</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mt-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>
  </v-container>
</template>

<style scoped>
.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
</style>
