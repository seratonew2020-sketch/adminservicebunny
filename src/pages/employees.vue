<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import dayjs from 'dayjs'
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '@/services/api'
import { useTheme } from 'vuetify'

const theme = useTheme()
const search = ref('')
const loading = ref(false)
const employees = ref([])
const page = ref(1)
const itemsPerPage = ref(100)
const totalItems = ref(0)
const dialog = ref(false)
const dialogDelete = ref(false)
const editedIndex = ref(-1)
const saving = ref(false)

const defaultItem = {
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  role: 'employee',
  status: 'active'
}

const editedItem = ref({ ...defaultItem })
const editedId = ref(null)

const headers = [
  { title: 'Employee ID', key: 'employee_code', align: 'start', sortable: true },
  { title: 'Full Name', key: 'full_name', align: 'start', sortable: true },
  { title: 'Email', key: 'email', align: 'start', sortable: true },
  { title: 'Phone', key: 'phone', align: 'start', sortable: true },
  { title: 'Department', key: 'department', align: 'start', sortable: true },
  { title: 'Position', key: 'position', align: 'start', sortable: true },
  { title: 'Role', key: 'role', align: 'start', sortable: true },
  { title: 'Joined Date', key: 'created_at', align: 'start', sortable: true },
  { title: 'Status', key: 'status', align: 'center', sortable: true },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
]

const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'New Employee' : 'Edit Employee'
})

const paginationText = computed(() => {
  if (totalItems.value === 0) return 'No data'
  const start = (page.value - 1) * itemsPerPage.value + 1
  const end = Math.min(page.value * itemsPerPage.value, totalItems.value)
  return `Showing ${start} - ${end} of ${totalItems.value}`
})

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Fetch Data
const loadData = async () => {
  loading.value = true
  try {
    const { data, total } = await fetchEmployees({
      page: page.value,
      limit: itemsPerPage.value
    })
    
    employees.value = data.map(emp => ({
      ...emp,
      full_name: `${emp.first_name} ${emp.last_name}`,
      created_at: dayjs(emp.created_at).format('YYYY-MM-DD'),
      status: emp.status || (emp.is_active ? 'active' : 'inactive') // Normalize status
    }))
    totalItems.value = total
  } catch (error) {
    console.error('Failed to load employees:', error)
  } finally {
    loading.value = false
  }
}

// Watchers
watch([page, itemsPerPage], () => {
  loadData()
})

// Dialog Handlers
const close = () => {
  dialog.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
    editedIndex.value = -1
    editedId.value = null
  }, 300)
}

const closeDelete = () => {
  dialogDelete.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
    editedIndex.value = -1
    editedId.value = null
  }, 300)
}

const editItem = (item) => {
  editedIndex.value = employees.value.indexOf(item)
  editedId.value = item.id // Keep ID separate
  editedItem.value = { ...item }
  dialog.value = true
}

const deleteItem = (item) => {
  editedIndex.value = employees.value.indexOf(item)
  editedId.value = item.id
  editedItem.value = { ...item }
  dialogDelete.value = true
}

const deleteItemConfirm = async () => {
  saving.value = true
  try {
    if (editedId.value) {
        await deleteEmployee(editedId.value)
        await loadData()
    }
    closeDelete()
  } catch (error) {
    console.error('Failed to delete employee:', error)
  } finally {
    saving.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    // Basic Validation
    if (!editedItem.value.employee_code || !editedItem.value.first_name || !editedItem.value.last_name) {
      alert('Please fill in required fields')
      saving.value = false
      return
    }

    const payload = {
      employee_code: editedItem.value.employee_code,
      first_name: editedItem.value.first_name,
      last_name: editedItem.value.last_name,
      email: editedItem.value.email,
      phone: editedItem.value.phone,
      department: editedItem.value.department,
      position: editedItem.value.position,
      role: editedItem.value.role,
      status: editedItem.value.status,
      is_active: editedItem.value.status === 'active'
    }

    if (editedIndex.value > -1) {
      // Update
      await updateEmployee(editedId.value, payload)
    } else {
      // Create
      await createEmployee(payload)
    }
    await loadData()
    close()
  } catch (error) {
    console.error('Failed to save employee:', error)
    alert('Failed to save: ' + error.message)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <v-row class="mb-4">
      <v-col cols="12" sm="8">
        <h1 class="text-h4 font-weight-bold">Employees</h1>
        <p class="text-medium-emphasis">Manage employee information and access.</p>
      </v-col>
      <v-col cols="12" sm="4" class="text-sm-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          rounded="lg"
          @click="dialog = true"
        >
          Add Employee
        </v-btn>
      </v-col>
    </v-row>

    <v-card flat border rounded="xl" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
      <!-- Toolbar -->
      <div class="px-6 py-4 border-b d-flex flex-column flex-sm-row justify-space-between align-center gap-4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search Employees"
          variant="outlined"
          density="compact"
          hide-details
          class="flex-grow-1"
          style="max-width: 400px;"
          rounded="lg"
        ></v-text-field>
        <v-btn icon variant="text" @click="loadData">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="employees"
        :loading="loading"
        :search="search"
        :items-per-page="itemsPerPage"
        :items-per-page-options="[10, 20, 50, 100, -1]"
        class="bg-transparent"
        hover
      >
        <template v-slot:item.full_name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="primary" variant="tonal" size="36" class="mr-3">
              <span class="text-subtitle-2 font-weight-bold">{{ item.first_name.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.full_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.position || 'No Position' }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.role="{ item }">
          <span class="text-capitalize">{{ item.role }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.status === 'active' ? 'success' : 'grey'"
            size="small"
            variant="tonal"
            class="text-capitalize"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editItem(item)"></v-btn>
            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem(item)"></v-btn>
          </div>
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
                  @click="page > 1 && (page--)"
                ></v-btn>
                <v-btn
                  icon="mdi-chevron-right"
                  variant="outlined"
                  size="small"
                  rounded="lg"
                  :disabled="page >= totalPages"
                   @click="page < totalPages && (page++)"
                ></v-btn>
             </div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card rounded="xl">
        <v-card-title class="pa-4 border-b">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.employee_code"
                  label="Employee Code *"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.status"
                  :items="['active', 'inactive']"
                  label="Status"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.first_name"
                  label="First Name *"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.last_name"
                  label="Last Name *"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.email"
                  label="Email"
                  variant="outlined"
                  density="compact"
                  type="email"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.phone"
                  label="Phone"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.department"
                  label="Department"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.position"
                  label="Position"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.role"
                  :items="['admin', 'manager', 'employee']"
                  label="Role"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="close">
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="elevated" @click="save" :loading="saving">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card rounded="xl">
        <v-card-title class="text-h5 pa-4">Confirm Delete</v-card-title>
        <v-card-text class="pa-4">
          Are you sure you want to delete this employee? This action cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteItemConfirm" :loading="saving">Delete</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
