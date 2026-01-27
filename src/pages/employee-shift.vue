<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" class="mr-2"></v-btn>
      <div>
        <h1 class="text-h5 font-weight-bold">ตั้งค่าเวลาทำงาน</h1>
        <p class="text-medium-emphasis mb-0" v-if="employeeInfo">
          {{ employeeInfo.first_name }} {{ employeeInfo.last_name }} ({{ employeeId }})
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

    <!-- Employee Work Schedule -->
    <v-card elevation="0" border class="mb-4">
      <v-card-title class="d-flex align-center py-4 border-b">
        <v-icon class="mr-2">mdi-calendar-clock</v-icon>
        กำหนดเวลาทำงานประจำ
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
          เพิ่มกะทำงาน
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="employeeShifts"
          :loading="loading"
          density="comfortable"
        >
          <!-- Day of Week -->
          <template v-slot:item.day_of_week="{ item }">
            <v-chip :color="getDayColor(item.day_of_week)" size="small" variant="tonal">
              {{ getDayName(item.day_of_week) }}
            </v-chip>
          </template>

          <!-- Shift Time -->
          <template v-slot:item.shift_time="{ item }">
            <div class="d-flex align-center gap-2">
              <v-icon size="small" color="success">mdi-clock-in</v-icon>
              <span class="font-weight-medium">{{ item.start_time }}</span>
              <v-icon size="small">mdi-arrow-right</v-icon>
              <v-icon size="small" color="error">mdi-clock-out</v-icon>
              <span class="font-weight-medium">{{ item.end_time }}</span>
            </div>
          </template>

          <!-- Active Status -->
          <template v-slot:item.is_active="{ item }">
            <v-switch
              v-model="item.is_active"
              color="success"
              hide-details
              density="compact"
              @change="toggleActive(item)"
            ></v-switch>
          </template>

          <!-- Actions -->
          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="primary"
                @click="openDialog(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click="confirmDelete(item)"
              ></v-btn>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-1">mdi-calendar-clock-outline</v-icon>
              <p class="text-medium-emphasis mt-4">ยังไม่มีการกำหนดเวลาทำงาน</p>
              <v-btn color="primary" @click="openDialog()">เพิ่มกะทำงาน</v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center py-4 bg-primary">
          <v-icon class="mr-2 text-white">mdi-clock-edit</v-icon>
          <span class="text-white">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="form" v-model="valid">
            <!-- Day of Week -->
            <v-select
              v-model="editedItem.day_of_week"
              :items="daysOfWeek"
              item-title="label"
              item-value="value"
              label="วันในสัปดาห์"
              variant="outlined"
              density="compact"
              :rules="[rules.required]"
              class="mb-4"
            ></v-select>

            <!-- Shift Name -->
            <v-text-field
              v-model="editedItem.shift_name"
              label="ชื่อกะ (ไม่บังคับ)"
              placeholder="เช่น กะเช้า, กะบ่าย"
              variant="outlined"
              density="compact"
              class="mb-4"
            ></v-text-field>

            <!-- Time Range -->
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="editedItem.start_time"
                  label="เวลาเริ่มต้น"
                  type="time"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="editedItem.end_time"
                  label="เวลาสิ้นสุด"
                  type="time"
                  variant="outlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Active Status -->
            <v-switch
              v-model="editedItem.is_active"
              label="เปิดใช้งาน"
              color="success"
              hide-details
            ></v-switch>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog">ยกเลิก</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="save"
            :loading="saving"
            :disabled="!valid"
          >
            บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">ยืนยันการลบ</v-card-title>
        <v-card-text>
          คุณต้องการลบกะทำงาน "{{ editedItem.shift_name || getDayName(editedItem.day_of_week) }}" ใช่หรือไม่?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDelete">ยกเลิก</v-btn>
          <v-btn color="error" variant="text" @click="deleteItemConfirm" :loading="deleting">
            ลบ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">ปิด</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const employeeId = ref(route.query.employee_id || '')

// States
const employeeInfo = ref(null)
const employeeShifts = ref([])
const loading = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const valid = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Table Headers
const headers = [
  { title: 'วัน', key: 'day_of_week', align: 'start' },
  { title: 'ชื่อกะ', key: 'shift_name' },
  { title: 'เวลาทำงาน', key: 'shift_time', sortable: false },
  { title: 'เปิดใช้งาน', key: 'is_active', align: 'center' },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'end' }
]

// Days of Week
const daysOfWeek = [
  { label: 'จันทร์', value: 1 },
  { label: 'อังคาร', value: 2 },
  { label: 'พุธ', value: 3 },
  { label: 'พฤหัสบดี', value: 4 },
  { label: 'ศุกร์', value: 5 },
  { label: 'เสาร์', value: 6 },
  { label: 'อาทิตย์', value: 0 }
]

