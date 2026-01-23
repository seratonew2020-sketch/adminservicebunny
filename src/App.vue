<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useTheme } from 'vuetify'
  import { useI18n } from 'vue-i18n'
  import { useAuthStore } from '@/stores/auth'
  import { useRouter, useRoute } from 'vue-router'
  import { storeToRefs } from 'pinia'

  // --- Theme Management ---
  const theme = useTheme()
  const { t, locale } = useI18n()
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const { user } = storeToRefs(authStore)
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

  const navItems = [
    { title: 'dashboard', icon: 'mdi-view-dashboard-outline', path: '/' },
    { title: 'reports', icon: 'mdi-file-chart-outline', path: '/reports' },
    { title: 'time_report', icon: 'mdi-clock-time-four-outline', path: '/timeall' },
    { title: 'employees', icon: 'mdi-account-group-outline', path: '/employees' },
    { title: 'schedule', icon: 'mdi-calendar-clock-outline', path: '/schedule' },
    { title: 'fingerprint_scan', icon: 'mdi-fingerprint', path: '/fingerprintscan' },
  ]
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
        elevation="0"
        class="border-e"
        :color="theme.global.current.value.dark ? '#111111' : 'white'"
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
            :key="item.path"
            :to="item.path"
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
        :color="theme.global.current.value.dark ? '#111111' : 'white'"
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
          <v-btn icon size="small" variant="text">
            <v-badge color="error" dot dot-small>
              <v-icon icon="mdi-bell-outline"></v-icon>
            </v-badge>
          </v-btn>
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
      <v-main class="w-100 h-100 d-flex flex-column" :class="theme.global.current.value.dark ? 'bg-background-dark' : 'bg-background-light'">
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
/* Global Resets/Fonts Override handled mostly by Vuetify, but specific utilities here */
:root {
  --primary-color: #1A1A1A;
}

body {
  font-family: 'Inter', sans-serif !important;
}

/* Utilities */
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.leading-tight { line-height: 1.25; }
.w-100 { width: 100%; }

.text-18 { font-size: 18px; font-variation-settings: 'opsz' 20; }
.text-20 { font-size: 20px; font-variation-settings: 'opsz' 20; }
.text-sm { font-size: 0.875rem !important; }
.text-xs { font-size: 0.75rem !important; }

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

/* Sidebar */
.sidebar-active {
    background-color: rgba(19, 91, 236, 0.1);
    color: #135bec;
}
.sidebar-border {
  border-right: 1px solid rgba(0,0,0,0.08);

}
.theme--dark .sidebar-border {
  border-right: 1px solid rgba(255,255,255,0.08);
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #475569;
}
.theme--dark .sidebar-item {
   color: #94a3b8;
}
.sidebar-item:hover {
  background-color: #f1f5f9;
}
.theme--dark .sidebar-item:hover {
  background-color: #1e293b;
}

.sidebar-item.active {
   background-color: rgba(19, 91, 236, 0.1);
   color: #135bec;
}

/* App Bar */
.divider-vertical {
  height: 32px;
  width: 1px;
  background-color: #e2e8f0;
}
.theme--dark .divider-vertical {
   background-color: #334155;
}

.dark-toggle-bg.bg-grey-lighten-4 {
    background-color: #f1f5f9 !important;
}
.theme--dark .dark-toggle-bg {
    background-color: #1e293b !important;
}

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
   box-shadow: 0 0 0 2px #1A1A1A; /* Primary ring */
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
}

.border-light { border: 1px solid #e2e8f0; }
.border-dark { border: 1px solid #334155; }
.bg-background-light { background-color: #f7f7f7; }
.bg-background-dark { background-color: #191919; }
.bg-dark-surface { background-color: #1e293b; }

/* Buttons */
.clock-in-btn {
  background-color: #1A1A1A;
}
.clock-in-btn:hover {
  background-color: #2563eb; /* approximate blue-700 hover */
}
.hover-primary:hover {
   color: #1A1A1A;
}
.theme--dark .hover-primary:hover {
   color: white;
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
.dot {
  width: 8px;
  height: 8px;
}
.pagination-btn {
  width: 32px;
  height: 32px;
  color: #64748b;
  background: white;
  border-color: #e2e8f0;
}
.theme--dark .pagination-btn {
   background: #1e293b;
   border-color: #334155;
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Theme specifics for Tailwind colors approximation without full palette */
.text-slate-700 { color: #334155; }
.text-slate-500 { color: #64748b; }
.text-medium-emphasis { color: #64748b !important; }
.theme--dark .text-medium-emphasis { color: #94a3b8 !important; }

</style>