<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h2>Time Management Dashboard</h2>
        <div class="d-flex gap-2">
          <v-btn color="primary" @click="exportToPDF" prepend-icon="mdi-file-pdf-box">Export PDF</v-btn>
          <v-btn color="success" @click="exportToExcel" prepend-icon="mdi-microsoft-excel">Export Excel</v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="startDate"
          label="Start Date"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="endDate"
          label="End Date"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-center">
        <v-btn color="primary" @click="loadData" :loading="loading" block>
          Apply Filter
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card color="info" theme="dark">
          <v-card-text>
            <div class="text-subtitle-1">Present (On Time)</div>
            <div class="text-h4">{{ stats.present }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="warning" theme="dark">
          <v-card-text>
            <div class="text-subtitle-1">Late Arrivals</div>
            <div class="text-h4">{{ stats.late }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="error" theme="dark">
          <v-card-text>
            <div class="text-subtitle-1">Absent</div>
            <div class="text-h4">{{ stats.absent }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="secondary" theme="dark">
          <v-card-text>
            <div class="text-subtitle-1">Forgot Scan</div>
            <div class="text-h4">{{ stats.forgotScan }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Chart -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card title="Daily Attendance Trends">
          <v-card-text style="height: 300px; position: relative">
             <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card title="Detailed Attendance Log">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            class="px-4 pt-2"
          ></v-text-field>
          <v-data-table
            :headers="headers"
            :items="processedData"
            :search="search"
            :loading="loading"
            class="elevation-1"
          >
            <template v-slot:item.check_in="{ item }">
               {{ formatTime(item.check_in) }}
            </template>
            <template v-slot:item.check_out="{ item }">
               {{ formatTime(item.check_out) }}
            </template>
            <template v-slot:item.late_minutes="{ item }">
               <span v-if="item.late_minutes > 0" class="text-warning">
                 {{ item.late_minutes }} min
               </span>
               <span v-else>-</span>
            </template>
             <template v-slot:item.ot_hours="{ item }">
               <span v-if="item.ot_hours > 0" class="text-success">
                 {{ item.ot_hours.toFixed(2) }} hrs
               </span>
               <span v-else>-</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="small">
                {{ item.status }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchAttendanceByDateRange, fetchAllEmployees } from '@/services/api'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const loading = ref(false)
const startDate = ref(new Date().toISOString().substr(0, 10))
const endDate = ref(new Date().toISOString().substr(0, 10))
const search = ref('')
const processedData = ref([])
const employees = ref([])

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Employee ID', key: 'employee_id', sortable: true },
  { title: 'Name', key: 'employee_name', sortable: true },
  { title: 'Department', key: 'department', sortable: true },
  { title: 'Check In', key: 'check_in' },
  { title: 'Check Out', key: 'check_out' },
  { title: 'Late (Min)', key: 'late_minutes' },
  { title: 'Work Hours', key: 'work_hours' },
  { title: 'OT Hours', key: 'ot_hours' },
  { title: 'Status', key: 'status' },
]

const stats = computed(() => {
  const s = { present: 0, late: 0, absent: 0, forgotScan: 0 }
  processedData.value.forEach(item => {
    if (item.status === 'On Time') s.present++
    if (item.status === 'Late') s.late++
    if (item.status === 'Absent') s.absent++
    if (item.status === 'Forgot Scan') s.forgotScan++
  })
  return s
})

const chartData = computed(() => {
  const dates = [...new Set(processedData.value.map(d => d.date))].sort()
  const presentData = dates.map(date =>
    processedData.value.filter(d => d.date === date && (d.status === 'On Time' || d.status === 'Late')).length
  )
  const lateData = dates.map(date =>
    processedData.value.filter(d => d.date === date && d.status === 'Late').length
  )
    const absentData = dates.map(date =>
    processedData.value.filter(d => d.date === date && d.status === 'Absent').length
  )

  return {
    labels: dates,
    datasets: [
      { label: 'Present', backgroundColor: '#4CAF50', data: presentData },
      { label: 'Late', backgroundColor: '#FFC107', data: lateData },
      { label: 'Absent', backgroundColor: '#F44336', data: absentData }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}

const formatTime = (isoString) => {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'On Time': return 'success'
    case 'Late': return 'warning'
    case 'Absent': return 'error'
    case 'Forgot Scan': return 'secondary'
    default: return 'default'
  }
}

const loadData = async () => {
    loading.value = true
    try {
        const [attRes, empList] = await Promise.all([
            fetchAttendanceByDateRange(startDate.value, endDate.value),
            fetchAllEmployees() // Needed to detect absentees
        ])

        employees.value = empList || []
        const rawLogs = attRes.data || []

        processLogs(rawLogs, empList)

    } catch (error) {
        console.error("Load Data Error:", error)
    } finally {
        loading.value = false
    }
}

const processLogs = (logs, allEmployees) => {
    const dailyRecords = []

    // Create a map of existing logs by Date + EmployeeID
    const logMap = {}
    logs.forEach(log => {
        const date = log.timestamp.split('T')[0]
        const key = `${date}-${log.employee_id}`
        if (!logMap[key]) logMap[key] = []
        logMap[key].push(log)
    })

    // Generate date range array
    const dates = []
    let curr = new Date(startDate.value)
    const end = new Date(endDate.value)
    while (curr <= end) {
        dates.push(curr.toISOString().split('T')[0])
        curr.setDate(curr.getDate() + 1)
    }

    // Iterate over every employee for every date in range
    dates.forEach(date => {
        allEmployees.forEach(emp => {
            const key = `${date}-${emp.employee_id}`
            const empLogs = logMap[key] || []

            // Sort logs by time
            empLogs.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))

            let record = {
                date: date,
                employee_id: emp.employee_id,
                employee_name: `${emp.first_name} ${emp.last_name}`,
                department: emp.department,
                check_in: null,
                check_out: null,
                late_minutes: 0,
                work_hours: 0,
                ot_hours: 0,
                status: 'Absent'
            }

            if (empLogs.length > 0) {
               record.check_in = empLogs[0].timestamp // First log is Check In
               if (empLogs.length > 1) {
                   record.check_out = empLogs[empLogs.length - 1].timestamp // Last log is Check Out
               }

               // Determine Status & Late
               const workStartTime = new Date(`${date}T09:00:00`) // 09:00 AM Start Time
               const checkInTime = new Date(record.check_in)

               if (checkInTime > workStartTime) {
                   record.status = 'Late'
                   const diffMs = checkInTime - workStartTime
                   record.late_minutes = Math.floor(diffMs / 60000)
               } else {
                   record.status = 'On Time'
               }

               if (!record.check_out) {
                   record.status = 'Forgot Scan'
               } else {
                   // Calculate Work Hours
                   const checkOutTime = new Date(record.check_out)
                   const workDurationMs = checkOutTime - checkInTime
                   const hours = workDurationMs / (1000 * 60 * 60)
                   record.work_hours = hours.toFixed(2)

                   // Calculate OT (After 18:00 or > 8 hours? Simplified to > 9 hours (8 work + 1 break))
                   // Let's assume standard day ends at 18:00
                   const workEndTime = new Date(`${date}T18:00:00`)
                   if (checkOutTime > workEndTime) {
                       const otMs = checkOutTime - workEndTime
                       record.ot_hours = otMs / (1000 * 60 * 60)
                   }
               }
            }

            // Exclude Weekend/Holiday logic could go here (mark status as 'Holiday' instead of 'Absent')
            // For now, simpler logic.

            dailyRecords.push(record)
        })
    })

    processedData.value = dailyRecords
}

const exportToPDF = () => {
  const doc = new jsPDF()
  doc.text("Attendance Report", 14, 15)
  doc.autoTable({
    startY: 20,
    head: [['Date', 'ID', 'Name', 'In', 'Out', 'Late', 'Status']],
    body: processedData.value.map(row => [
      row.date,
      row.employee_id,
      row.employee_name,
      formatTime(row.check_in),
      formatTime(row.check_out),
      row.late_minutes,
      row.status
    ]),
  })
  doc.save("attendance_report.pdf")
}

const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(processedData.value.map(row => ({
      Date: row.date,
      ID: row.employee_id,
      Name: row.employee_name,
      Department: row.department,
      CheckIn: formatTime(row.check_in),
      CheckOut: formatTime(row.check_out),
      LateMinutes: row.late_minutes,
      WorkHours: row.work_hours,
      OTHours: row.ot_hours,
      Status: row.status
  })))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")
  XLSX.writeFile(workbook, "attendance_report.xlsx")
}

onMounted(() => {
    loadData()
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
