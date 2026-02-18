<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { fetchLeavesForSchedule, fetchEmployeesByCodes, fetchDepartments, fetchHolidays } from '@/services/api'

const authStore = useAuthStore()

dayjs.locale('th')

const theme = useTheme()
const display = useDisplay()

const viewMode = ref('week')

const rangeStart = ref(dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'))
const rangeEnd = ref(dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD'))

const search = ref('')
const deptId = ref(null)
const leaveType = ref(null)
const status = ref(null)

const autoRefresh = ref(true)
const refreshSeconds = ref(30)

const loading = ref(false)
const lastUpdatedAt = ref(null)
const loadError = ref('')

const departments = ref([])
const leaves = ref([])
const holidays = ref([]) // 🎉 เพิ่มข้อมูลวันหยุดนักขัตฤกษ์
const employeesByCode = ref(new Map())

const sortBy = ref([{ key: 'start_date', order: 'desc' }])

const leaveTypeItems = [
  { title: 'ลาพักร้อน', value: 'annual' },
  { title: 'ลากิจ', value: 'personal' },
  { title: 'ลาป่วย', value: 'sick' },
]

const statusItems = [
  { title: 'รออนุมัติ', value: 'pending' },
  { title: 'อนุมัติแล้ว', value: 'approved' },
  { title: 'ไม่อนุมัติ', value: 'rejected' },
]

const refreshIntervalItems = [15, 30, 60]

const rangeLabel = computed(() => {
  const start = dayjs(rangeStart.value)
  const end = dayjs(rangeEnd.value)
  if (!start.isValid() || !end.isValid()) return '-'
  return `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`
})

const isMobile = computed(() => display.smAndDown.value)

const headers = computed(() => {
  const base = [
    { title: 'พนักงาน', key: 'employeeName' },
    { title: 'แผนก', key: 'departmentName' },
    { title: 'วันที่ลาหยุด', key: 'dateRange' },
    { title: 'ประเภทการลา', key: 'leaveTypeLabel' },
    { title: 'สถานะ', key: 'statusLabel' },
    { title: 'วัน (ในช่วง)', key: 'daysInRange' },
  ]

  if (!isMobile.value) return base

  return [
    { title: 'พนักงาน', key: 'employeeName' },
    { title: 'วันที่ลาหยุด', key: 'dateRange' },
    { title: 'สถานะ', key: 'statusLabel' },
  ]
})

const dayDiffInclusive = (start, end) => {
  const s = dayjs(start)
  const e = dayjs(end)
  if (!s.isValid() || !e.isValid()) return 0
  return Math.max(0, e.startOf('day').diff(s.startOf('day'), 'day') + 1)
}

const overlapDaysInRange = (leaveStart, leaveEnd, rStart, rEnd) => {
  const aStart = dayjs(leaveStart)
  const aEnd = dayjs(leaveEnd || leaveStart)
  const bStart = dayjs(rStart)
  const bEnd = dayjs(rEnd)
  if (!aStart.isValid() || !aEnd.isValid() || !bStart.isValid() || !bEnd.isValid()) return 0

  const start = aStart.isAfter(bStart) ? aStart : bStart
  const end = aEnd.isBefore(bEnd) ? aEnd : bEnd
  if (end.isBefore(start, 'day')) return 0
  return dayDiffInclusive(start, end)
}

const leaveTypeLabel = (v) => {
  if (v === 'annual') return 'ลาพักร้อน'
  if (v === 'personal') return 'ลากิจ'
  if (v === 'sick') return 'ลาป่วย'
  if (!v) return '-'
  return v
}

const statusLabel = (v) => {
  if (v === 'pending') return 'รออนุมัติ'
  if (v === 'approved') return 'อนุมัติแล้ว'
  if (v === 'rejected') return 'ไม่อนุมัติ'
  if (!v) return '-'
  return v
}

const statusColor = (v) => {
  if (v === 'approved') return 'success'
  if (v === 'pending') return 'warning'
  if (v === 'rejected') return 'error'
  return 'grey'
}

const typeColor = (v) => {
  if (v === 'annual') return 'blue'
  if (v === 'personal') return 'purple'
  if (v === 'sick') return 'teal'
  return 'grey'
}

const clearFilters = () => {
  search.value = ''
  deptId.value = null
  leaveType.value = null
  status.value = null
}

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()

  return leaves.value
    .map((l) => {
      const code = l.employee_code || ''
      const emp = employeesByCode.value.get(code) || null
      const employeeName = emp
        ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || code
        : code
      const departmentName = emp?.departments?.name || emp?.department || '-'
      const leaveEnd = l.end_date || l.start_date

      return {
        ...l,
        employeeName,
        departmentName,
        dept_id: emp?.dept_id || null,
        dateRange: `${dayjs(l.start_date).format('D MMM')} – ${dayjs(leaveEnd).format('D MMM')}`,
        leaveTypeLabel: leaveTypeLabel(l.leave_type),
        statusLabel: statusLabel(l.status),
        daysInRange: overlapDaysInRange(l.start_date, leaveEnd, rangeStart.value, rangeEnd.value),
      }
    })
    .filter((row) => {
      if (deptId.value && row.dept_id !== deptId.value) return false
      if (q) {
        const text = `${row.employeeName} ${row.employee_code} ${row.departmentName}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      return true
    })
})

// 🔒 Filtered departments based on role
const filteredDepartments = computed(() => {
  // Admin เห็นทุกแผนก
  if (authStore.isAdmin) {
    return departments.value
  }

  // พนักงานธรรมดาเห็นเฉพาะแผนกตัวเอง
  const userDeptId = authStore.user?.dept_id
  if (!userDeptId) return [] // ถ้าไม่มีแผนก ไม่แสดงอะไร

  return departments.value.filter(d => d.id === userDeptId)
})

const stats = computed(() => {
  const rows = filteredRows.value
  const uniqueEmployees = new Set(rows.map(r => r.employee_code).filter(Boolean))
  const totalDays = rows.reduce((acc, r) => acc + (r.daysInRange || 0), 0)

  const byType = new Map()
  const byStatus = new Map()

  for (const r of rows) {
    byType.set(r.leaveTypeLabel, (byType.get(r.leaveTypeLabel) || 0) + 1)
    byStatus.set(r.statusLabel, (byStatus.get(r.statusLabel) || 0) + 1)
  }

  const start = dayjs(rangeStart.value)
  const end = dayjs(rangeEnd.value)
  const daily = []
  if (start.isValid() && end.isValid() && !end.isBefore(start, 'day')) {
    const days = end.diff(start, 'day') + 1
    for (let i = 0; i < days; i++) {
      const d = start.add(i, 'day')
      const dateStr = d.format('YYYY-MM-DD')
      const set = new Set()
      for (const r of rows) {
        const rStart = dayjs(r.start_date)
        const rEnd = dayjs(r.end_date || r.start_date)
        if (rStart.isValid() && rEnd.isValid() && (d.isSame(rStart, 'day') || d.isSame(rEnd, 'day') || (d.isAfter(rStart, 'day') && d.isBefore(rEnd, 'day')))) {
          if (r.employee_code) set.add(r.employee_code)
        }
      }
      daily.push({ date: dateStr, label: d.format('D MMM'), count: set.size })
    }
  }

  const topDays = [...daily].sort((a, b) => b.count - a.count).slice(0, 7)

  return {
    uniqueEmployeesOnLeave: uniqueEmployees.size,
    totalLeaveDaysInRange: totalDays,
    byType: [...byType.entries()].map(([label, count]) => ({ label, count })),
    byStatus: [...byStatus.entries()].map(([label, count]) => ({ label, count })),
    topDays,
  }
})

const setThisWeek = () => {
  viewMode.value = 'week'
  rangeStart.value = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
  rangeEnd.value = dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD')
}

const setThisMonth = () => {
  viewMode.value = 'month'
  rangeStart.value = dayjs().startOf('month').format('YYYY-MM-DD')
  rangeEnd.value = dayjs().endOf('month').format('YYYY-MM-DD')
}

const shiftRange = (delta) => {
  if (viewMode.value === 'month') {
    const base = dayjs(rangeStart.value).add(delta, 'month')
    rangeStart.value = base.startOf('month').format('YYYY-MM-DD')
    rangeEnd.value = base.endOf('month').format('YYYY-MM-DD')
    return
  }

  const base = dayjs(rangeStart.value).add(delta, 'week')
  rangeStart.value = base.startOf('week').add(1, 'day').format('YYYY-MM-DD')
  rangeEnd.value = base.endOf('week').add(1, 'day').format('YYYY-MM-DD')
}

const load = async () => {
  if (loading.value) return
  loadError.value = ''
  loading.value = true

  try {
    const [deptList, leaveRows, holidayRows] = await Promise.all([
      departments.value.length ? Promise.resolve(departments.value) : fetchDepartments(),
      fetchLeavesForSchedule({
        start: rangeStart.value,
        end: rangeEnd.value,
        status: status.value,
        leaveType: leaveType.value,
      }),
      fetchHolidays({
        start_date: rangeStart.value,
        end_date: rangeEnd.value,
      }),
    ])

    departments.value = deptList
    let allLeaves = Array.isArray(leaveRows) ? leaveRows : []
    holidays.value = Array.isArray(holidayRows) ? holidayRows : []

    // 🔒 Role-based filtering: พนักงานธรรมดาเห็นเฉพาะข้อมูลตัวเอง
    if (!authStore.isAdmin && authStore.user?.employee_code) {
      allLeaves = allLeaves.filter(leave =>
        leave.employee_code === authStore.user.employee_code
      )
    }

    leaves.value = allLeaves

    const codes = [...new Set(leaves.value.map(l => l.employee_code).filter(Boolean))]
    const emps = await fetchEmployeesByCodes(codes)
    employeesByCode.value = new Map((emps || []).map(e => [e.employee_code, e]))

    lastUpdatedAt.value = new Date().toISOString()
  } catch (e) {
    loadError.value = e?.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

let intervalId = null
const stopAutoRefresh = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  if (!autoRefresh.value) return
  intervalId = setInterval(() => {
    load()
  }, Math.max(5, Number(refreshSeconds.value || 30)) * 1000)
}

watch([autoRefresh, refreshSeconds], () => {
  startAutoRefresh()
})

watch([rangeStart, rangeEnd, leaveType, status], () => {
  load()
})

onMounted(async () => {
  // 🔒 Auto-select แผนกสำหรับพนักงานธรรมดา
  if (!authStore.isAdmin && authStore.user?.dept_id) {
    deptId.value = authStore.user.dept_id
  }

  await load()
  startAutoRefresh()
})

onBeforeUnmount(() => {
  stopAutoRefresh()
})
</script>

<template>
  <v-container fluid class="pa-4 pa-sm-6 pa-md-8">
    <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center gap-4 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">ตารางการลาหยุด</h1>
        <div class="text-medium-emphasis">{{ rangeLabel }}</div>
      </div>

      <div class="d-flex flex-wrap gap-2 align-center">
        <v-btn variant="outlined" rounded="lg" icon="mdi-chevron-left" @click="shiftRange(-1)" :disabled="loading"></v-btn>
        <v-btn variant="outlined" rounded="lg" icon="mdi-chevron-right" @click="shiftRange(1)" :disabled="loading"></v-btn>
        <v-btn variant="outlined" rounded="lg" prepend-icon="mdi-refresh" @click="load" :loading="loading">
          รีเฟรช
        </v-btn>
      </div>
    </div>

    <!-- 📢 Info Alert for Employees -->
    <v-alert
      v-if="!authStore.isAdmin"
      type="info"
      variant="tonal"
      rounded="lg"
      class="mb-6"
      icon="mdi-information"
    >
      <strong>หมายเหตุ:</strong> คุณกำลังดูข้อมูลการลาของตัวเองเท่านั้น
    </v-alert>

    <v-card flat rounded="xl" class="border pa-4 pa-sm-6 mb-6" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">>
      <v-row dense>
        <v-col cols="12" md="3">
          <v-select
            v-model="viewMode"
            :items="[{ title: 'รายสัปดาห์', value: 'week' }, { title: 'รายเดือน', value: 'month' }]"
            label="มุมมอง"
            variant="outlined"
            density="comfortable"
            hide-details
            @update:model-value="(v) => (v === 'month' ? setThisMonth() : setThisWeek())"
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="rangeStart"
            type="date"
            label="เริ่มวันที่"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="rangeEnd"
            type="date"
            label="ถึงวันที่"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="search"
            label="ค้นหาชื่อ/รหัส/แผนก"
            variant="outlined"
            density="comfortable"
            clearable
            prepend-inner-icon="mdi-magnify"
            hide-details
          />
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="deptId"
            :items="filteredDepartments.map(d => ({ title: d.name, value: d.id }))"
            label="แผนก"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="leaveType"
            :items="leaveTypeItems"
            label="ประเภทการลา"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="status"
            :items="statusItems"
            label="สถานะ"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <div class="d-flex align-center gap-3">
            <v-switch v-model="autoRefresh" hide-details inset color="primary" label="รีเฟรชอัตโนมัติ" />
            <v-select
              v-model="refreshSeconds"
              :items="refreshIntervalItems"
              :disabled="!autoRefresh"
              label="วินาที"
              variant="outlined"
              density="comfortable"
              hide-details
              style="max-width: 140px"
            />
          </div>
        </v-col>
      </v-row>

      <div class="d-flex flex-wrap gap-2 mt-4">
        <v-btn size="small" variant="tonal" rounded="lg" @click="setThisWeek">สัปดาห์นี้</v-btn>
        <v-btn size="small" variant="tonal" rounded="lg" @click="setThisMonth">เดือนนี้</v-btn>
        <v-btn
          size="small"
          variant="text"
          rounded="lg"
          @click="clearFilters"
        >
          ล้างตัวกรอง
        </v-btn>
        <div class="ml-auto text-caption text-medium-emphasis">
          <span v-if="lastUpdatedAt">อัปเดตล่าสุด: {{ dayjs(lastUpdatedAt).format('HH:mm:ss') }}</span>
        </div>
      </div>
    </v-card>

    <v-row dense class="mb-6">
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="border pa-4" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
          <div class="text-caption text-medium-emphasis">พนักงานที่ลาหยุด (ไม่ซ้ำ)</div>
          <div class="text-h4 font-weight-bold">{{ stats.uniqueEmployeesOnLeave }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="border pa-4" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
          <div class="text-caption text-medium-emphasis">จำนวนวันลา (รวมในช่วง)</div>
          <div class="text-h4 font-weight-bold">{{ stats.totalLeaveDaysInRange }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card flat rounded="xl" class="border pa-4" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-caption text-medium-emphasis">พนักงานลาหยุดมากสุด (รายวัน)</div>
            <v-chip size="small" variant="tonal">Top 7</v-chip>
          </div>
          <div v-if="stats.topDays.length === 0" class="text-medium-emphasis">-</div>
          <v-list v-else density="compact" bg-color="transparent" class="pa-0">
            <v-list-item v-for="d in stats.topDays" :key="d.date" class="px-0">
              <template #title>
                <div class="d-flex justify-space-between">
                  <span>{{ d.label }}</span>
                  <span class="font-weight-bold">{{ d.count }}</span>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- 🎉 Holidays Section -->
    <v-card
      v-if="holidays.length > 0"
      flat
      rounded="xl"
      class="border pa-4 pa-sm-6 mb-6"
      :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'"
    >
      <div class="d-flex align-center gap-2 mb-4">
        <v-icon color="error">mdi-calendar-star</v-icon>
        <h3 class="text-h6 font-weight-bold">วันหยุดนักขัตฤกษ์ในช่วงนี้</h3>
        <v-chip size="small" color="error" variant="tonal">{{ holidays.length }} วัน</v-chip>
      </div>

      <v-row dense>
        <v-col
          v-for="holiday in holidays"
          :key="holiday.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            flat
            rounded="lg"
            class="border-sm pa-3"
            :class="theme.global.current.value.dark ? 'bg-surface' : 'bg-grey-lighten-5'"
          >
            <div class="d-flex align-center gap-3">
              <v-avatar color="error" size="48">
                <v-icon color="white">mdi-calendar-blank</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="font-weight-bold text-body-1">{{ holiday.title }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ dayjs(holiday.start_date).format('DD MMM YYYY') }}
                  <span v-if="holiday.end_date && holiday.end_date !== holiday.start_date">
                    - {{ dayjs(holiday.end_date).format('DD MMM YYYY') }}
                  </span>
                </div>
                <v-chip
                  v-if="holiday.type"
                  size="x-small"
                  color="error"
                  variant="tonal"
                  class="mt-1"
                >
                  {{ holiday.type === 'public' ? 'วันหยุดราชการ' : holiday.type === 'company' ? 'วันหยุดบริษัท' : 'วันลาพักร้อน' }}
                </v-chip>
              </div>
            </div>
            <div v-if="holiday.description" class="text-caption text-medium-emphasis mt-2 ml-15">
              {{ holiday.description }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">
      {{ loadError }}
    </v-alert>

    <v-card flat rounded="xl" class="border overflow-hidden" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
      <v-data-table
        :headers="headers"
        :items="filteredRows"
        :loading="loading"
        v-model:sort-by="sortBy"
        density="comfortable"
        hover
        item-value="id"
        :items-per-page="25"
        :mobile="isMobile"
        show-expand
      >
        <template #item.employeeName="{ item }">
          <div class="d-flex flex-column">
            <div class="font-weight-bold">{{ item.employeeName || '-' }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.employee_code || '-' }}</div>
          </div>
        </template>

        <template #item.departmentName="{ item }">
          <span>{{ item.departmentName || '-' }}</span>
        </template>

        <template #item.leaveTypeLabel="{ item }">
          <v-chip size="small" variant="tonal" :color="typeColor(item.leave_type)">
            {{ item.leaveTypeLabel }}
          </v-chip>
        </template>

        <template #item.statusLabel="{ item }">
          <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
            {{ item.statusLabel }}
          </v-chip>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-4">
              <div class="d-flex flex-column gap-2">
                <div class="d-flex flex-wrap gap-2">
                  <v-chip size="small" variant="tonal" :color="typeColor(item.leave_type)">
                    {{ item.leaveTypeLabel }}
                  </v-chip>
                  <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
                    {{ item.statusLabel }}
                  </v-chip>
                </div>
                <div class="text-body-2">
                  <span class="text-medium-emphasis">แผนก:</span> {{ item.departmentName || '-' }}
                </div>
                <div class="text-body-2">
                  <span class="text-medium-emphasis">ช่วงลา:</span> {{ dayjs(item.start_date).format('D MMM YYYY') }} – {{ dayjs(item.end_date || item.start_date).format('D MMM YYYY') }}
                </div>
                <div class="text-body-2">
                  <span class="text-medium-emphasis">วันลาในช่วงที่เลือก:</span> {{ item.daysInRange }}
                </div>
              </div>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="pa-8 text-center text-medium-emphasis">
            ไม่มีข้อมูลการลาหยุดในช่วงที่เลือก
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>
