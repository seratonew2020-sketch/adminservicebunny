<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

const theme = useTheme()
const { t } = useI18n()

// --- Mock Data: Stats ---
const stats = ref([
  {
    title: 'total_employees',
    value: '1,248',
    icon: 'groups',
    color: 'blue-darken-2',
    bgColor: 'blue-lighten-5',
    darkBgColor: 'rgba(30, 58, 138, 0.2)'
  },
  {
    title: 'currently_clocked_in',
    value: '856',
    icon: 'login',
    color: 'green-darken-1',
    bgColor: 'green-lighten-5',
    darkBgColor: 'rgba(6, 78, 59, 0.2)'
  },
  {
    title: 'late_arrivals',
    value: '12',
    icon: 'schedule',
    color: 'orange-darken-2',
    bgColor: 'amber-lighten-5',
    darkBgColor: 'rgba(120, 53, 15, 0.2)'
  }
])

// --- Mock Data: Table Headers ---
const headers = computed(() => [
  { title: t('table_employee'), key: 'employee', align: 'start', sortable: true },
  { title: t('table_id'), key: 'empId', align: 'start', sortable: true },
  { title: t('table_department'), key: 'department', align: 'start', sortable: true },
  { title: t('table_status'), key: 'status', align: 'start', sortable: true },
  { title: t('table_actions'), key: 'actions', align: 'end', sortable: false },
])

// --- Mock Data: Employees ---
const search = ref('')
const employees = ref([
  {
    id: 1,
    name: 'Sarah Jenkins',
    email: 'sarah.j@enterprise.com',
    empId: '#EMP-2041',
    department: 'Engineering',
    status: 'Clocked In',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzoAPdo1Zi2wEB9_b_vtIQbveZQa1fsOophKrCOj6Nrdtx7wLIkyxuOjyWl5FU9yzBNTtjOrcZyfqGbQu3ejC3G9il3PJw5WCPM3yXOAwmSZ_A8HBmYLbFgSTeg3TOdf0TsczzLd7_xIIT9EUUSis5u2XFexabeevWQ5iebUPwWPWtYcBqk24i_BPsjIoMqex8ZuBFKYxoJiwy_JbkUVH2Dchok3wOG-vehDnuKUY55bWnxvOdOFlcbnSahQ6pURnPjQfS4UXiZqY'
  },
  {
    id: 2,
    name: 'Marcus Thompson',
    email: 'm.thompson@enterprise.com',
    empId: '#EMP-2045',
    department: 'Product Design',
    status: 'Late Arrival',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZzzalqXym7ZxGroaG-aa5JGfyOZUZFW9JfTx9POGE44zMFY3EA4Hjsrvsfyu0hxT-Udupjfgo7AAjMGOHl-DPwOCZc7cHLzRCv087eEiAPVplsLTCeHDzySCp8JjcShlwblccsD4e20m6joDfF74Dz-CSxyM7pLJyAeOdBvp-bpP45SbOV7fyFN_11GmTirHSaVm9I_13Eg6vNRCwBkIh14C3bq8wvcyUbrMEd-jRduQNMRrR6NIohE3uLy7n9SSz10vk-TuR1Bk'
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    email: 'elena.r@enterprise.com',
    empId: '#EMP-2102',
    department: 'Marketing',
    status: 'Off-duty',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA68GgEc1TPc9GPRLdfkktQSX74sotRuiOMYLrqFBPpuO2cTnZFZ8EwZIv5bEavxlErmqPbFsZT7QAYbnEgVRNaCocYffOqFbJxIrmpaHS9QIma2NMQqQjr8eDqDkHggj6xbKcThHPTz6vhnjw8BohXnz_mwYTpmkXYbEX1ATy7729VQ53Zh3TnK-fAH9yqHChWlDjKv1R4NUk92v__Uh-_bRIwweALKFkMj5vQe_QeFMdoLLtWVVvRwtSZJtHIW2_kcpkAIb_It0Y'
  }
])
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
        <h2 class="text-h6 font-weight-bold">Recent Activity</h2>

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
          <v-btn icon="mdi-filter-variant" variant="text" color="medium-emphasis"></v-btn>
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="employees"
        :search="search"
        item-value="id"
        class="bg-transparent"
        hover
      >
        <template v-slot:item="{ item }">
           <tr class="hover-row transition-colors">
              <td class="px-6 py-4">
                 <div class="d-flex align-center gap-3">
                    <v-avatar size="40" :image="item.avatar" class="border"></v-avatar>
                    <div>
                       <p class="text-sm font-weight-bold mb-0">{{ item.name }}</p>
                       <p class="text-caption text-medium-emphasis mb-0">{{ item.email }}</p>
                    </div>
                 </div>
              </td>
              <td class="px-6 py-4 text-sm text-medium-emphasis">{{ item.empId }}</td>
              <td class="px-6 py-4">
                  <v-chip
                    size="small"
                    rounded="lg"
                    class="font-weight-bold"
                    :color="item.department === 'Engineering' ? 'blue' : item.department === 'Product Design' ? 'purple' : 'orange'"
                    variant="tonal"
                  >
                    {{ item.department }}
                  </v-chip>
              </td>
              <td class="px-6 py-4">
                 <div class="d-flex align-center gap-2">
                    <v-icon
                      size="12"
                      :color="item.status === 'Clocked In' ? 'success' : item.status === 'Late Arrival' ? 'warning' : 'grey'"
                      icon="mdi-circle"
                    ></v-icon>
                    <span class="text-sm font-weight-medium text-medium-emphasis">{{ item.status }}</span>
                 </div>
              </td>
              <td class="px-6 py-4 text-end">
                 <v-btn icon="mdi-dots-vertical" variant="text" size="small" color="medium-emphasis"></v-btn>
              </td>
           </tr>
        </template>

        <template v-slot:bottom>
           <div class="pa-4 border-t d-flex align-center justify-space-between">
              <p class="text-caption text-medium-emphasis mb-0 d-none d-sm-block">{{ t('showing_stats') }}</p>
              <div class="d-flex align-center gap-2">
                 <v-btn icon="mdi-chevron-left" variant="outlined" size="small" rounded="lg" disabled></v-btn>
                 <v-btn icon="mdi-chevron-right" variant="outlined" size="small" rounded="lg"></v-btn>
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
