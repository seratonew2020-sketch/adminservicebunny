<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const loading = ref(true)
const requests = ref([])
const error = ref('')

const fetchMyRequests = async () => {
  loading.value = true
  error.value = ''
  try {
    // Requires backend to filter by user_id if calling just /time-corrections
    const res = await api.fetchTimeCorrections({ user_id: user.value?.id })
    requests.value = res.data || []
  } catch (err) {
    error.value = 'Failed to load requests'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (user.value?.id) {
    fetchMyRequests()
  } else {
    error.value = 'User session not found.'
    loading.value = false
  }
})

const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'error'
    case 'pending': return 'warning'
    default: return 'grey'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'approved': return 'อนุมัติ (Approved)'
    case 'rejected': return 'ไม่อนุมัติ (Rejected)'
    case 'pending': return 'รออนุมัติ (Pending)'
    default: return status
  }
}
</script>

<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-3" size="32">mdi-history</v-icon>
          ประวัติแจ้งลืมสแกนเวลา
        </h1>
        <p class="text-medium-emphasis mt-1">ตรวจสอบสถานะคำขอต่างๆ (My Time Corrections)</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        to="/time-correction/request"
        class="text-none font-weight-bold rounded-lg"
      >
        แจ้งลืมสแกนเวลาใหม่
      </v-btn>
    </div>

    <!-- Alert for error -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-6 rounded-lg">
      {{ error }}
    </v-alert>

    <v-card class="rounded-xl border shadow-sm profile-card" elevation="0">
      <v-data-table
        :items="requests"
        :loading="loading"
        hover
        class="bg-transparent"
      >
        <!-- Table Headers implicitly handled by VDataTable if no headers prop,
             but let's define them cleanly -->
        <template v-slot:headers>
          <tr>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">วันที่ (Date)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">เข้างาน (In)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">เลิกงาน (Out)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">หมายเหตุ (Reason)</th>
            <th class="text-center font-weight-bold text-subtitle-2 px-4 py-3">สถานะ (Status)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">ส่งเมื่อ (Submitted)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">เหตุผลตีกลับ (HR Comment)</th>
          </tr>
        </template>

        <template v-slot:item="{ item }">
          <tr>
            <td class="px-4 py-3">{{ dayjs(item.date).format('DD MMM YYYY') }}</td>
            <td class="px-4 py-3">{{ item.time_in ? item.time_in.slice(0, 5) : '-' }}</td>
            <td class="px-4 py-3">{{ item.time_out ? item.time_out.slice(0, 5) : '-' }}</td>
            <td class="px-4 py-3 max-w-200 text-truncate" :title="item.reason">{{ item.reason }}</td>
            <td class="px-4 py-3 text-center">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                variant="flat"
                class="font-weight-medium text-capitalize px-3"
              >
                {{ getStatusText(item.status) }}
              </v-chip>
            </td>
            <td class="px-4 py-3 text-caption text-medium-emphasis">
              {{ dayjs(item.created_at).format('DD MMM HH:mm') }}
            </td>
            <td class="px-4 py-3 text-caption text-error">
              {{ item.hr_comment || '-' }}
            </td>
          </tr>
        </template>

        <!-- No Data State -->
        <template v-slot:no-data>
          <div class="pa-8 text-center">
            <v-icon icon="mdi-history" size="64" color="grey-lighten-2" class="mb-4"></v-icon>
            <h3 class="text-h6 font-weight-medium mb-1">ไม่มีประวัติคำขอ</h3>
            <p class="text-medium-emphasis">คุณยังไม่เคยส่งคำขอแจ้งลืมสแกนเวลา</p>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<style scoped>
.max-w-200 {
  max-width: 200px;
}
.profile-card {
  background: var(--v-surface-base);
}
.v-theme--dark .profile-card {
  background: rgba(30, 30, 30, 0.4);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
