<template>
    <v-container fluid>
      <v-card class="mb-4">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-calendar-clock" class="mr-2" />
          รายงานการลงเวลาประจำวัน
        </v-card-title>

        <v-card-text>
          <v-row align="center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="selectedDate"
                type="date"
                label="เลือกวันที่"
                variant="outlined"
                @change="fetchReport"
              />
            </v-col>
            <v-col cols="12" md="8" class="text-right">
              <v-btn color="primary" prepend-icon="mdi-refresh" @click="fetchReport" :loading="loading">
                ประมวลผล
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card>
        <v-data-table
          :headers="headers"
          :items="reportData"
          :loading="loading"
          hover
        >
          <template v-slot:item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <template v-slot:item.checkInTime="{ item }">
            {{ item.checkInTime ? formatTime(item.checkInTime) : '-' }}
          </template>

          <template v-slot:item.lateMinutes="{ item }">
            <span v-if="item.lateMinutes > 0" class="text-error font-weight-bold">
              +{{ item.lateMinutes }} นาที
            </span>
            <span v-else class="text-success">ปกติ</span>
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </template>

  <script setup>
  import { ref, onMounted } from 'vue';
  import api from '@/services/api';
  import dayjs from 'dayjs';

  const loading = ref(false);
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
  const reportData = ref([]);

  const headers = [
    { title: 'รหัสพนักงาน', key: 'id' },
    { title: 'ชื่อ-นามสกุล', key: 'name' },
    { title: 'เวลาเข้างาน', key: 'checkInTime' },
    { title: 'สถานะ', key: 'status' },
    { title: 'มาสาย', key: 'lateMinutes' },
  ];

  const fetchReport = async () => {
    loading.value = true;
    try {
      console.log('Fetching report for date:', selectedDate.value);
      if (!selectedDate.value) {
          console.error("Date is empty!");
          return;
      }
      const response = await api.get('/daily-summary', {
        params: { date: selectedDate.value }
      });
      console.log('Report Data:', response.data);
      reportData.value = response.data;
    } catch (error) {
      console.error('Error fetching report:', error.response?.data || error.message);
    } finally {
      loading.value = false;
    }
  };

  // Helper Functions
  const formatTime = (ts) => dayjs(ts).format('HH:mm:ss');

  const getStatusColor = (status) => {
    const colors = { present: 'success', late: 'warning', absent: 'error' };
    return colors[status] || 'grey';
  };

  const getStatusText = (status) => {
    const texts = { present: 'ปกติ', late: 'มาสาย', absent: 'ขาดงาน' };
    return texts[status] || status;
  };

  // Fetch on mount
  onMounted(() => {
    fetchReport();
  });
  </script>