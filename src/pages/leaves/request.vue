<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { createLeave } from '@/services/api'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const employee = computed(() => authStore.employee)

const loading = ref(false)
const success = ref(false)
const error = ref('')

const leaveForm = ref({
  employee_code: employee.value?.employee_code || '',
  leave_type: '',
  start_date: '',
  end_date: '',
  reason: '',
})

const leaveTypes = [
  { title: 'Sick Leave (ลาป่วย)', value: 'sick' },
  { title: 'Personal Leave (ลากิจ)', value: 'personal' },
  { title: 'Annual Leave (ลาพักร้อน)', value: 'annual' },
  { title: 'Other (อื่นๆ)', value: 'other' },
]

const submitLeave = async () => {
  if (!leaveForm.value.leave_type || !leaveForm.value.start_date || !leaveForm.value.end_date) {
    error.value = 'Please fill in all required fields'
    return
  }

  if (!employee.value) {
    error.value = 'Employee profile not found. Please try refreshing the page.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await createLeave({
      ...leaveForm.value,
      employee_code: employee.value?.employee_code || employee.value?.employee_id
    })
    success.value = true
    setTimeout(() => router.push('/'), 2000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to submit leave request'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-6" elevation="4" rounded="lg">
          <v-card-title class="text-h5 font-weight-bold px-0 mb-4">
            แบบฟอร์มการลา (Leave Request Form)
          </v-card-title>

          <v-form @submit.prevent="submitLeave">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="leaveForm.leave_type"
                  :items="leaveTypes"
                  label="ประเภทการลา (Leave Type)"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="leaveForm.start_date"
                  label="วันที่เริ่มต้น (Start Date)"
                  type="date"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="leaveForm.end_date"
                  label="วันที่สิ้นสุด (End Date)"
                  type="date"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="leaveForm.reason"
                  label="เหตุผลการลา (Reason)"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-file-input
                  label="ไฟล์แนบ (Attachment)"
                  variant="outlined"
                  prepend-icon="mdi-paperclip"
                  accept="image/*,application/pdf"
                ></v-file-input>
              </v-col>
            </v-row>

            <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
              {{ error }}
            </v-alert>

            <v-alert v-if="success" type="success" variant="tonal" class="mb-4">
              ส่งคำขอลาสำเร็จ! กำลังกลับสู่หน้าหลัก...
            </v-alert>

            <div class="d-flex gap-4 mt-4">
              <v-btn
                color="primary"
                size="large"
                block
                :loading="loading"
                type="submit"
                class="font-weight-bold"
              >
                ส่งคำขอ (Submit Request)
              </v-btn>
            </div>
            <v-btn
              variant="text"
              block
              class="mt-2"
              @click="router.push('/')"
            >
              ยกเลิก (Cancel)
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
