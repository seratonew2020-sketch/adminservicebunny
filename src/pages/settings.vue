<script setup>
import { useTheme } from 'vuetify'
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchNotificationPreferences, updateNotificationPreferences } from '@/services/api'

const theme = useTheme()
const authStore = useAuthStore()

const notifications = ref(true) // Maps to in_app_enabled
const emailAlerts = ref(true)   // Maps to email_enabled
const autoClockOut = ref(true)
const themeMode = ref('system')
const loading = ref(false)

const loadPreferences = async () => {
  if (!authStore.user?.id) return
  loading.value = true
  try {
    const prefs = await fetchNotificationPreferences(authStore.user.id)
    notifications.value = prefs.in_app_enabled
    emailAlerts.value = prefs.email_enabled
  } finally {
    loading.value = false
  }
}

const savePreferences = async () => {
  if (!authStore.user?.id) return
  try {
    await updateNotificationPreferences(authStore.user.id, {
      in_app_enabled: notifications.value,
      email_enabled: emailAlerts.value
    })
  } catch (error) {
    console.error('Failed to save preferences', error)
  }
}

// Watch for changes and auto-save (debounce could be added)
watch([notifications, emailAlerts], () => {
  savePreferences()
})

onMounted(() => {
  loadPreferences()
})
</script>

<template>
  <v-container fluid class="pa-4 pa-sm-6 pa-md-8">
     <div class="mb-8">
        <h1 class="text-h4 font-weight-bold mb-1">Settings</h1>
        <p class="text-medium-emphasis">Configure your application preferences and account status.</p>
     </div>

     <v-row>
        <v-col cols="12" lg="8">
           <!-- Profile Section -->
           <v-card flat rounded="xl" class="border mb-6 card-shadow" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
              <div class="pa-6 border-b">
                 <h2 class="text-h6 font-weight-bold">Profile Details</h2>
              </div>
              <div class="pa-6">
                 <div class="d-flex flex-column flex-sm-row align-sm-center gap-6 mb-8">
                    <v-avatar size="100" class="border elevation-2">
                       <v-img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBB1s4XPYI94tDtd0ZLTK0RpG76r13MHbNwl8kKre7D_7kTB75rLae28kZJ0GeQFIlWUiYN6H_3OQtatWZ3m8gHB496EsBRuxerS3lSMcsracnnpNaUzNocV080sKj9Ar5YPXZmtO3K1ylIzV9CIenH0pV8qHKScZoE4vHCU579QsGpSH4ylEtYoTOJjcavAVw6CnIZAqtpbyQUPN2aIEJ3SoLlGLr-T_BWnU5zP0SgWIglwPkQEHB76NpNIq7ml0GuTm-dU2_CKc"></v-img>
                    </v-avatar>
                    <div>
                       <div class="d-flex gap-3 mb-2">
                          <v-btn color="primary" variant="flat" rounded="lg" class="text-capitalize">Change Avatar</v-btn>
                          <v-btn variant="outlined" color="error" rounded="lg" class="text-capitalize">Remove</v-btn>
                       </div>
                       <p class="text-caption text-medium-emphasis mb-0">JPG, GIF or PNG. Max size of 800K</p>
                    </div>
                 </div>

                 <v-row>
                    <v-col cols="12" sm="6">
                       <v-text-field label="First Name" model-value="Admin" variant="outlined" density="comfortable" rounded="lg"></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                       <v-text-field label="Last Name" model-value="User" variant="outlined" density="comfortable" rounded="lg"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                       <v-text-field label="Email Address" model-value="admin@enterprise.com" variant="outlined" density="comfortable" rounded="lg" prepend-inner-icon="mdi-email-outline"></v-text-field>
                    </v-col>
                 </v-row>
                 <div class="d-flex justify-end mt-4">
                    <v-btn color="primary" rounded="lg" size="large" class="px-8 font-weight-bold">Save Changes</v-btn>
                 </div>
              </div>
           </v-card>

           <!-- Preferences Section -->
           <v-card flat rounded="xl" class="border card-shadow" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
              <div class="pa-6 border-b">
                 <h2 class="text-h6 font-weight-bold">System Preferences</h2>
              </div>
              <v-list lines="two" bg-color="transparent" class="pa-2">
                 <v-list-item rounded="xl" class="mb-1">
                    <template v-slot:prepend>
                       <v-avatar color="primary" variant="tonal" size="40" class="mr-4">
                          <v-icon icon="mdi-bell-outline" size="20"></v-icon>
                       </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold text-sm">Push Notifications</v-list-item-title>
                    <v-list-item-subtitle class="text-xs">Receive alerts for important updates and system status</v-list-item-subtitle>
                    <template v-slot:append>
                       <v-switch v-model="notifications" color="primary" inset hide-details density="compact"></v-switch>
                    </template>
                 </v-list-item>

                 <v-divider class="mx-6 my-1 opacity-5"></v-divider>

                 <v-list-item rounded="xl" class="mb-1">
                    <template v-slot:prepend>
                       <v-avatar color="primary" variant="tonal" size="40" class="mr-4">
                          <v-icon icon="mdi-email-check-outline" size="20"></v-icon>
                       </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold text-sm">Email Digest</v-list-item-title>
                    <v-list-item-subtitle class="text-xs">Weekly summary of attendance statistics and reports</v-list-item-subtitle>
                    <template v-slot:append>
                       <v-switch v-model="emailAlerts" color="primary" inset hide-details density="compact"></v-switch>
                    </template>
                 </v-list-item>

                 <v-divider class="mx-6 my-1 opacity-5"></v-divider>

                 <v-list-item rounded="xl">
                    <template v-slot:prepend>
                       <v-avatar color="primary" variant="tonal" size="40" class="mr-4">
                          <v-icon icon="mdi-clock-out" size="20"></v-icon>
                       </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold text-sm">Auto Clock-Out</v-list-item-title>
                    <v-list-item-subtitle class="text-xs">Automatically clock out employees after 12 hours of shift</v-list-item-subtitle>
                    <template v-slot:append>
                       <v-switch v-model="autoClockOut" color="primary" inset hide-details density="compact"></v-switch>
                    </template>
                 </v-list-item>
              </v-list>
           </v-card>
        </v-col>

        <v-col cols="12" lg="4">
           <!-- Support Card -->
           <v-card flat rounded="xl" class="border pa-6 card-shadow" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
              <div class="d-flex align-center gap-4 mb-4">
                 <v-avatar color="grey-lighten-4" size="48">
                    <v-icon icon="mdi-help-circle-outline" color="medium-emphasis"></v-icon>
                 </v-avatar>
                 <div>
                    <h4 class="font-weight-bold">Need Help?</h4>
                    <p class="text-caption text-medium-emphasis">Contact our 24/7 support</p>
                 </div>
              </div>
              <v-btn block variant="tonal" rounded="lg" class="text-capitalize">Chat with Support</v-btn>
           </v-card>
        </v-col>
     </v-row>
  </v-container>
</template>
