<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import dayjs from 'dayjs'

const loading = ref(true)
const requests = ref([])
const error = ref('')

// Dialog state
const dialog = ref(false)
const selectedRequest = ref(null)
const rejectReason = ref('')
const submitting = ref(false)

const fetchPendingRequests = async () => {
  loading.value = true
  error.value = ''
  try {
    // Backend returns all if user is HR/Admin, filtering by 'pending' here or in backend
    const res = await api.fetchTimeCorrections({ status: 'pending' })
    requests.value = res.data || []
  } catch (err) {
    error.value = 'Failed to load requests'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPendingRequests()
})

const handleApprove = async (id) => {
  if (!confirm('ยืนยันการอนุมัติคำขอนี้? (Confirm approval?)')) return
  await processStatus(id, 'approved')
}

const openRejectDialog = (req) => {
  selectedRequest.value = req
  rejectReason.value = ''
  dialog.value = true
}

const handleReject = async () => {
  if (!rejectReason.value.trim()) {
    alert('กรุณาระบุเหตุผลการไม่อนุมัติ (Please provide a reason)')
    return
  }
  await processStatus(selectedRequest.value.id, 'rejected', rejectReason.value)
  dialog.value = false
}

const processStatus = async (id, status, comment = null) => {
  submitting.value = true
  try {
    const payload = { status }
    if (comment) payload.hr_comment = comment

    await api.updateTimeCorrectionStatus(id, payload)

    // Remove from local list to be snappy
    requests.value = requests.value.filter(r => r.id !== id)
  } catch (err) {
    alert(err.response?.data?.message || err.message || 'Failed to update status')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-3" size="32">mdi-clock-alert-outline</v-icon>
          อนุมัติแจ้งลืมสแกนเวลา (Time Corrections)
        </h1>
        <p class="text-medium-emphasis mt-1">รายการคำขอแก้ไขเวลาที่รอการอนุมัติ (Pending Approvals)</p>
      </div>
      <v-btn icon="mdi-refresh" variant="tonal" color="primary" @click="fetchPendingRequests" :loading="loading"></v-btn>
    </div>

    <!-- Alert for error -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-6 rounded-lg">
      {{ error }}
    </v-alert>

    <v-card class="rounded-xl border shadow-sm profile-card pt-2" elevation="0">
      <v-data-table
        :items="requests"
        :loading="loading"
        hover
        class="bg-transparent"
      >
        <template v-slot:headers>
          <tr>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">พนักงาน (Employee)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">วันที่ (Date)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">เข้างาน (In)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">เลิกงาน (Out)</th>
            <th class="text-left font-weight-bold text-subtitle-2 px-4 py-3">หมายเหตุ (Reason)</th>
            <th class="text-right font-weight-bold text-subtitle-2 px-4 py-3">Actions</th>
          </tr>
        </template>

        <template v-slot:item="{ item }">
          <tr>
            <td class="px-4 py-3">
              <div class="font-weight-medium text-body-1">{{ item.users?.email }}</div>
              <div class="text-caption text-medium-emphasis">{{ dayjs(item.created_at).format('DD MMM HH:mm') }}</div>
            </td>
            <td class="px-4 py-3 font-weight-medium">{{ dayjs(item.date).format('DD MMM YYYY') }}</td>
            <td class="px-4 py-3 text-primary font-weight-bold">{{ item.time_in ? item.time_in.slice(0, 5) : '-' }}</td>
            <td class="px-4 py-3 text-primary font-weight-bold">{{ item.time_out ? item.time_out.slice(0, 5) : '-' }}</td>
            <td class="px-4 py-3 max-w-200 text-truncate" :title="item.reason">{{ item.reason }}</td>
            <td class="px-4 py-3 text-right">
              <v-btn
                color="success"
                variant="tonal"
                size="small"
                class="mr-2 text-none font-weight-bold"
                prepend-icon="mdi-check"
                @click="handleApprove(item.id)"
                :loading="submitting"
              >
                Approve
              </v-btn>
              <v-btn
                color="error"
                variant="tonal"
                size="small"
                class="text-none font-weight-bold"
                prepend-icon="mdi-close"
                @click="openRejectDialog(item)"
                :loading="submitting"
              >
                Reject
              </v-btn>
            </td>
          </tr>
        </template>

        <template v-slot:no-data>
          <div class="pa-8 text-center">
            <v-icon icon="mdi-check-all" size="64" color="success" class="mb-4 opacity-70"></v-icon>
            <h3 class="text-h6 font-weight-medium mb-1">ยอดเยี่ยม!</h3>
            <p class="text-medium-emphasis">ไม่มีรายการรออนุมัติในขณะนี้ (All caught up!)</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Reject Dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card class="rounded-xl pa-2">
        <v-card-title class="text-h6 font-weight-bold px-4 pt-4 d-flex align-center text-error">
          <v-icon class="mr-2">mdi-alert-circle-outline</v-icon>
          Reject Request
        </v-card-title>
        <v-card-text class="px-4 py-4">
          <div class="text-body-1 mb-4">
            คุณกำลังจะไม่อนุมัติคำขอของ <strong>{{ selectedRequest?.users?.email }}</strong>
          </div>
          <div class="text-subtitle-2 text-medium-emphasis mb-2">เหตุผล (HR Comment) *</div>
          <v-textarea
            v-model="rejectReason"
            variant="outlined"
            rows="3"
            required
            color="error"
            bg-color="surface"
            class="rounded-lg"
            hide-details="auto"
            placeholder="โปรดระบุเหตุผลให้พนักงานทราบ..."
            autofocus
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn
            color="medium-emphasis"
            variant="text"
            class="text-none px-4 rounded-lg"
            @click="dialog = false"
            :disabled="submitting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            class="text-none px-6 rounded-lg font-weight-bold"
            @click="handleReject"
            :loading="submitting"
          >
            Confirm Rejection
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.max-w-200 {
  max-width: 250px;
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
