<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { updateEmployee } from '@/services/api'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const loading = ref(false)
const valid = ref(false)

const form = ref({
  phone: '',
  address: '',
})

onMounted(() => {
  if (authStore.employee) {
    form.value.phone = authStore.employee.phone || ''
    form.value.address = authStore.employee.address || ''
  }
})

const handleSave = async () => {
  if (!authStore.user || !authStore.employee) return
  loading.value = true
  
  try {
    await updateEmployee(authStore.employee.id, {
      phone: form.value.phone,
      address: form.value.address,
      updated_at: new Date()
    })

    await authStore.fetchEmployeeProfile()
    router.push('/employee/profile')
  } catch (error) {
    alert('Error updating profile: ' + (error.message || 'Unknown error'))
  }
  loading.value = false
}
</script>

<template>
  <v-container class="pa-6" max-width="800">
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" to="/employee/profile" class="mr-4"></v-btn>
      <h1 class="text-h4 font-weight-bold">Edit Profile</h1>
    </div>

    <v-card class="pa-6">
      <v-form v-model="valid" @submit.prevent="handleSave">
        <v-text-field
          v-model="form.phone"
          label="Phone Number"
          variant="outlined"
          class="mb-4"
        ></v-text-field>

        <v-textarea
          v-model="form.address"
          label="Address"
          variant="outlined"
          rows="3"
          class="mb-6"
        ></v-textarea>

        <div class="d-flex justify-end gap-4">
          <v-btn variant="text" to="/employee/profile">Cancel</v-btn>
          <v-btn type="submit" color="primary" :loading="loading">Save Changes</v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>