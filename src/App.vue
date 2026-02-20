<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useTheme } from 'vuetify'
  import { useI18n } from 'vue-i18n'
  import { useAuthStore } from '@/stores/auth'
  import { useRouter, useRoute } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import NotificationMenu from '@/components/NotificationMenu.vue'

  // --- Theme Management ---
  const theme = useTheme()
  const { t, locale } = useI18n()
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const { user, employee } = storeToRefs(authStore)
  const drawer = ref(true)

  // Fetch session on mount
  onMounted(async () => {
    await authStore.fetchSession()
  })

  const toggleLanguage = () => {
    locale.value = locale.value === 'th' ? 'en' : 'th'
  }

  const toggleTheme = () => {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  }

  const handleSignOut = async () => {
    await authStore.signOut()
    router.push('/login')
  }

  const navItems = computed(() => {
    // Check for admin role using the getter from store if available, or fallback
    const isAdmin = authStore.isAdmin || employee.value?.role === 'admin' || employee.value?.role === 'manager'

    if (isAdmin) {
      return [
        { title: 'dashboard', icon: 'mdi-view-dashboard-outline', path: '/admin/dashboard', exact: true },
        { title: 'reports', icon: 'mdi-file-chart-outline', path: '/admin/reports', exact: true },
        { title: 'Data Management', icon: 'mdi-database', path: '/admin/data-management', exact: true },
        { title: 'Audit Logs', icon: 'mdi-history', path: '/admin/audit-logs', exact: true },
        { title: 'time_report', icon: 'mdi-clock-time-four-outline', path: '/timeall', exact: true },
        { title: 'employees', icon: 'mdi-account-group-outline', path: '/admin/employees', exact: true },
        { title: 'schedule', icon: 'mdi-calendar-clock-outline', path: '/schedule', exact: true },
        { title: 'leave_approvals', icon: 'mdi-check-decagram', path: '/leaves/approvals', exact: true },
        { title: 'employee_leaves_table', icon: 'mdi-table-large', path: '/employee-leaves-table', exact: true },
        { title: 'time_corrections', icon: 'mdi-clock-alert-outline', path: '/hr/time-correction-approvals', exact: true },
        { title: 'holidays', icon: 'mdi-calendar-star', path: '/holidays', exact: true },
        { title: 'fingerprint_scan', icon: 'mdi-fingerprint', path: '/fingerprintscan', exact: true },
      ]
    } else {
      return [
        { title: 'my_profile', icon: 'mdi-account', path: '/employee/profile', exact: true },
        { title: 'dashboard', icon: 'mdi-view-dashboard-outline', path: '/employee/profile?view=dashboard', exact: true }, // Redirect to profile as dashboard
        { title: 'request_leave', icon: 'mdi-calendar-plus', path: '/leaves/request', exact: true },
        { title: 'request_time_correction', icon: 'mdi-clock-edit-outline', path: '/time-correction/request', exact: true },
        { title: 'my_schedule', icon: 'mdi-calendar-clock-outline', path: '/employee/leave-schedule', exact: true },
        { title: 'my_time_corrections', icon: 'mdi-history', path: '/time-correction/my-requests', exact: true },
        { title: 'holidays', icon: 'mdi-calendar-star', path: '/holidays', exact: true },
      ]
    }
  })
</script>

