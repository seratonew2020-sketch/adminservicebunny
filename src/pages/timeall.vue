<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.extend(buddhistEra)
dayjs.locale('th')

const report = ref([])
const loading = ref(false)
const startDate = ref(new Date().toISOString().substr(0, 10))
const endDate = ref(new Date().toISOString().substr(0, 10))
const searchId = ref('')
const searchName = ref('')

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return dayjs(dateString).format('D MMM BB เวลา HH:mm น.');
}

const loadData = async () => {
  loading.value = true
  try {
      const response = await axios.get('/api/logs', {
        params: {
          startDate: startDate.value,
          endDate: endDate.value,
          empId: searchId.value,
          name: searchName.value
        }
      })
      report.value = response.data
  } catch(e) {
      console.error(e)
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
    <h2>บันทึกเวลาเข้า-ออก (Raw Logs)</h2>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-text-field type="date" label="Start Date" v-model="startDate" density="compact" variant="outlined" hide-details></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field type="date" label="End Date" v-model="endDate" density="compact" variant="outlined" hide-details></v-text-field>
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

    <v-data-table
      :headers="[
        { title: 'รหัสพนักงาน', key: 'empId' },
        { title: 'เวลา', key: 'time' },
        { title: 'สถานะ', key: 'status' },
        { title: 'รายละเอียด', key: 'statusDetail' },
        { title: '', key: 'device' }
      ]"
      :items="report"
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
  </v-container>
</template>


<style scoped>
/* Empty style to ensure parser behaves */
</style>
