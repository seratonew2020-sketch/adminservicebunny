<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <!-- Breadcrumb -->
    <v-breadcrumbs :items="breadcrumbItems" class="px-0 pb-4">
      <template v-slot:divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>

    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-4 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">ตารางวันหยุดพนักงาน</h1>
        <p class="text-medium-emphasis">จัดการและติดตามวันหยุดของพนักงานทั้งหมดในองค์กร</p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          @click="loadData"
          :loading="loading"
          variant="tonal"
        >
          รีเฟรช
        </v-btn>
        <v-btn
          color="success"
          prepend-icon="mdi-microsoft-excel"
          @click="exportToExcel"
          :disabled="loading || filteredLeaves.length === 0"
          variant="tonal"
        >
          Export Excel
        </v-btn>
        <v-btn
          color="error"
          prepend-icon="mdi-file-pdf-box"
          @click="exportToPDF"
          :disabled="loading || filteredLeaves.length === 0"
          variant="tonal"
        >
          Export PDF
        </v-btn>
      </div>
    </div>

    <!-- Statistics Cards -->
    <v-row dense class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card flat class="border pa-4 text-center">
          <div class="text-caption text-medium-emphasis mb-2">พนักงานทั้งหมด</div>
          <div class="text-h4 font-weight-bold text-primary">{{ stats.totalEmployees }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card flat class="border pa-4 text-center">
          <div class="text-caption text-medium-emphasis mb-2">การลาทั้งหมด</div>
          <div class="text-h4 font-weight-bold text-info">{{ stats.totalLeaves }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card flat class="border pa-4 text-center">
          <div class="text-caption text-medium-emphasis mb-2">รออนุมัติ</div>
          <div class="text-h4 font-weight-bold text-warning">{{ stats.pendingLeaves }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card flat class="border pa-4 text-center">
          <div class="text-caption text-medium-emphasis mb-2">อนุมัติแล้ว</div>
          <div class="text-h4 font-weight-bold text-success">{{ stats.approvedLeaves }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters Card -->
    <v-card flat class="border pa-4 mb-6">
      <v-row dense>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="search"
            label="ค้นหา (ชื่อพนักงาน, รหัส)"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="filterDepartment"
            :items="departmentItems"
            label="แผนก"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filterLeaveType"
            :items="leaveTypeOptions"
            label="ประเภทการลา"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="filterStatus"
            :items="statusOptions"
            label="สถานะ"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filterStartDate"
            type="date"
            label="จากวันที่"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>

      <v-row dense class="mt-2">
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="filterEndDate"
            type="date"
            label="ถึงวันที่"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="2">
          <v-btn
            block
            variant="text"
            @click="clearFilters"
            class="text-none"
          >
            ล้างตัวกรอง
          </v-btn>
        </v-col>

        <v-col cols="12" md="8" class="d-flex align-center justify-end">
          <span class="text-caption text-medium-emphasis">
            แสดง {{ filteredLeaves.length }} จาก {{ allLeaves.length }} รายการ
            <span v-if="lastUpdated">• อัปเดตล่าสุด: {{ formatTime(lastUpdated) }}</span>
          </span>
        </v-col>
      </v-row>
    </v-card>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <!-- Data Table -->
    <v-card flat class="border">
      <v-data-table
        :headers="headers"
        :items="filteredLeaves"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :items-per-page-options="itemsPerPageOptions"
        v-model:sort-by="sortBy"
        class="elevation-0"
        hover
        density="comfortable"
      >
        <!-- Employee Name Column -->
        <template v-slot:item.employeeName="{ item }">
          <div class="d-flex flex-column py-2">
            <span class="font-weight-medium">{{ item.employeeName }}</span>
            <span class="text-caption text-medium-emphasis">{{ item.employee_code }}</span>
          </div>
        </template>

        <!-- Department Column -->
        <template v-slot:item.department="{ item }">
          <v-chip size="small" variant="tonal" color="blue">
            {{ item.department || '-' }}
          </v-chip>
        </template>

        <!-- Date Range Column -->
        <template v-slot:item.dateRange="{ item }">
          <div class="text-body-2">
            <div>{{ formatDate(item.start_date) }}</div>
            <v-icon size="x-small" class="mx-1">mdi-arrow-down</v-icon>
            <div>{{ formatDate(item.end_date || item.start_date) }}</div>
          </div>
        </template>

        <!-- Duration Column -->
        <template v-slot:item.duration="{ item }">
          <span class="font-weight-medium">{{ item.duration }} วัน</span>
        </template>

        <!-- Leave Type Column -->
        <template v-slot:item.leave_type="{ item }">
          <v-chip
            size="small"
            :color="getLeaveTypeColor(item.leave_type)"
            variant="tonal"
          >
            {{ getLeaveTypeLabel(item.leave_type) }}
          </v-chip>
        </template>

        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            size="small"
            :color="getStatusColor(item.status)"
            variant="flat"
          >
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Leave Balance Column -->
        <template v-slot:item.leaveBalance="{ item }">
          <div class="text-body-2">
            <div class="text-success">ใช้: {{ item.usedDays || 0 }} วัน</div>
            <div class="text-info">เหลือ: {{ item.remainingDays || 0 }} วัน</div>
          </div>
        </template>

        <!-- Notes Column -->
        <template v-slot:item.description="{ item }">
          <span class="text-body-2">
            {{ item.description || '-' }}
          </span>
        </template>

        <!-- Loading -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10" />
        </template>

        <!-- No Data -->
        <template v-slot:no-data>
          <div class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1">mdi-database-off</v-icon>
            <div class="text-h6 text-medium-emphasis mt-4">ไม่พบข้อมูลการลา</div>
            <v-btn
              variant="text"
              color="primary"
              class="mt-2"
              @click="loadData"
            >
              โหลดข้อมูลใหม่
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Cache Info -->
    <div class="text-caption text-medium-emphasis text-center mt-4">
      <v-icon size="small">mdi-cached</v-icon>
      ข้อมูลถูกแคชเพื่อประสิทธิภาพ • กดรีเฟรชเพื่ออัปเดตข้อมูลล่าสุด
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchLeaves, fetchEmployeesByCodes, fetchDepartments } from '@/services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

// ================== State ==================
const loading = ref(false)
const error = ref('')
const lastUpdated = ref(null)

const allLeaves = ref([])
const employees = ref(new Map())
const departments = ref([])

const search = ref('')
const filterDepartment = ref(null)
const filterLeaveType = ref(null)
const filterStatus = ref(null)
const filterStartDate = ref('')
const filterEndDate = ref('')

const itemsPerPage = ref(25)
const sortBy = ref([{ key: 'start_date', order: 'desc' }])

// ================== Options ==================
const breadcrumbItems = [
  { title: 'หน้าแรก', href: '/' },
  { title: 'ตารางวันหยุด', disabled: true }
]

const itemsPerPageOptions = [
  { value: 10, title: '10 รายการ' },
  { value: 25, title: '25 รายการ' },
  { value: 50, title: '50 รายการ' },
  { value: 100, title: '100 รายการ' },
  { value: -1, title: 'ทั้งหมด' }
]

const leaveTypeOptions = [
  { title: 'ลาพักร้อน', value: 'annual' },
  { title: 'ลากิจ', value: 'personal' },
  { title: 'ลาป่วย', value: 'sick' }
]

const statusOptions = [
  { title: 'รออนุมัติ', value: 'pending' },
  { title: 'อนุมัติแล้ว', value: 'approved' },
  { title: 'ไม่อนุมัติ', value: 'rejected' }
]

const headers = [
  { title: 'ชื่อพนักงาน', key: 'employeeName', sortable: true },
  { title: 'แผนก', key: 'department', sortable: true },
  { title: 'วันที่เริ่มต้น-สิ้นสุด', key: 'dateRange', sortable: false },
  { title: 'จำนวนวัน', key: 'duration', sortable: true },
  { title: 'ประเภทการลา', key: 'leave_type', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'วันลาใช้/เหลือ', key: 'leaveBalance', sortable: false },
  { title: 'หมายเหตุ', key: 'description', sortable: false }
]

// ================== Computed ==================
const departmentItems = computed(() => {
  return departments.value.map(d => ({
    title: d.name,
    value: d.id
  }))
})

const enrichedLeaves = computed(() => {
  return allLeaves.value.map(leave => {
    const emp = employees.value.get(leave.employee_code)
    const employeeName = emp
      ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || leave.employee_code
      : leave.employee_code

    const department = emp?.departments?.name || emp?.department || '-'
    const durationDays = calculateDuration(leave.start_date, leave.end_date)

    // Mock leave balance - replace with real data from API
    const usedDays = Math.floor(Math.random() * 10)
    const remainingDays = 20 - usedDays

    return {
      ...leave,
      employeeName,
      department,
      duration: durationDays,
      usedDays,
      remainingDays
    }
  })
})

const filteredLeaves = computed(() => {
  let results = enrichedLeaves.value

  // Search filter
  if (search.value) {
    const q = search.value.toLowerCase()
    results = results.filter(item =>
      item.employeeName.toLowerCase().includes(q) ||
      item.employee_code?.toLowerCase().includes(q)
    )
  }

  // Department filter
  if (filterDepartment.value) {
    results = results.filter(item => {
      const emp = employees.value.get(item.employee_code)
      return emp?.dept_id === filterDepartment.value
    })
  }

  // Leave type filter
  if (filterLeaveType.value) {
    results = results.filter(item => item.leave_type === filterLeaveType.value)
  }

  // Status filter
  if (filterStatus.value) {
    results = results.filter(item => item.status === filterStatus.value)
  }

  // Date range filter
  if (filterStartDate.value) {
    results = results.filter(item =>
      dayjs(item.start_date).isSameOrAfter(filterStartDate.value, 'day')
    )
  }

  if (filterEndDate.value) {
    results = results.filter(item =>
      dayjs(item.end_date || item.start_date).isSameOrBefore(filterEndDate.value, 'day')
    )
  }

  return results
})

const stats = computed(() => {
  const uniqueEmployees = new Set(filteredLeaves.value.map(l => l.employee_code))
  const pending = filteredLeaves.value.filter(l => l.status === 'pending').length
  const approved = filteredLeaves.value.filter(l => l.status === 'approved').length

  return {
    totalEmployees: uniqueEmployees.size,
    totalLeaves: filteredLeaves.value.length,
    pendingLeaves: pending,
    approvedLeaves: approved
  }
})

// ================== Methods ==================
const loadData = async () => {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    // Load from cache if available and fresh (< 5 minutes)
    const cacheKey = 'employee_leaves_cache'
    const cacheTimestamp = 'employee_leaves_cache_time'
    const cached = localStorage.getItem(cacheKey)
    const cacheTime = localStorage.getItem(cacheTimestamp)

    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime)
      if (age < 5 * 60 * 1000) { // 5 minutes
        const data = JSON.parse(cached)
        allLeaves.value = data.leaves
        departments.value = data.departments

        const codes = [...new Set(allLeaves.value.map(l => l.employee_code).filter(Boolean))]
        const emps = await fetchEmployeesByCodes(codes)
        employees.value = new Map(emps.map(e => [e.employee_code, e]))

        lastUpdated.value = new Date(parseInt(cacheTime))
        loading.value = false
        return
      }
    }

    // Fetch fresh data
    const [deptList, leaveList] = await Promise.all([
      departments.value.length ? Promise.resolve(departments.value) : fetchDepartments(),
      fetchLeaves({})
    ])

    departments.value = deptList
    allLeaves.value = Array.isArray(leaveList) ? leaveList : []

    // Fetch employee details
    const codes = [...new Set(allLeaves.value.map(l => l.employee_code).filter(Boolean))]
    const emps = await fetchEmployeesByCodes(codes)
    employees.value = new Map(emps.map(e => [e.employee_code, e]))

    // Cache the data
    localStorage.setItem(cacheKey, JSON.stringify({
      leaves: allLeaves.value,
      departments: departments.value
    }))
    localStorage.setItem(cacheTimestamp, Date.now().toString())

    lastUpdated.value = new Date()
  } catch (err) {
    console.error('Error loading leave data:', err)
    error.value = err.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  search.value = ''
  filterDepartment.value = null
  filterLeaveType.value = null
  filterStatus.value = null
  filterStartDate.value = ''
  filterEndDate.value = ''
}

const calculateDuration = (start, end) => {
  if (!start) return 0
  const startDay = dayjs(start)
  const endDay = dayjs(end || start)
  return endDay.diff(startDay, 'day') + 1
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('DD MMM YYYY')
}

const formatTime = (date) => {
  if (!date) return '-'
  return dayjs(date).format('HH:mm:ss')
}

const getLeaveTypeLabel = (type) => {
  const map = {
    annual: 'ลาพักร้อน',
    personal: 'ลากิจ',
    sick: 'ลาป่วย'
  }
  return map[type] || type || '-'
}

const getLeaveTypeColor = (type) => {
  const map = {
    annual: 'blue',
    personal: 'purple',
    sick: 'teal'
  }
  return map[type] || 'grey'
}

const getStatusLabel = (status) => {
  const map = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ไม่อนุมัติ'
  }
  return map[status] || status || '-'
}

const getStatusColor = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return map[status] || 'grey'
}

const exportToExcel = () => {
  try {
    // Create CSV content
    const headers = ['ชื่อพนักงาน', 'รหัส', 'แผนก', 'วันที่เริ่มต้น', 'วันที่สิ้นสุด', 'จำนวนวัน', 'ประเภท', 'สถานะ', 'หมายเหตุ']
    const rows = filteredLeaves.value.map(item => [
      item.employeeName,
      item.employee_code,
      item.department,
      formatDate(item.start_date),
      formatDate(item.end_date),
      item.duration,
      getLeaveTypeLabel(item.leave_type),
      getStatusLabel(item.status),
      item.description || ''
    ])

    const csvContent = [
      '\uFEFF' + headers.join(','), // Add BOM for Thai characters
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `employee-leaves-${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
  } catch (err) {
    console.error('Export error:', err)
    error.value = 'ไม่สามารถ Export ข้อมูลได้'
  }
}

const exportToPDF = () => {
  error.value = 'ฟีเจอร์ Export PDF กำลังพัฒนา กรุณาใช้ Export Excel แทน'
}

// ================== Lifecycle ==================
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
