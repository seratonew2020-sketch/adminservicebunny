<script setup>
import { ref, computed, onMounted } from 'vue'
import { generateAttendanceReport } from '@/services/AttendanceService'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(buddhistEra)
dayjs.locale('th')

// Set default timezone to Asia/Bangkok
dayjs.tz.setDefault("Asia/Bangkok")

// Filter States
const startDate = ref(dayjs().tz().startOf('month').format('YYYY-MM-DD'))
const endDate = ref(dayjs().tz().format('YYYY-MM-DD'))
const searchId = ref('')
const searchName = ref('')

// Data States
const reportData = ref([])
const loading = ref(false)
const selectedEmployee = ref(null)

// Group report by employee
const groupedByEmployee = computed(() => {
  const groups = {}

  reportData.value.forEach(record => {
    const empId = record.employee_id
    if (!groups[empId]) {
      groups[empId] = {
        employee_id: empId,
        full_name: record.full_name,
        department: record.department,
        records: [],
        summary: {
          total_work_hours: 0,
          total_late_minutes: 0,
          late_count: 0,
          absent_count: 0,
          present_count: 0,
          ot_hours: 0
        }
      }
    }

    groups[empId].records.push(record)

    // Calculate summary
    if (record.status === 'ปกติ' || record.status === 'มาสาย') {
      groups[empId].summary.present_count++
      groups[empId].summary.total_work_hours += parseFloat(record.work_hours) || 0
    }
    if (record.status === 'มาสาย') {
      groups[empId].summary.late_count++
      groups[empId].summary.total_late_minutes += record.late_minutes || 0
    }
    if (record.status === 'ขาดงาน') {
      groups[empId].summary.absent_count++
    }
  })

  return Object.values(groups)
})

// Filter grouped data
const filteredGroups = computed(() => {
  let groups = groupedByEmployee.value

  if (searchId.value) {
    groups = groups.filter(g => g.employee_id.includes(searchId.value))
  }
  if (searchName.value) {
    groups = groups.filter(g =>
      g.full_name.toLowerCase().includes(searchName.value.toLowerCase())
    )
  }

  return groups
})

// Selected employee details
const selectedEmployeeData = computed(() => {
  if (!selectedEmployee.value) return null
  return filteredGroups.value.find(g => g.employee_id === selectedEmployee.value)
})

// Format helpers
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return dayjs(dateStr).tz().format('DD/MM/BBBB')
}

const formatTime = (timeStr) => {
  if (!timeStr || timeStr === '-') return "-";
  // If it's just 'HH:mm', we keep it, but if it's ISO, we format it local
  if (timeStr.includes(':') && !timeStr.includes('T')) return timeStr;
  return dayjs(timeStr).tz().format('HH:mm น.');
}

const formatDateRange = computed(() => {
  return `ตั้งแต่วันที่ ${formatDate(startDate.value)} ถึง ${formatDate(endDate.value)}`
})

// Load data
const loadReport = async () => {
  loading.value = true
  try {
    const filters = {
      id: searchId.value,
      name: searchName.value
    }
    const data = await generateAttendanceReport(startDate.value, endDate.value, filters)
    reportData.value = data

    // Auto-select first employee if any
    if (groupedByEmployee.value.length > 0 && !selectedEmployee.value) {
      selectedEmployee.value = groupedByEmployee.value[0].employee_id
    }
  } catch (error) {
    console.error('Error loading report:', error)
  } finally {
    loading.value = false
  }
}

