<script setup>
import { ref, onMounted } from 'vue'
import { fetchAttendanceLogs } from '@/services/logs'
import { fetchRawAttendanceLogs } from '@/services/api'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.extend(buddhistEra)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('th')

const report = ref([])
const processed = ref([])
const loading = ref(false)
const startDate = ref(new Date().toISOString().substr(0, 10))
const endDate = ref(new Date().toISOString().substr(0, 10))
const searchId = ref('')
const searchName = ref('')
const tab = ref('raw')
const menuStart = ref(false)
const menuEnd = ref(false)

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return dayjs.utc(dateString).tz('Asia/Bangkok').format('D MMM BB เวลา HH:mm น.');
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchAttendanceLogs({
      startDate: startDate.value,
      endDate: endDate.value,
      empId: searchId.value,
      name: searchName.value
    })
    report.value = data
    // Also load processed logs
    const pdata = await fetchRawAttendanceLogs({
      start_date: startDate.value,
      end_date: endDate.value,
      limit: 1000
    })
    processed.value = pdata
  } catch(e) {
    console.error('Failed to load logs:', e)
    // alert('ไม่สามารถดึงข้อมูลได้: ' + e.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <v-container fluid>
    <div class="d-flex align-center justify-space-between">
      <h2>บันทึกเวลาเข้า-ออก</h2>
      <v-tabs v-model="tab" density="compact">
        <v-tab value="raw">Raw Logs</v-tab>
        <v-tab value="processed">Processed Logs</v-tab>
      </v-tabs>
    </div>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-menu v-model="menuStart" :close-on-content-click="false" transition="scale-transition" offset-y>
          <template #activator="{ props }">
            <v-text-field v-bind="props" label="Start Date" v-model="startDate" density="compact" variant="outlined" hide-details readonly></v-text-field>
          </template>
          <v-date-picker v-model="startDate" />
        </v-menu>
      </v-col>
      <v-col cols="12" md="6">
        <v-menu v-model="menuEnd" :close-on-content-click="false" transition="scale-transition" offset-y>
          <template #activator="{ props }">
            <v-text-field v-bind="props" label="End Date" v-model="endDate" density="compact" variant="outlined" hide-details readonly></v-text-field>
          </template>
          <v-date-picker v-model="endDate" />
        </v-menu>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field label="Employee ID" v-model="searchId" density="compact" variant="outlined" hide-details clearable prepend-inner-icon="mdi-identifier"></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field label="Name" v-model="searchName" density="compact" variant="outlined" hide-details clearable prepend-inner-icon="mdi-account-search"></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-btn color="primary" block @click="loadData" :loading="loading" height="40" prepend-icon="mdi-magnify">ค้นหา</v-btn>
      </v-col>
    </v-row>

    <v-window v-model="tab" class="mt-2">
      <v-window-item value="raw">
        <v-data-table
          :headers="[
            { title: 'รหัสพนักงาน', key: 'employee_id' },
            { title: 'ชื่อ-นามสกุล', key: 'name' },
            { title: 'แผนก', key: 'department' },
            { title: 'เวลา', key: 'timestamp' },
            { title: 'สถานะ', key: 'type' },
            { title: 'รายละเอียด', key: 'status_detail' },
            { title: 'สาย', key: 'is_late' }
          ]"
          :items="report"
          :loading="loading"
        >
          <template v-slot:item.timestamp="{ item }">
            {{ formatDate(item.timestamp) }}
          </template>
          <template v-slot:item.type="{ item }">
            <v-chip
              :color="item.type === 'เข้างาน' || item.type === 'check_in' ? 'success' : 'info'"
              size="small"
            >
              {{ item.type === 'check_in' ? 'เข้างาน' : (item.type === 'check_out' ? 'ออกงาน' : item.type) }}
            </v-chip>
          </template>
          <template v-slot:item.image="{ item }">
            <v-img
              v-if="item.image"
              :src="item.image"
              width="50"
              height="50"
              cover
              class="rounded"
            ></v-img>
            <span v-else>-</span>
          </template>
        </v-data-table>
      </v-window-item>
      <v-window-item value="processed">
        <v-data-table
          :headers="[
            { title: 'รหัสพนักงาน', key: 'empId' },
            { title: 'เวลา', key: 'time' },
            { title: 'สถานะ', key: 'status' },
            { title: 'รายละเอียด', key: 'statusDetail' },
            { title: 'อุปกรณ์', key: 'device' }
          ]"
          :items="processed"
          :loading="loading"
        >
          <template v-slot:item.time="{ item }">
            {{ formatDate(item.time) }}
          </template>
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.status === 'เข้างาน' ? 'success' : item.status === 'ออกงาน' ? 'info' : 'warning'"
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>
        </v-data-table>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<style scoped>
/* Empty style to ensure parser behaves */
</style>
