<script setup>
import { ref, onMounted } from 'vue'
import { fetchEmployees } from '@/services/api'
import { supabase } from '@/lib/supabase'

const tab = ref('employees')
const loading = ref(false)
const items = ref([])
const search = ref('')
const page = ref(1)
const totalItems = ref(0)
const itemsPerPage = ref(10)

// Bulk Import
const fileInput = ref(null)
const importing = ref(false)

const headers = [
  { title: 'Employee Code', key: 'employee_code' },
  { title: 'Full Name', key: 'first_name' },
  { title: 'Department', key: 'department' },
  { title: 'Position', key: 'position' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', align: 'end' },
]

const loadData = async () => {
  loading.value = true
  try {
    if (tab.value === 'employees') {
      const { data, total } = await fetchEmployees({ page: page.value, limit: itemsPerPage.value })
      items.value = data.map(e => ({
        ...e,
        full_name: `${e.first_name} ${e.last_name}`
      }))
      totalItems.value = total
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  importing.value = true
  try {
    // Basic CSV parsing logic (Client-side)
    const text = await file.text()
    const rows = text.split('\n').slice(1) // Skip header
    const dataToInsert = rows.map(row => {
      const [code, first, last, email, dept] = row.split(',')
      if (!code || !email) return null
      return {
        employee_code: code.trim(),
        first_name: first?.trim(),
        last_name: last?.trim(),
        email: email?.trim(),
        department: dept?.trim()
      }
    }).filter(Boolean)

    if (dataToInsert.length > 0) {
      const { error } = await supabase.from('employees').upsert(dataToInsert, { onConflict: 'employee_code' })
      if (error) throw error
      alert(`Successfully imported ${dataToInsert.length} records`)
      loadData()
    }
  } catch (err) {
    alert('Import failed: ' + err.message)
  } finally {
    importing.value = false
    fileInput.value = null
  }
}

const exportCSV = () => {
  // TODO: Implement export logic
  alert('Export feature coming soon')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <v-container fluid>
    <h1 class="text-h4 font-weight-bold mb-6">Data Management</h1>

    <v-tabs v-model="tab" color="primary" class="mb-6">
      <v-tab value="employees">Employees</v-tab>
      <v-tab value="departments">Departments</v-tab>
      <v-tab value="positions">Positions</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="employees">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="d-flex gap-2">
              <v-btn
                color="success"
                prepend-icon="mdi-upload"
                @click="$refs.fileInput.click()"
                :loading="importing"
              >
                Import CSV
              </v-btn>
              <input
                type="file"
                ref="fileInput"
                class="d-none"
                accept=".csv"
                @change="handleFileUpload"
              >
              <v-btn
                variant="outlined"
                prepend-icon="mdi-download"
                @click="exportCSV"
              >
                Export
              </v-btn>
            </div>
            <v-btn color="primary" prepend-icon="mdi-plus">Add New</v-btn>
          </div>

          <v-data-table
            :headers="headers"
            :items="items"
            :loading="loading"
          >
            <template v-slot:item.full_name="{ item }">
              {{ item.first_name }} {{ item.last_name }}
            </template>
            
            <template v-slot:item.actions>
              <v-btn icon="mdi-pencil" size="small" variant="text"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="departments">
        <v-card class="pa-8 text-center">
          <v-icon size="64" color="grey">mdi-domain</v-icon>
          <h3 class="text-h6 mt-4">Department Management</h3>
          <p class="text-medium-emphasis">Coming soon...</p>
        </v-card>
      </v-window-item>
      
      <v-window-item value="positions">
        <v-card class="pa-8 text-center">
          <v-icon size="64" color="grey">mdi-briefcase</v-icon>
          <h3 class="text-h6 mt-4">Position Management</h3>
          <p class="text-medium-emphasis">Coming soon...</p>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>
