<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const authStore = useAuthStore()
const router = useRouter()
const valid = ref(false)
const form = ref(null)

const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
]

const passwordRules = [
  (v) => !!v || 'Password is required',
  (v) => (v && v.length >= 6) || 'Password must be at least 6 characters'
]

const handleLogin = async () => {
  if (!valid.value) return

  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.signIn(email.value, password.value)
    router.push('/')
  } catch (error) {
    errorMsg.value = error.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card width="400" class="pa-6" elevation="4" rounded="lg">
      <div class="text-center mb-6">
        <h2 class="text-h5 font-weight-bold text-primary mb-2">Welcome Back</h2>
        <p class="text-body-2 text-medium-emphasis">Sign in to your account</p>
      </div>

      <v-form v-model="valid" @submit.prevent="handleLogin" ref="form">
        <v-text-field
          v-model="email"
          :rules="emailRules"
          label="Email"
          type="email"
          variant="outlined"
          prepend-inner-icon="email"
          required
        ></v-text-field>

        <v-text-field
          v-model="password"
          :rules="passwordRules"
          label="Password"
          type="password"
          variant="outlined"
          prepend-inner-icon="lock"
          required
          class="mt-2"
        ></v-text-field>

        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mb-4 text-caption"
          closable
        >
          {{ errorMsg }}
        </v-alert>

        <v-btn
          type="submit"
          block
          color="primary"
          size="large"
          :loading="loading"
          class="mt-4 text-none font-weight-bold"
        >
          Sign In
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>
