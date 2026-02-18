<script setup>
import { ref, computed } from 'vue'
import { generateAttendanceReport } from '@/services/AttendanceService'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const reportType = ref('summary')
const startDate = ref(dayjs().startOf('month').format('YYYY-MM-DD'))
const endDate = ref(dayjs().format('YYYY-MM-DD'))
const loading = ref(false)
const reportData = ref([])

const reportTypes = [
  { title: 'Summary Report', value: 'summary', icon: 'mdi-file-chart' },
  { title: 'Detailed Attendance', value: 'detailed', icon: 'mdi-table-clock' },
  { title: 'Late Arrivals', value: 'late', icon: 'mdi-clock-alert' },
  { title: 'Overtime', value: 'ot', icon: 'mdi-briefcase-clock' }
]

const headers = computed(() => {
  if (reportType.value === 'summary') {
    return [
      { title: 'Employee', key: 'full_name' },
      { title: 'Department', key: 'department' },
      { title: 'Total Hours', key: 'summary.total_work_hours' },
      { title: 'Late (Mins)', key: 'summary.total_late_minutes' },
      { title: 'Present (Days)', key: 'summary.present_count' },
    ]
  } else {
    return [
      { title: 'Date', key: 'date' },
      { title: 'Employee', key: 'full_name' },
      { title: 'Check In', key: 'check_in' },
      { title: 'Check Out', key: 'check_out' },
      { title: 'Status', key: 'status' },
    ]
  }
})

const generateReport = async () => {
  loading.value = true
  try {
    // Reusing existing service for now, but in real app would query differently based on type
    const data = await generateAttendanceReport(startDate.value, endDate.value)

    if (reportType.value === 'summary') {
      // Group by employee for summary
      const groups = {}
      data.forEach(r => {
        if (!groups[r.employee_id]) {
          groups[r.employee_id] = {
            full_name: r.full_name,
            department: r.department,
            summary: { total_work_hours: 0, total_late_minutes: 0, present_count: 0 }
          }
        }
        groups[r.employee_id].summary.total_work_hours += parseFloat(r.work_hours) || 0
        groups[r.employee_id].summary.total_late_minutes += r.late_minutes || 0
        if (r.status === 'ปกติ' || r.status === 'มาสาย') groups[r.employee_id].summary.present_count++
      })
      reportData.value = Object.values(groups)
    } else {
      reportData.value = data
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const exportPDF = () => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.text('Attendance Report', 14, 22)
  doc.setFontSize(11)
  doc.text(`Generated on: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 14, 30)

  // Table
  const tableColumn = headers.value.map(h => h.title)
  const tableRows = []

  reportData.value.forEach(item => {
    if (reportType.value === 'summary') {
      tableRows.push([
        item.full_name,
        item.department,
        item.summary.total_work_hours.toFixed(2),
        item.summary.total_late_minutes,
        item.summary.present_count
      ])
    } else {
      tableRows.push([
        item.date,
        item.full_name,
        item.check_in,
        item.check_out,
        item.status
      ])
    }
  })

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
  })

  doc.save(`report_${reportType.value}.pdf`)
}

const exportCSV = () => {
  // Simple CSV export logic
  const headerRow = headers.value.map(h => h.title).join(',')
  const rows = reportData.value.map(item => {
    if (reportType.value === 'summary') {
      return `${item.full_name},${item.department},${item.summary.total_work_hours},${item.summary.total_late_minutes},${item.summary.present_count}`
    } else {
      return `${item.date},${item.full_name},${item.check_in},${item.check_out},${item.status}`
    }
  }).join('\n')

  const csvContent = `\ufeff${headerRow}\n${rows}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `report_${reportType.value}.csv`
  link.click()
}
</script>

<template>
  <v-container fluid>
    <h1 class="text-h4 font-weight-bold mb-6">Advanced Reporting</h1>

    <v-row>
      <v-col cols="12" md="3">
        <v-card class="h-100 pa-4">
          <h3 class="text-h6 mb-4">Configuration</h3>

          <v-select v-model="reportType" :items="reportTypes" item-title="title" item-value="value" label="Report Type"
            variant="outlined" prepend-inner-icon="mdi-file-document"></v-select>

          <v-text-field v-model="startDate" type="date" label="Start Date" variant="outlined"
            class="mt-2"></v-text-field>

          <v-text-field v-model="endDate" type="date" label="End Date" variant="outlined" class="mt-2"></v-text-field>

          <v-divider class="my-4"></v-divider>

          <h4 class="text-subtitle-2 mb-2">Scheduler</h4>
          <v-switch label="Enable Auto-Send" color="primary" density="compact" hide-details></v-switch>
          <v-select label="Frequency" :items="['Daily', 'Weekly', 'Monthly']" variant="outlined" density="compact"
            class="mt-2" disabled></v-select>

          <v-btn block color="primary" size="large" class="mt-6" @click="generateReport" :loading="loading">
            Generate Report
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card class="h-100 pa-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <h3 class="text-h6">Preview</h3>
            <div class="d-flex gap-2">
              <v-btn variant="outlined" color="error" prepend-icon="mdi-file-pdf-box" @click="exportPDF"
                :disabled="reportData.length === 0">
                Export PDF
              </v-btn>
              <v-btn variant="outlined" color="success" prepend-icon="mdi-file-excel" @click="exportCSV"
                :disabled="reportData.length === 0">
                Export CSV
              </v-btn>
            </div>
          </div>

          <v-data-table :headers="headers" :items="reportData" :loading="loading" class="border rounded-lg">
            <template v-slot:no-data>
              <div class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-chart-bar</v-icon>
                <p class="text-medium-emphasis mt-2">Select parameters and click Generate Report</p>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
