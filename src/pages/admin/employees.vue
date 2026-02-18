<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Department', key: 'dept_id' },
  { title: 'Position', key: 'pos_id' },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const employees = ref([])
const loading = ref(false)

const fetchEmployees = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('employees')
    .select('*, departments:dept_id(name), positions:pos_id(title)')
  
  if (data) employees.value = data
  loading.value = false
}

onMounted(() => {
  fetchEmployees()
})
</script>

<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Employee Management</h1>
      <v-btn color="primary" prepend-icon="mdi-account-plus">Add Employee</v-btn>
    </div>

    <v-card :loading="loading">
      <v-data-table :headers="headers" :items="employees">
        <template v-slot:item.dept_id="{ item }">
          {{ item.departments?.name || '-' }}
        </template>
        <template v-slot:item.pos_id="{ item }">
          {{ item.positions?.title || '-' }}
        </template>
        <template v-slot:item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'error'" size="small">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>
        <template v-slot:item.actions>
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary"></v-btn>
          <v-btn icon="mdi-delete" size="small" variant="text" color="error"></v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>