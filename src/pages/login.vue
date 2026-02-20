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
const visible = ref(false)

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
  <v-container fluid class="fill-height bg-background pa-0">
    <v-row no-gutters justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="mx-auto pa-8" max-width="450" rounded="xl" elevation="10" border color="surface">
          <div class="d-flex justify-center mb-6">
            <div class="logo-container">
              <v-icon icon="mdi-shield-check-outline" color="primary" size="40"></v-icon>
            </div>
          </div>

          <div class="text-center mb-8">
            <h2 class="text-h4 font-weight-bold text-white mb-2">Welcome back</h2>
            <p class="text-body-2 text-medium-emphasis">Enter your credentials to access the workspace</p>
          </div>

          <v-form v-model="valid" @submit.prevent="handleLogin" ref="form">
            <div class="mb-4">
              <div class="text-caption font-weight-bold mb-2 text-medium-emphasis">Email address</div>
              <v-text-field
                v-model="email"
                :rules="emailRules"
                placeholder="name@company.com"
                type="email"
                variant="outlined"
                prepend-inner-icon="mdi-email-outline"
                bg-color="surface-light"
                color="primary"
                rounded="lg"
                required
              ></v-text-field>
            </div>

            <div class="mb-6">
              <div class="text-caption font-weight-bold mb-2 text-medium-emphasis">Password</div>
              <v-text-field
                v-model="password"
                :rules="passwordRules"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                :type="visible ? 'text' : 'password'"
                @click:append-inner="visible = !visible"
                placeholder="••••••••"
                variant="outlined"
                prepend-inner-icon="mdi-lock-outline"
                bg-color="surface-light"
                color="primary"
                rounded="lg"
                required
              ></v-text-field>
            </div>

            <v-alert
              v-if="errorMsg"
              type="error"
              variant="tonal"
              class="mb-6 rounded-lg"
              closable
              density="compact"
            >
              {{ errorMsg }}
            </v-alert>

            <v-btn
              type="submit"
              block
              color="primary"
              size="large"
              :loading="loading"
              class="text-uppercase font-weight-bold letter-spacing-1"
              height="48"
              elevation="0"
              rounded="lg"
            >
              Sign In
            </v-btn>
          </v-form>

          <div class="mt-8 text-center text-caption text-medium-emphasis">
            &copy; {{ new Date().getFullYear() }} AdminServiceBunny. Enterprise Edition.
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.logo-container {
  width: 80px;
  height: 80px;
  background: rgba(99, 102, 241, 0.1); /* Indigo with opacity */
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(99, 102, 241, 0.2);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}
.letter-spacing-1 {
  letter-spacing: 1px;
}
</style>
