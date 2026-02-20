<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)
const employee = computed(() => authStore.employee)

const loading = ref(false)
const success = ref(false)
const error = ref('')

const form = ref({
  date: '',
  time_in: '',
  time_out: '',
  reason: ''
})

const submitRequest = async () => {
  if (!form.value.date || !form.value.time_in || !form.value.time_out || !form.value.reason) {
    error.value = 'Please fill in all required fields / กรุณากรอกข้อมูลให้ครบถ้วน'
    return
  }

  if (!user.value?.id) {
    error.value = 'User profile not found. Please try refreshing the page.'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false
  try {
    await api.createTimeCorrection({
      ...form.value,
      user_id: user.value.id
    })
    success.value = true
    setTimeout(() => router.push('/time-correction/my-requests'), 2000)
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to submit request'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="pa-6" elevation="4" rounded="lg">
          <v-card-title class="text-h5 font-weight-bold px-0 mb-6 d-flex align-center">
            <v-icon color="primary" class="mr-3" size="32">mdi-clock-edit-outline</v-icon>
            แบบฟอร์มแจ้งลืมสแกนเวลา (Missed Punch Request)
          </v-card-title>

          <!-- Warning/Info alert -->
          <v-alert
            type="info"
            variant="tonal"
            class="mb-6 rounded-lg"
            icon="mdi-information"
          >
            การแจ้งแก้ไขเวลาจะถูกส่งเพื่อรอให้ฝ่ายบุคคลอนุมัติ (HR Approval Required).
          </v-alert>

          <v-form @submit.prevent="submitRequest">
            <v-row>
              <!-- Employee Info (Read-only) -->
              <v-col cols="12" sm="6">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">Employee Email</div>
                <v-text-field
                  :model-value="user?.email"
                  readonly
                  variant="outlined"
                  prepend-inner-icon="mdi-email-outline"
                  color="primary"
                  bg-color="surface-light"
                  class="rounded-lg opacity-70"
                  hide-details="auto"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">Role</div>
                <v-text-field
                  :model-value="user?.role"
                  readonly
                  variant="outlined"
                  prepend-inner-icon="mdi-shield-account-outline"
                  color="primary"
                  bg-color="surface-light"
                  class="rounded-lg opacity-70"
                  hide-details="auto"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-2"></v-divider>
              </v-col>

               <!-- Date Picker -->
              <v-col cols="12">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">วันที่ (Date) *</div>
                <v-text-field
                  v-model="form.date"
                  type="date"
                  variant="outlined"
                  required
                  prepend-inner-icon="mdi-calendar"
                  color="primary"
                  bg-color="surface"
                  class="rounded-lg"
                  hide-details="auto"
                ></v-text-field>
              </v-col>

              <!-- Time In & Out Pickers -->
              <v-col cols="12" sm="6">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">เวลาเข้างาน (Time In) *</div>
                <v-text-field
                  v-model="form.time_in"
                  type="time"
                  variant="outlined"
                  required
                  prepend-inner-icon="mdi-clock-in"
                  color="primary"
                  bg-color="surface"
                  class="rounded-lg"
                  hide-details="auto"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">เวลาเลิกงาน (Time Out) *</div>
                <v-text-field
                  v-model="form.time_out"
                  type="time"
                  variant="outlined"
                  required
                  prepend-inner-icon="mdi-clock-out"
                  color="primary"
                  bg-color="surface"
                  class="rounded-lg"
                  hide-details="auto"
                ></v-text-field>
              </v-col>

              <!-- Reason Textarea -->
              <v-col cols="12">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">หมายเหตุ / เหตุผล (Reason) *</div>
                <v-textarea
                  v-model="form.reason"
                  variant="outlined"
                  rows="3"
                  required
                  prepend-inner-icon="mdi-text-box-outline"
                  color="primary"
                  bg-color="surface"
                  class="rounded-lg"
                  hide-details="auto"
                ></v-textarea>
              </v-col>
            </v-row>

            <v-alert v-if="error" type="error" variant="tonal" class="mt-6 mb-2 rounded-lg">
              {{ error }}
            </v-alert>

            <v-alert v-if="success" type="success" variant="tonal" class="mt-6 mb-2 rounded-lg">
              ส่งคำขอสำเร็จ! กำลังกลับสู่หน้าประวัติ...
            </v-alert>

            <!-- Actions -->
            <div class="d-flex flex-column flex-sm-row gap-4 mt-6">
              <v-btn
                variant="tonal"
                size="large"
                class="flex-1-1 font-weight-medium rounded-lg px-8 text-none"
                @click="router.push('/')"
                prepend-icon="mdi-close"
              >
                ยกเลิก (Cancel)
              </v-btn>
              <v-btn
                color="primary"
                size="large"
                :loading="loading"
                type="submit"
                class="flex-1-1 font-weight-bold rounded-lg px-8 text-none"
                elevation="2"
                prepend-icon="mdi-send"
              >
                ส่งคำขอ (Submit Request)
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.gap-4 {
  gap: 16px;
}
</style>
