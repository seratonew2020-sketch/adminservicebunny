<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { fetchStats, fetchEmployees } from '@/services/api'

const theme = useTheme()
const { t } = useI18n()

// --- Mock Data: Stats ---
const stats = ref([
  {
    title: 'total_employees',
    value: '-',
    mdiIcon: 'mdi-account-group',
    color: 'blue-darken-2',
    bgColor: 'blue-lighten-5',
    darkBgColor: 'rgba(30, 58, 138, 0.2)'
  },
  {
    title: 'currently_clocked_in',
    value: '-',
    mdiIcon: 'mdi-clock-check-outline',
    color: 'green-darken-1',
    bgColor: 'green-lighten-5',
    darkBgColor: 'rgba(6, 78, 59, 0.2)'
  },
  {
    title: 'late_arrivals',
    value: '-',
    mdiIcon: 'mdi-clock-alert-outline',
    color: 'orange-darken-2',
    bgColor: 'amber-lighten-5',
    darkBgColor: 'rgba(120, 53, 15, 0.2)'
  }
])

// --- Table Headers ---
const headers = computed(() => [
  { title: t('table_employee'), key: 'first_name', align: 'start', sortable: true },
  { title: t('table_id'), key: 'employee_id', align: 'start', sortable: true },
  { title: t('table_department'), key: 'department', align: 'start', sortable: true },
  { title: t('table_status'), key: 'status', align: 'start', sortable: true },
  { title: t('table_actions'), key: 'actions', align: 'end', sortable: false },
])

// --- Employees Data ---
const search = ref('')
const loading = ref(false)
const employees = ref([])
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0) // Total count from API

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginationText = computed(() => {
  if (totalItems.value === 0) return t('showing_stats') || 'No data'
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, totalItems.value)
  return `${t('showing_stats') || 'Showing'} ${start} - ${end} of ${totalItems.value}`
})

const loadData = async () => {
  loading.value = true
  try {
    const [empResponse, statsData] = await Promise.all([
      fetchEmployees({ page: page.value, limit: itemsPerPage.value }),
      fetchStats()
    ])

    // Handle new response structure { data, total }
    employees.value = empResponse.data.map(emp => ({
      ...emp,
      status: emp.status || (emp.is_active ? 'active' : 'inactive')
    }))
    totalItems.value = empResponse.total

    // Update stats with real data
    stats.value[0].value = statsData.total_employees.toString()
    stats.value[1].value = statsData.currently_clocked_in.toString()
    stats.value[2].value = statsData.late_arrivals.toString()
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <v-container fluid class="pa-4 pa-sm-6 pa-md-8">
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex flex-column flex-sm-row justify-sm-space-between align-sm-center">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">Dashboard</h1>
            <p class="text-medium-emphasis">Overview of your enterprise attendance.</p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            rounded="lg"
            size="large"
            class="mt-4 mt-sm-0 text-capitalize font-weight-bold"
          >
            New Attendance
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Stats Row -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4" v-for="(item, index) in stats" :key="index">
        <v-card flat rounded="xl" class="border pa-6 d-flex align-center gap-4 card-shadow" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
          <v-sheet
            width="56"
            height="56"
            rounded="lg"
            class="d-flex align-center justify-center transition-all icon-stat"
            :style="{ backgroundColor: theme.global.current.value.dark ? item.darkBgColor : item.bgColor }"
          >
             <v-icon :icon="item.mdiIcon" :color="item.color" size="28 text-primary"></v-icon>
          </v-sheet>
          <div>
            <p class="text-caption font-weight-medium text-medium-emphasis mb-0">{{ t(item.title) }}</p>
            <p class="text-h5 font-weight-bold mb-0 lh-1">{{ item.value }}</p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Content Card -->
    <v-card flat rounded="xl" class="border card-shadow overflow-hidden" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
      <div class="px-6 py-4 border-b d-flex flex-column flex-sm-row justify-space-between align-sm-center gap-3">
        <h2 class="text-h6 font-weight-bold">ข้อมูลพนักงาน</h2>

        <div class="d-flex align-center gap-2" style="max-width: 400px; width: 100%;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            :placeholder="t('search_placeholder')"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            bg-color="transparent"
          ></v-text-field>
          <v-btn icon="mdi-filter-variant" variant="text" color="medium-emphasis" @click="loadData"></v-btn>
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="employees"
        :search="search"
        :loading="loading"
        item-value="id"
        class="bg-transparent"
        hover
      >
        <template v-slot:item="{ item }">
           <tr class="hover-row transition-colors">
              <td class="px-6 py-4">
                 <div class="d-flex align-center gap-3">
                    <v-avatar size="40" :image="item.avatar_url || 'https://cdn.vuetifyjs.com/images/lists/1.jpg'" class="border"></v-avatar>
                    <div>
                       <p class="text-sm font-weight-bold mb-0">
                         {{ item.first_name }} {{ item.last_name }}
                       </p>
                       <p class="text-caption text-medium-emphasis mb-0">{{ item.email }}</p>
                    </div>
                 </div>
              </td>
              <td class="px-6 py-4 text-sm text-medium-emphasis">#{{ item.employee_id }}</td>
              <td class="px-6 py-4">
                  <v-chip
                    size="small"
                    rounded="lg"
                    class="font-weight-bold"
                    :color="item.department === 'Engineering' ? 'blue' : item.department === 'Product Design' ? 'purple' : 'orange'"
                    variant="tonal"
                  >
                    {{ item.department || 'Unknown' }}
                  </v-chip>
              </td>
              <td class="px-6 py-4">
                 <div class="d-flex align-center gap-2">
                    <v-icon
                      size="12"
                      :color="item.status === 'active' ? 'success' : 'grey'"
                      icon="mdi-circle"
                    ></v-icon>
                    <span class="text-sm font-weight-medium text-medium-emphasis text-capitalize">
                      {{ item.status || 'Unknown' }}
                    </span>
                 </div>
              </td>
              <td class="px-6 py-4 text-end">
                 <v-btn icon="mdi-dots-vertical" variant="text" size="small" color="medium-emphasis"></v-btn>
              </td>
           </tr>
        </template>

        <template v-slot:bottom>
            <div class="pa-4 border-t d-flex align-center justify-space-between">
               <p class="text-caption text-medium-emphasis mb-0 d-none d-sm-block">{{ paginationText }}</p>
               <div class="d-flex align-center gap-2">
                  <v-btn
                    icon="mdi-chevron-left"
                    variant="outlined"
                    size="small"
                    rounded="lg"
                    :disabled="page <= 1"
                    @click="page > 1 && (page--, loadData())"
                  ></v-btn>
                  <v-btn
                    icon="mdi-chevron-right"
                    variant="outlined"
                    size="small"
                    rounded="lg"
                    :disabled="page >= totalPages"
                     @click="page < totalPages && (page++, loadData())"
                  ></v-btn>
               </div>
            </div>
        </template>
      </v-data-table>
    </v-card>

     <div class="text-center mt-12 mb-6">
         <p class="text-caption text-medium-emphasis">
           © 2024 {{ t('app_name') }} {{ t('enterprise_edition') }}.
           {{ t('system_status') }}: <span class="text-success font-weight-bold">{{ t('operational') }}</span>
         </p>
     </div>
  </v-container>
</template>

<style scoped>
.lh-1 { line-height: 1; }
.card-shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important; }
.icon-stat { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.hover-row:hover { background-color: rgba(var(--v-theme-primary), 0.02); }
</style>
