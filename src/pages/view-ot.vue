<script setup>
import { ref, onMounted, computed } from 'vue'
import { fetchRawAttendanceLogs } from '@/services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(buddhistEra)
dayjs.locale('th')
dayjs.tz.setDefault("Asia/Bangkok")

const otList = ref([])
const loading = ref(false)
const searchEmployeeId = ref('')
const statusFilter = ref('all') // 'all', 'ot', 'leave'

const loadOTData = async (employeeId = '') => {
  loading.value = true
  try {
    const params = {
      start_date: dayjs().tz().subtract(1, 'month').format('YYYY-MM-DD'),
      end_date: dayjs().tz().format('YYYY-MM-DD')
    }

    if (employeeId) {
      params.employee_id = employeeId
    }

    const data = await fetchRawAttendanceLogs(params)

    // Filter based on status selection
    if (statusFilter.value === 'ot') {
      otList.value = data.filter(item => item.status === 'OT')
    } else if (statusFilter.value === 'leave') {
      otList.value = data.filter(item => item.status === 'หยุดงาน' || item.status === 'ลา')
    } else {
      // Show both OT and leave
      otList.value = data.filter(item =>
        item.status === 'OT' ||
        item.status === 'หยุดงาน' ||
        item.status === 'ลา'
      )
    }
  } catch (error) {
    console.error('Error loading OT:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadOTData(searchEmployeeId.value)
}

const clearFilter = () => {
  searchEmployeeId.value = ''
  statusFilter.value = 'all'
  loadOTData()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).tz().format('D MMM BBBB')
}

const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return dayjs(timeStr).tz().format('HH:mm น.')
}

onMounted(() => {
  loadOTData()
})
</script>

<template>
  <v-container fluid class="pa-4">
    <v-row class="mb-4">
      <v-col>
        <h2>รายละเอียด OT และหยุดงาน</h2>
        <div class="text-subtitle-2 text-medium-emphasis">
          แสดงรายการ OT และการหยุดงาน/ลาของพนักงาน
        </div>
      </v-col>
    </v-row>

    <!-- Search Filter -->
    <v-card class="mb-4 pa-4" elevation="1">
      <v-row align="center">
        <v-col cols="12" md="3">
          <v-text-field
            v-model="searchEmployeeId"
            label="ค้นหารหัสพนักงาน"
            prepend-inner-icon="mdi-account-search"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            @click:clear="clearFilter"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="5">
          <v-radio-group
            v-model="statusFilter"
            inline
            hide-details
            density="compact"
            @update:model-value="loadOTData(searchEmployeeId)"
          >
            <v-radio label="ทั้งหมด" value="all" color="primary"></v-radio>
            <v-radio label="เฉพาะ OT" value="ot" color="error"></v-radio>
            <v-radio label="เฉพาะหยุดงาน/ลา" value="leave" color="warning"></v-radio>
          </v-radio-group>
        </v-col>
        <v-col cols="12" md="2">
          <v-btn
            color="primary"
            block
            @click="handleSearch"
            :loading="loading"
            height="40"
            prepend-icon="mdi-magnify"
          >
            ค้นหา
          </v-btn>
        </v-col>
        <v-col cols="12" md="2">
          <v-btn
            variant="outlined"
            block
            @click="clearFilter"
            height="40"
            prepend-icon="mdi-refresh"
          >
            รีเซ็ต
          </v-btn>
        </v-col>
      </v-row>
      <v-row class="mt-2">
        <v-col class="text-right">
          <v-chip
            :color="statusFilter === 'ot' ? 'error' : statusFilter === 'leave' ? 'warning' : 'primary'"
            variant="tonal"
          >
            <v-icon start>mdi-text-box-search</v-icon>
            พบทั้งหมด: {{ otList.length }} รายการ
          </v-chip>
        </v-col>
      </v-row>
    </v-card>

    <v-data-table
      :items="otList"
      :loading="loading"
      :headers="[
        { title: 'วันที่ทำงาน', key: 'work_date' },
        { title: 'รหัสพนักงาน', key: 'employee_id' },
        { title: 'เวลาเข้า', key: 'check_in' },
        { title: 'เวลาออก', key: 'check_out' },
        { title: 'สถานะ', key: 'status' }
      ]"
    >
      <template v-slot:item.work_date="{ item }">
        <span class="font-weight-medium">{{ formatDate(item.work_date) }}</span>
      </template>
      <template v-slot:item.check_in="{ item }">
        <v-chip size="small" color="success" variant="tonal">
          {{ formatTime(item.check_in) }}
        </v-chip>
      </template>
      <template v-slot:item.check_out="{ item }">
        <v-chip size="small" color="error" variant="tonal">
          {{ formatTime(item.check_out) }}
        </v-chip>
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip
          :color="item.status === 'OT' ? 'error' : item.status === 'หยุดงาน' || item.status === 'ลา' ? 'warning' : 'grey'"
          size="small"
        >
          {{ item.status }}
        </v-chip>
      </template>
    </v-data-table>
  </v-container>
</template>
