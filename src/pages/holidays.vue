<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1>Holiday Management</h1>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Add Holiday</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-tabs v-model="tab" color="primary">
          <v-tab value="list">List View</v-tab>
          <v-tab value="calendar">Calendar View</v-tab>
        </v-tabs>

        <v-window v-model="tab" class="mt-4">
          <!-- List View -->
          <v-window-item value="list">
            <v-card>
              <v-data-table
                :headers="headers"
                :items="holidays"
                :loading="loading"
                class="elevation-1"
              >
                <template v-slot:item.type="{ item }">
                  <v-chip :color="getTypeColor(item.type)" small>{{ getTypeLabel(item.type) }}</v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-icon size="small" class="me-2" @click="openDialog(item)">mdi-pencil</v-icon>
                  <v-icon size="small" color="error" @click="confirmDelete(item)">mdi-delete</v-icon>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- Calendar View (Simple Implementation using List for now, can be enhanced with v-calendar) -->
          <v-window-item value="calendar">
            <v-card class="pa-4">
              <div class="text-center mb-4">
                <v-btn variant="text" icon="mdi-chevron-left" @click="changeMonth(-1)"></v-btn>
                <span class="text-h5 mx-4">{{ currentMonthName }}</span>
                <v-btn variant="text" icon="mdi-chevron-right" @click="changeMonth(1)"></v-btn>
              </div>
              <v-row>
                <v-col v-for="day in calendarDays" :key="day.date" cols="12" sm="6" md="2" class="border pa-2" :class="{'bg-grey-lighten-4': !day.isCurrentMonth}">
                  <div class="text-right">{{ day.day }}</div>
                  <div v-for="event in day.events" :key="event.id" class="mb-1">
                     <v-chip :color="getTypeColor(event.type)" size="x-small" block class="justify-start">
                       {{ event.title }}
                     </v-chip>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="editedItem.title" label="Holiday Name" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.start_date" label="Start Date" type="date" required></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.end_date" label="End Date" type="date" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.type"
                  :items="holidayTypeItems"
                  label="Type"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editedItem.requester_name" label="Requester Name"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="editedItem.description" label="Description" rows="3"></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="close">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">Are you sure you want to delete this item?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="deleteItemConfirm">OK</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from '@/services/api'
import dayjs from 'dayjs'

const tab = ref('list')
const holidays = ref([])
const loading = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers = [
  { title: 'Holiday Name', key: 'title' },
  { title: 'Start Date', key: 'start_date' },
  { title: 'End Date', key: 'end_date' },
  { title: 'Type', key: 'type' },
  { title: 'Requester', key: 'requester_name' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const holidayTypeItems = [
  { title: 'วันหยุดราชการ (Public Holiday)', value: 'public' },
  { title: 'วันหยุดบริษัท (Company Holiday)', value: 'company' },
  { title: 'วันลาพักร้อน (Vacation)', value: 'vacation' },
]

const typeLabelMap = {
  public: 'วันหยุดราชการ',
  company: 'วันหยุดบริษัท',
  vacation: 'วันลาพักร้อน',
}

const editedIndex = ref(-1)
const editedItem = ref({
  id: null,
  title: '',
  start_date: dayjs().format('YYYY-MM-DD'),
  end_date: dayjs().format('YYYY-MM-DD'),
  type: 'public', // Changed to English value
  requester_name: '',
  description: ''
})
const defaultItem = {
  id: null,
  title: '',
  start_date: dayjs().format('YYYY-MM-DD'),
  end_date: dayjs().format('YYYY-MM-DD'),
  type: 'public', // Changed to English value
  requester_name: '',
  description: ''
}

const formTitle = computed(() => editedIndex.value === -1 ? 'New Holiday' : 'Edit Holiday')

// Calendar Logic
const currentMonth = ref(dayjs())
const currentMonthName = computed(() => currentMonth.value.format('MMMM YYYY'))

const calendarDays = computed(() => {
  const startOfMonth = currentMonth.value.startOf('month')
  const endOfMonth = currentMonth.value.endOf('month')
  const days = []

  // Add previous month's days
  const startDay = startOfMonth.day() // 0-6
  for (let i = startDay; i > 0; i--) {
    const d = startOfMonth.subtract(i, 'day')
    days.push({ date: d.format('YYYY-MM-DD'), day: d.date(), isCurrentMonth: false, events: [] })
  }

  // Current month
  for (let i = 1; i <= endOfMonth.date(); i++) {
    const d = startOfMonth.date(i)
    const dateStr = d.format('YYYY-MM-DD')
    const events = holidays.value.filter(h =>
      (h.start_date <= dateStr && h.end_date >= dateStr)
    )
    days.push({ date: dateStr, day: i, isCurrentMonth: true, events })
  }

  return days
})

const changeMonth = (val) => {
  currentMonth.value = currentMonth.value.add(val, 'month')
}

const loadData = async () => {
  loading.value = true
  try {
    holidays.value = await fetchHolidays()
  } catch (error) {
    showSnackbar('Error loading holidays', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const getTypeLabel = (type) => {
  return typeLabelMap[type] || type
}

const getTypeColor = (type) => {
  const label = getTypeLabel(type)
  if (label === 'วันหยุดปกติ') return 'red'
  if (label === 'วันหยุด ลา') return 'blue'
  if (label === 'วันหยุดฉุกเฉิน') return 'orange'
  if (label === 'สลับวันหยุด') return 'purple'
  return 'grey'
}

const openDialog = (item) => {
  if (item) {
    editedIndex.value = holidays.value.indexOf(item)
    editedItem.value = Object.assign({}, item)
  } else {
    editedIndex.value = -1
    editedItem.value = Object.assign({}, defaultItem)
  }
  dialog.value = true
}

const close = () => {
  dialog.value = false
  editedItem.value = Object.assign({}, defaultItem)
  editedIndex.value = -1
}

const save = async () => {
  try {
    if (editedIndex.value > -1) {
      await updateHoliday(editedItem.value.id, editedItem.value)
      showSnackbar('Holiday updated successfully')
    } else {
      await createHoliday(editedItem.value)
      showSnackbar('Holiday created successfully')
    }
    close()
    loadData()
  } catch (error) {
    showSnackbar('Error saving holiday', 'error')
  }
}

const confirmDelete = (item) => {
  editedIndex.value = holidays.value.indexOf(item)
  editedItem.value = Object.assign({}, item)
  dialogDelete.value = true
}

const closeDelete = () => {
  dialogDelete.value = false
  editedItem.value = Object.assign({}, defaultItem)
  editedIndex.value = -1
}

const deleteItemConfirm = async () => {
  try {
    await deleteHoliday(editedItem.value.id)
    showSnackbar('Holiday deleted successfully')
    closeDelete()
    loadData()
  } catch (error) {
    showSnackbar('Error deleting holiday', 'error')
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>
