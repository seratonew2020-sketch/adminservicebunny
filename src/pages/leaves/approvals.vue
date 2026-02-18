<script setup>
import { ref, onMounted } from 'vue'
import { fetchLeaves, approveLeave } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const leaves = ref([])
const loading = ref(false)
const processing = ref(null)

const headers = [
  { title: 'Employee Code', key: 'employee_code' },
  { title: 'Type', key: 'leave_type' },
  { title: 'Start Date', key: 'start_date' },
  { title: 'End Date', key: 'end_date' },
  { title: 'Days', key: 'days' },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const loadLeaves = async () => {
  loading.value = true
  try {
    const data = await fetchLeaves({ status: 'pending' })
    if (Array.isArray(data)) {
      leaves.value = data
    }
  } catch (error) {
    console.error('Failed to load leaves', error)
  } finally {
    loading.value = false
  }
}

const handleApproval = async (item, status) => {
  processing.value = item.id
  try {
    await approveLeave(item.id, {
      status,
      approved_by: authStore.employee?.employee_code || 'ADMIN', // Should be logged in manager ID
      remarks: status === 'approved' ? 'Approved by manager' : 'Rejected by manager'
    })
    await loadLeaves()
  } catch (error) {
    console.error(`Failed to ${status} leave`, error)
  } finally {
    processing.value = null
  }
}

onMounted(() => {
  loadLeaves()
})
</script>

<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title class="d-flex justify-space-between align-center">
        Leave Approvals
        <v-btn icon="mdi-refresh" variant="text" @click="loadLeaves" :loading="loading"></v-btn>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="leaves"
        :loading="loading"
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'error'"
            size="small"
            class="text-capitalize"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn
              color="success"
              size="small"
              variant="flat"
              :loading="processing === item.id"
              @click="handleApproval(item, 'approved')"
            >
              Approve
            </v-btn>
            <v-btn
              color="error"
              size="small"
              variant="flat"
              :loading="processing === item.id"
              @click="handleApproval(item, 'rejected')"
            >
              Reject
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>