<template>
  <v-app :theme="theme.global.name.value">
    <!-- Auth Loading State -->
    <v-overlay v-if="authStore.loading" persistent class="align-center justify-center bg-background" style="opacity: 0.8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>

    <template v-if="user">
      <!-- Sidebar Navigation -->
      <v-navigation-drawer
        v-model="drawer"
        width="280"
        color="background"
        class="border-e"
      >
        <!-- Logo Section -->
        <div class="pa-6 d-flex align-center">
          <v-sheet
            width="40"
            height="40"
            color="transparent"
            class="d-flex align-center justify-center mr-3 rounded-lg gradient-box"
          >
            <v-icon icon="mdi-shield-check-outline" color="white" size="24"></v-icon>
          </v-sheet>
          <div>
            <div class="text-subtitle-1 font-weight-bold" style="line-height: 1.2">{{ t('app_name') }}</div>
            <div class="text-caption text-indigo-lighten-3 font-weight-medium">{{ t('enterprise_edition') }}</div>
          </div>
        </div>

        <v-divider class="mx-6 mb-4 opacity-20"></v-divider>

        <!-- Main Navigation Items -->
        <v-list nav class="px-4">
          <v-list-item
            v-for="item in navItems"
            :key="item.title"
            :value="item.title"
            :to="item.path"
            :exact="item.exact"
            rounded="lg"
            class="mb-1 text-medium-emphasis"
            active-class="text-primary bg-surface-light"
          >
            <template v-slot:prepend>
              <v-icon :icon="item.icon" size="20" class="mr-2"></v-icon>
            </template>
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ t(item.title) }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Sidebar Footer -->
        <template v-slot:append>
          <div class="pa-4">


            <v-list nav density="compact" class="pa-0">
              <v-list-item
                to="/settings"
                exact
                rounded="lg"
                class="text-medium-emphasis"
              >
               <template v-slot:prepend>
                  <v-icon icon="mdi-cog-outline" size="20" class="mr-2"></v-icon>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ t('settings') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- App Bar -->
      <v-app-bar
        height="64"
        flat
        class="border-b"
        style="background: rgba(11, 15, 26, 0.8); backdrop-filter: blur(12px);"
      >
        <v-app-bar-nav-icon @click="drawer = !drawer" class="d-lg-none"></v-app-bar-nav-icon>

        <v-toolbar-title class="font-weight-bold text-h6 d-none d-sm-block">
          {{ t('attendance_management') }}
        </v-toolbar-title>

        <v-spacer></v-spacer>

        <!-- Action Items -->
        <div class="d-flex align-center mr-4">
          <!-- Search -->
           <div class="mr-4 d-none d-md-block" style="width: 250px">
                <v-text-field
                  density="compact"
                  variant="outlined"
                  label="Search..."
                  prepend-inner-icon="mdi-magnify"
                  single-line
                  hide-details
                  rounded="lg"
                  bg-color="surface-light"
                  color="primary"
                ></v-text-field>
           </div>

          <v-btn icon size="small" variant="text" color="medium-emphasis" class="mx-1">
             <v-icon :icon="theme.global.current.value.dark ? 'mdi-weather-night' : 'mdi-weather-sunny'"></v-icon>
          </v-btn>
           <v-btn icon size="small" variant="text" color="medium-emphasis" class="mx-1" @click="toggleLanguage">
             <v-icon icon="mdi-translate"></v-icon>
          </v-btn>

          <NotificationMenu />
        </div>

        <v-divider vertical inset class="mx-2"></v-divider>

        <!-- User Menu -->
        <v-menu min-width="200" rounded="xl" transition="scale-transition" location="bottom end" offset="10">
          <template v-slot:activator="{ props }">
            <v-btn variant="text" class="px-2 ml-2" rounded="lg" height="48" v-bind="props">
              <div class="text-right d-none d-sm-block mr-3">
                <div class="text-body-2 font-weight-medium">{{ user.email }}</div>
                <div class="text-caption text-primary">Administrator</div>
              </div>
              <v-avatar size="36" class="border">
                <v-img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBB1s4XPYI94tDtd0ZLTK0RpG76r13MHbNwl8kKre7D_7kTB75rLae28kZJ0GeQFIlWUiYN6H_3OQtatWZ3m8gHB496EsBRuxerS3lSMcsracnnpNaUzNocV080sKj9Ar5YPXZmtO3K1ylIzV9CIenH0pV8qHKScZoE4vHCU579QsGpSH4ylEtYoTOJjcavAVw6CnIZAqtpbyQUPN2aIEJ3SoLlGLr-T_BWnU5zP0SgWIglwPkQEHB76NpNIq7ml0GuTm-dU2_CKc"></v-img>
              </v-avatar>
               <v-icon icon="mdi-chevron-down" size="16" class="ml-2 text-medium-emphasis"></v-icon>
            </v-btn>
          </template>
          <v-list class="py-1" density="compact" border rounded="xl" elevation="10" bg-color="surface">
            <v-list-item prepend-icon="mdi-account-outline" link>
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-cog-outline" link>
               <v-list-item-title>Account Settings</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item prepend-icon="mdi-logout" class="text-error" @click="handleSignOut">
              <v-list-item-title>Sign Out</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <!-- Content Area -->
      <v-main class="bg-background">
        <router-view v-slot="{ Component }">
          <v-fade-transition hide-on-leave>
             <div class="fill-height">
                <component :is="Component" />
             </div>
          </v-fade-transition>
        </router-view>
      </v-main>
    </template>

    <!-- Login View (No App Frame) -->
    <template v-else>
      <v-main class="fill-height bg-background">
        <router-view />
      </v-main>
    </template>
  </v-app>
</template>

<style scoped>
.gradient-box {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
}
.gradient-card {
    background: linear-gradient(160deg, #111827 0%, #0F172A 100%);
    border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