// Form Data
const editedIndex = ref(-1)
const editedItem = reactive({
  id: null,
  employee_id: '',
  day_of_week: null,
  shift_name: '',
  start_time: '',
  end_time: '',
  is_active: true
})

const defaultItem = {
  id: null,
  employee_id: '',
  day_of_week: null,
  shift_name: '',
  start_time: '09:00',
  end_time: '18:00',
  is_active: true
}

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
})

// Computed
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'เพิ่มกะทำงาน' : 'แก้ไขกะทำงาน'
})

// Validation Rules
const rules = {
  required: value => !!value || value === 0 || 'กรุณากรอกข้อมูล'
}

// Helper Functions
const getDayName = (dayNum) => {
  const day = daysOfWeek.find(d => d.value === dayNum)
  return day ? day.label : '-'
}

const getDayColor = (dayNum) => {
  const colors = {
    0: 'error',      // อาทิตย์
    1: 'warning',    // จันทร์
    2: 'pink',       // อังคาร
    3: 'success',    // พุธ
    4: 'orange',     // พฤหัสบดี
    5: 'info',       // ศุกร์
    6: 'purple'      // เสาร์
  }
  return colors[dayNum] || 'grey'
}

// API Functions
const fetchEmployeeInfo = async () => {
  try {
    const res = await axios.get(`/api/users/${employeeId.value}`)
    employeeInfo.value = res.data.data
  } catch (error) {
    console.error('Error fetching employee:', error)
    showSnackbar('ไม่สามารถดึงข้อมูลพนักงานได้', 'error')
  }
}

const fetchEmployeeShifts = async () => {
  loading.value = true
  try {
    // TODO: Replace with actual API endpoint
    const res = await axios.get(`/api/employee-shifts/${employeeId.value}`)
    employeeShifts.value = res.data.data || []
  } catch (error) {
    console.error('Error fetching shifts:', error)
    // For now, use empty array
    employeeShifts.value = []
  } finally {
    loading.value = false
  }
}

const toggleActive = async (item) => {
  try {
    await axios.put(`/api/employee-shifts/${item.id}`, { is_active: item.is_active })
    showSnackbar('อัปเดตสถานะสำเร็จ')
  } catch (error) {
    console.error('Error updating status:', error)
    showSnackbar('เกิดข้อผิดพลาด', 'error')
    // Revert
    item.is_active = !item.is_active
  }
}

// Dialog Functions
const openDialog = (item = null) => {
  if (item) {
    editedIndex.value = employeeShifts.value.indexOf(item)
    Object.assign(editedItem, item)
  } else {
    editedIndex.value = -1
    Object.assign(editedItem, { ...defaultItem, employee_id: employeeId.value })
  }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  setTimeout(() => {
    Object.assign(editedItem, defaultItem)
    editedIndex.value = -1
  }, 300)
}

const save = async () => {
  if (!valid.value) return

  saving.value = true
  try {
    if (editedIndex.value > -1) {
      // Update
      await axios.put(`/api/employee-shifts/${editedItem.id}`, editedItem)
      showSnackbar('อัปเดตข้อมูลสำเร็จ')
    } else {
      // Create
      await axios.post('/api/employee-shifts', editedItem)
      showSnackbar('สร้างข้อมูลสำเร็จ')
    }
    await fetchEmployeeShifts()
    closeDialog()
  } catch (error) {
    console.error('Error saving:', error)
    showSnackbar('เกิดข้อผิดพลาดในการบันทึก', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item) => {
  editedIndex.value = employeeShifts.value.indexOf(item)
  Object.assign(editedItem, item)
  dialogDelete.value = true
}

const closeDelete = () => {
  dialogDelete.value = false
  setTimeout(() => {
    Object.assign(editedItem, defaultItem)
    editedIndex.value = -1
  }, 300)
}

const deleteItemConfirm = async () => {
  deleting.value = true
  try {
    await axios.delete(`/api/employee-shifts/${editedItem.id}`)
    showSnackbar('ลบข้อมูลสำเร็จ')
    await fetchEmployeeShifts()
  } catch (error) {
    console.error('Error deleting:', error)
    showSnackbar('เกิดข้อผิดพลาดในการลบ', 'error')
  } finally {
    deleting.value = false
    closeDelete()
  }
}

const showSnackbar = (text, color = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

// Lifecycle
onMounted(async () => {
  if (!employeeId.value) {
    showSnackbar('ไม่พบรหัสพนักงาน', 'error')
    return
  }
  await fetchEmployeeInfo()
  await fetchEmployeeShifts()
})
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
