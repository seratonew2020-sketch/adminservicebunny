<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchAuditLogs } from '@/services/api'
import dayjs from 'dayjs'

const logs = ref([])
const loading = ref(false)
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(20)
const search = ref('')

const headers = [
  { title: 'Time', key: 'created_at', align: 'start', sortable: true },
  { title: 'User ID', key: 'user_id', align: 'start' },
  { title: 'Action', key: 'action', align: 'start' },
  { title: 'Table', key: 'table_name', align: 'start' },
  { title: 'Changes', key: 'changes', align: 'start', sortable: false },
]

const loadLogs = async () => {
  loading.value = true
  try {
    const filters = {}
    if (search.value) {
      // Simple filter for table name or action if search is present
      // Note: Supabase ILIKE usually requires specific column. 
      // For simplicity, we might only filter by table_name here or need more complex logic.
      filters['table_name'] = `ilike.%${search.value}%`
    }

    const { data, total } = await fetchAuditLogs({
      page: page.value,
      limit: itemsPerPage.value,
      filters
    })

    logs.value = data
    totalItems.value = total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')

const formatChanges = (log) => {
  if (log.action === 'UPDATE') {
    return `Updated ${Object.keys(log.new_data || {}).join(', ')}`
  }
  return '-'
}

watch([page, itemsPerPage], () => {
  loadLogs()
})

onMounted(() => {
  loadLogs()
})
</script>

<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Audit Logs</h1>
      <v-btn icon="mdi-refresh" variant="text" @click="loadLogs" :loading="loading"></v-btn>
    </div>

    <v-card class="pa-4">
      <div class="d-flex align-center mb-4 gap-4">
        <v-text-field
          v-model="search"
          label="Search Table Name"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          @keyup.enter="loadLogs"
          style="max-width: 300px;"
        ></v-text-field>
        <v-btn color="primary" @click="loadLogs">Search</v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="logs"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
      >
        <template v-slot:item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>
        
        <template v-slot:item.action="{ item }">
          <v-chip
            size="small"
            :color="item.action === 'INSERT' ? 'green' : item.action === 'UPDATE' ? 'blue' : 'red'"
          >
            {{ item.action }}
          </v-chip>
        </template>

        <template v-slot:item.changes="{ item }">
          <div class="text-caption text-medium-emphasis">
            {{ formatChanges(item) }}
          </div>
        </template>
        
        <template v-slot:bottom>
           <div class="d-flex justify-end pa-4">
             <v-pagination
               v-model="page"
               :length="Math.ceil(totalItems / itemsPerPage)"
               :total-visible="5"
             ></v-pagination>
           </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>
