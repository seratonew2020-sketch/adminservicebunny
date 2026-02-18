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
        { title: 'holidays', icon: 'mdi-calendar-star', path: '/holidays', exact: true },
        { title: 'fingerprint_scan', icon: 'mdi-fingerprint', path: '/fingerprintscan', exact: true },
      ]
    } else {
      return [
        { title: 'my_profile', icon: 'mdi-account', path: '/employee/profile', exact: true },
        { title: 'dashboard', icon: 'mdi-view-dashboard-outline', path: '/employee/profile?view=dashboard', exact: true }, // Redirect to profile as dashboard
        { title: 'request_leave', icon: 'mdi-calendar-plus', path: '/leaves/request', exact: true },
        { title: 'my_schedule', icon: 'mdi-calendar-clock-outline', path: '/employee/leave-schedule', exact: true },
        { title: 'holidays', icon: 'mdi-calendar-star', path: '/holidays', exact: true },
      ]
    }
  })
</script>

<template>
  <v-app :theme="theme.global.name.value">
    <!-- Auth Loading State -->
    <v-overlay v-if="authStore.loading" persistent class="align-center justify-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>

    <template v-if="user">
      <!-- Sidebar Navigation -->
      <v-navigation-drawer
        v-model="drawer"
        width="280"
        color="surface"
        class="border-e"
      >
        <!-- Logo Section -->
        <div class="pa-6 d-flex align-center gap-3">
          <v-sheet
            width="40"
            height="40"
            color="primary"
            rounded="lg"
            class="d-flex align-center justify-center"
          >
            <v-icon icon="mdi-shield-check-outline" color="white"></v-icon>
          </v-sheet>
          <div>
            <div class="text-subtitle-1 font-weight-bold leading-tight line-clamp-1">{{ t('app_name') }}</div>
            <div class="text-caption text-medium-emphasis">{{ t('enterprise_edition') }}</div>
          </div>
        </div>

        <v-divider class="mx-4 opacity-10"></v-divider>

        <!-- Main Navigation Items -->
        <v-list nav class="px-3 py-4">
          <v-list-item
            v-for="item in navItems"
            :key="item.title"
            :value="item.title"
            :to="item.path"
            :exact="item.exact"
            :prepend-icon="item.icon"
            color="primary"
            rounded="lg"
            class="mb-1"
          >
            <v-list-item-title class="text-sm font-weight-bold">
              {{ t(item.title) }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Sidebar Footer -->
        <template v-slot:append>
          <div class="pa-3">
            <v-list nav>
              <v-list-item
                to="/settings"
                exact
                prepend-icon="mdi-cog-outline"
                color="primary"
                rounded="lg"
              >
                <v-list-item-title class="text-sm font-weight-bold">
                  {{ t('settings') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- App Bar -->
      <v-app-bar
        height="70"
        flat
        class="border-b"
        color="surface"
      >
        <v-app-bar-nav-icon @click="drawer = !drawer" class="d-lg-none"></v-app-bar-nav-icon>

        <v-toolbar-title class="font-weight-bold text-h6 d-none d-sm-block">
          {{ t('attendance_management') }}
        </v-toolbar-title>

        <v-spacer></v-spacer>

        <!-- Action Items -->
        <div class="d-flex align-center gap-2 mr-2">
          <v-btn icon size="small" @click="toggleTheme" variant="text">
            <v-icon :icon="theme.global.current.value.dark ? 'mdi-weather-night' : 'mdi-weather-sunny'"></v-icon>
          </v-btn>
          <v-btn icon size="small" @click="toggleLanguage" variant="text">
            <v-icon icon="mdi-translate"></v-icon>
          </v-btn>

          <NotificationMenu />
        </div>

        <v-divider vertical inset class="mx-2"></v-divider>

        <!-- User Menu -->
        <v-menu min-width="200" rounded="xl" transition="scale-transition">
          <template v-slot:activator="{ props }">
            <div class="d-flex align-center gap-3 px-2 cursor-pointer" v-bind="props">
              <div class="text-right d-none d-sm-block">
                <p class="text-sm font-weight-bold mb-0 line-clamp-1">{{ user.email }}</p>
                <p class="text-caption text-medium-emphasis mb-0">Administrator</p>
              </div>
              <v-avatar size="40" class="border">
                <v-img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBB1s4XPYI94tDtd0ZLTK0RpG76r13MHbNwl8kKre7D_7kTB75rLae28kZJ0GeQFIlWUiYN6H_3OQtatWZ3m8gHB496EsBRuxerS3lSMcsracnnpNaUzNocV080sKj9Ar5YPXZmtO3K1ylIzV9CIenH0pV8qHKScZoE4vHCU579QsGpSH4ylEtYoTOJjcavAVw6CnIZAqtpbyQUPN2aIEJ3SoLlGLr-T_BWnU5zP0SgWIglwPkQEHB76NpNIq7ml0GuTm-dU2_CKc"></v-img>
              </v-avatar>
            </div>
          </template>
          <v-list>
            <v-list-item prepend-icon="mdi-account-outline" link>
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>
            <v-divider class="my-2"></v-divider>
            <v-list-item prepend-icon="mdi-logout" color="error" @click="handleSignOut">
              <v-list-item-title>Sign Out</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <!-- Content Area -->
      <v-main class="bg-background">
        <router-view v-slot="{ Component }">
          <v-fade-transition hide-on-leave>
            <component :is="Component" />
          </v-fade-transition>
        </router-view>
      </v-main>
    </template>

    <!-- Login View (No App Frame) -->
    <template v-else>
      <v-main class="w-100 h-100">
        <router-view />
      </v-main>
    </template>
  </v-app>
</template>

<style>
/* Utilities */
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.leading-tight { line-height: 1.25; }

/* Line Clamp */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom Colors classes mapping if not in Vuetify theme */
.text-emerald-500 { color: #10b981; }
.bg-emerald-500 { background-color: #10b981; }
.bg-emerald-50 { background-color: #ecfdf5; }

.bg-amber-500 { background-color: #f59e0b; }
.bg-amber-50 { background-color: #fffbeb; }

.bg-blue-50 { background-color: #eff6ff; }
.bg-blue-900 { background-color: #1e3a8a; }
.text-blue-300 { color: #93c5fd; }
.text-blue-800 { color: #1e40af; }

.bg-purple-50 { background-color: #faf5ff; }
.bg-purple-900 { background-color: #581c87; }
.text-purple-300 { color: #d8b4fe; }
.text-purple-800 { color: #6b21a8; }

.bg-orange-50 { background-color: #fff7ed; }
.bg-orange-900 { background-color: #7c2d12; }
.text-orange-300 { color: #fdba74; }
.text-orange-800 { color: #9a3412; }

/* Search */
.search-input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border-radius: 8px;
  outline: none;
  font-size: 0.875rem;
  transition: all 0.2s;
}
.search-input:focus {
   box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}

/* Stats Card */
.card-shadow {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.stats-icon {
  width: 48px;
  height: 48px;
}

/* Table */
.v-data-table {
  background: transparent !important;
}
</style>