// Export to CSV
const exportCSV = () => {
  if (!selectedEmployeeData.value) return

  const headers = ['วันที่', 'รหัสกะ', 'เวลาเข้า', 'เวลาออก', 'ชม.งาน', 'มาสาย', 'สถานะ']
  const rows = selectedEmployeeData.value.records.map(r => [
    formatDate(r.date),
    '-',
    r.check_in,
    r.check_out,
    r.work_hours,
    r.is_late || '-',
    r.status
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `attendance_${selectedEmployee.value}_${startDate.value}_${endDate.value}.csv`
  link.click()
}

// Print report
const printReport = () => {
  window.print()
}

onMounted(() => {
  loadReport()
})
</script>

<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Header -->
    <div class="d-flex flex-column flex-md-row justify-space-between align-md-center mb-6 gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold">รายงานเวลาทำงาน</h1>
        <p class="text-medium-emphasis mb-0">{{ formatDateRange }}</p>
      </div>

      <div class="d-flex gap-2">
        <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="loadReport" :loading="loading">
          โหลดใหม่
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-printer" @click="printReport">
          พิมพ์
        </v-btn>
        <v-btn color="success" prepend-icon="mdi-file-excel" @click="exportCSV">
          Export CSV
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-card class="mb-6" elevation="0" border>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="startDate"
              type="date"
              label="วันที่เริ่มต้น"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="endDate"
              type="date"
              label="วันที่สิ้นสุด"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="searchId"
              label="รหัสพนักงาน"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              prepend-inner-icon="mdi-identifier"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="searchName"
              label="ชื่อพนักงาน"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              prepend-inner-icon="mdi-account-search"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              block
              @click="loadReport"
              :loading="loading"
              height="40"
              prepend-icon="mdi-magnify"
            >
              ค้นหา
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Main Content -->
    <v-row>
      <!-- Employee List (Left Panel) -->
      <v-col cols="12" md="4" lg="3">
        <v-card elevation="0" border class="h-100">
          <v-card-title class="d-flex align-center py-3 border-b">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            รายชื่อพนักงาน
            <v-chip color="primary" size="small" class="ml-2">
              {{ filteredGroups.length }}
            </v-chip>
          </v-card-title>

          <v-list density="compact" class="overflow-y-auto" style="max-height: 500px;">
            <v-list-item
              v-for="emp in filteredGroups"
              :key="emp.employee_id"
              :active="selectedEmployee === emp.employee_id"
              @click="selectedEmployee = emp.employee_id"
              class="border-b"
            >
              <template v-slot:prepend>
                <v-avatar size="40" color="primary" variant="tonal">
                  {{ emp.full_name.charAt(0) }}
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ emp.full_name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                รหัส: {{ emp.employee_id }} | {{ emp.department }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="text-right">
                  <div class="text-caption">
                    <v-chip
                      v-if="emp.summary.late_count > 0"
                      color="error"
                      size="x-small"
                      class="mr-1"
                    >
                      สาย {{ emp.summary.late_count }}
                    </v-chip>
                  </div>
                </div>
              </template>
            </v-list-item>

            <v-list-item v-if="filteredGroups.length === 0 && !loading">
              <v-list-item-title class="text-center text-medium-emphasis">
                ไม่พบข้อมูล
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Report Detail (Right Panel) -->
      <v-col cols="12" md="8" lg="9">
        <v-card elevation="0" border v-if="selectedEmployeeData">
          <!-- Employee Header -->
          <v-card-title class="d-flex align-center py-4 px-6 bg-primary">
            <v-avatar size="48" color="white" class="mr-4">
              <span class="text-primary font-weight-bold">
                {{ selectedEmployeeData.full_name.charAt(0) }}
              </span>
            </v-avatar>
            <div class="text-white">
              <h3 class="text-h6 font-weight-bold mb-0">{{ selectedEmployeeData.full_name }}</h3>
              <p class="text-white-50 mb-0">
                รหัส: {{ selectedEmployeeData.employee_id }} | แผนก: {{ selectedEmployeeData.department }}
              </p>
            </div>
            <v-spacer></v-spacer>
            <div class="text-white text-right d-none d-md-block">
              <div class="text-caption">หน้าที่</div>
              <div class="font-weight-bold">1 / 1</div>
            </div>
          </v-card-title>

          <!-- Summary Stats -->
          <div class="pa-4 border-b bg-grey-lighten-4">
            <v-row dense>
              <v-col cols="4" md="2" class="text-center">
                <div class="text-h5 font-weight-bold text-primary">
                  {{ selectedEmployeeData.summary.total_work_hours.toFixed(2) }}
                </div>
                <div class="text-caption text-medium-emphasis">ชม.งาน (รวม)</div>
              </v-col>
              <v-col cols="4" md="2" class="text-center">
                <div class="text-h5 font-weight-bold text-error">
                  {{ selectedEmployeeData.summary.late_count }}
                </div>
                <div class="text-caption text-medium-emphasis">มาสาย (ครั้ง)</div>
              </v-col>
              <v-col cols="4" md="2" class="text-center">
                <div class="text-h5 font-weight-bold text-warning">
                  {{ selectedEmployeeData.summary.total_late_minutes }}
                </div>
                <div class="text-caption text-medium-emphasis">นาทีสาย (รวม)</div>
              </v-col>
              <v-col cols="4" md="2" class="text-center">
                <div class="text-h5 font-weight-bold text-success">
                  {{ selectedEmployeeData.summary.present_count }}
                </div>
                <div class="text-caption text-medium-emphasis">มาทำงาน (วัน)</div>
              </v-col>
              <v-col cols="4" md="2" class="text-center">
                <div class="text-h5 font-weight-bold text-grey">
                  {{ selectedEmployeeData.summary.absent_count }}
                </div>
                <div class="text-caption text-medium-emphasis">ขาดงาน (วัน)</div>
              </v-col>

              <v-col cols="4" md="2" class="text-center">
                <div class="text-h5 font-weight-bold text-info">
                  {{ selectedEmployeeData.summary.ot_hours }}
                </div>
                <div class="text-caption text-medium-emphasis">OT (ชม.)</div>
              </v-col>
            </v-row>
          </div>

          <!-- Detail Table (ตามแบบตัวอย่าง) -->
          <v-table density="compact" class="report-table">
            <thead>
              <tr class="bg-grey-lighten-3">
                <th class="text-left">วันที่</th>
                <th class="text-left">รหัสกะ</th>
                <th class="text-left">เวลาเข้า-ออก</th>
                <th class="text-center">ชม.งาน</th>
                <th class="text-center">มาสาย</th>
                <th class="text-center">กลับก่อน</th>
                <th class="text-center">OTx1</th>
                <th class="text-center">OTx1.5</th>
                <th class="text-center">ขาดงาน</th>
                <th class="text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="record in selectedEmployeeData.records"
                :key="record.date"
                :class="{'bg-red-lighten-5': record.status === 'ขาดงาน', 'bg-orange-lighten-5': record.late_minutes > 0}"
              >
                <td>{{ formatDate(record.date) }}</td>
                <td>
                  <v-chip size="x-small" variant="outlined" v-if="record.shift_name && record.shift_name !== 'ไม่ระบุ'">
                    {{ record.shift_name }}
                  </v-chip>
                  <span v-else class="text-disabled">-</span>
                </td>
                <td>
                  <span v-if="record.check_in !== '-'">
                    {{ formatTime(record.check_in) }} - {{ formatTime(record.check_out) }}
                  </span>
                  <span v-else class="text-disabled">-</span>
                </td>
                <td class="text-center font-weight-medium">
                  {{ record.work_hours > 0 ? record.work_hours : '-' }}
                </td>
                <td class="text-center">
                  <span v-if="record.is_late" class="text-error font-weight-bold">
                    {{ record.is_late }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">
                  <v-icon
                    v-if="record.status === 'ขาดงาน'"
                    icon="mdi-close-circle"
                    color="error"
                    size="small"
                  ></v-icon>
                  <span v-else>-</span>
                </td>
                <td class="text-center">
                  <v-chip
                    size="x-small"
                    :color="record.status === 'ปกติ' ? 'success' : record.status === 'มาสาย' ? 'warning' : 'error'"
                  >
                    {{ record.status }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-grey-lighten-3">
              <tr class="font-weight-bold">
                <td colspan="3" class="text-right">ยอดรวม</td>
                <td class="text-center text-primary">
                  {{ selectedEmployeeData.summary.total_work_hours.toFixed(2) }}
                </td>
                <td class="text-center text-error">
                  {{ selectedEmployeeData.summary.total_late_minutes }} นาที
                </td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center text-error">
                  {{ selectedEmployeeData.summary.absent_count }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </v-table>
        </v-card>

        <!-- No Selection -->
        <v-card v-else elevation="0" border class="d-flex align-center justify-center" style="min-height: 400px;">
          <div class="text-center">
            <v-icon icon="mdi-file-document-outline" size="64" color="grey-lighten-1"></v-icon>
            <p class="text-medium-emphasis mt-4">กรุณาเลือกพนักงานจากรายการด้านซ้าย</p>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.report-table th,
.report-table td {
  padding: 8px 12px !important;
  font-size: 12px !important;
  white-space: nowrap;
}

.report-table thead th {
  font-weight: 600 !important;
  color: #374151;
  border-bottom: 2px solid #e5e7eb !important;
}

.report-table tbody tr:hover {
  background-color: rgba(59, 130, 246, 0.05) !important;
}

.report-table tfoot td {
  border-top: 2px solid #e5e7eb !important;
}

@media print {
  .v-navigation-drawer,
  .v-app-bar,
  .v-btn {
    display: none !important;
  }

  .report-table {
    font-size: 10px !important;
  }
}

.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
