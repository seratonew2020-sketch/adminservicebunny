<template>
  <v-container fluid class="master-times-container">
    <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="mb-4">
          <v-card-title class="bg-primary text-white">
            <v-icon left>mdi-clock-time-four-outline</v-icon>
            ระบบบันทึกเวลาเข้างาน (Master Times)
          </v-card-title>

          <v-card-text class="pa-6">
            <!-- ส่วนที่ 1: Master Shift Times -->
            <v-row>
              <v-col cols="12">
                <h3 class="text-h6 mb-4">
                  <v-icon left color="primary">mdi-clock-outline</v-icon>
                  ช่วงเวลาทำงานหลัก (Master Shift Times)
                </h3>

                <v-data-table
                  :headers="shiftHeaders"
                  :items="masterShifts"
                  :loading="loadingShifts"
                  class="elevation-1"
                  density="comfortable"
                >
                  <template v-slot:top>
                    <v-toolbar flat>
                      <v-toolbar-title>รายการช่วงเวลาทำงาน</v-toolbar-title>
                      <v-spacer></v-spacer>
                      <v-btn
                        color="primary"
                        @click="openShiftDialog()"
                      >
                        <v-icon left>mdi-plus</v-icon>
                        เพิ่มช่วงเวลา
                      </v-btn>
                    </v-toolbar>
                  </template>

                  <template v-slot:item.is_overnight="{ item }">
                    <v-chip
                      :color="item.is_overnight ? 'orange' : 'green'"
                      size="small"
                      variant="flat"
                    >
                      {{ item.is_overnight ? 'ข้ามวัน' : 'ปกติ' }}
                    </v-chip>
                  </template>

                  <template v-slot:item.is_active="{ item }">
                    <v-chip
                      :color="item.is_active ? 'success' : 'error'"
                      size="small"
                      variant="flat"
                    >
                      {{ item.is_active ? 'ใช้งาน' : 'ปิดใช้งาน' }}
                    </v-chip>
                  </template>

                  <template v-slot:item.actions="{ item }">
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click="openShiftDialog(item)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteShift(item.id)"
                    ></v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>

            <v-divider class="my-8"></v-divider>

            <!-- ส่วนที่ 2: Work Summary (สรุปการทำงาน) -->
            <v-row>
              <v-col cols="12">
                <div class="d-flex justify-space-between align-center mb-4">
                  <h3 class="text-h6">
                    <v-icon left color="primary">mdi-table</v-icon>
                    สรุปการทำงาน (Work Summary)
                  </h3>
                  <div class="d-flex gap-2 align-center" style="max-width: 800px;">
                    <v-text-field
                      v-model="processForm.employee_id"
                      label="รหัสพนักงาน"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="width: 150px;"
                    ></v-text-field>
                    <v-text-field
                      v-model="processForm.start_date"
                      label="จากวันที่"
                      type="date"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="width: 180px;"
                    ></v-text-field>
                    <v-text-field
                      v-model="processForm.end_date"
                      label="ถึงวันที่"
                      type="date"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="width: 180px;"
                    ></v-text-field>
                    <v-btn
                      color="primary"
                      :loading="loadingAttendance"
                      @click="loadProcessedAttendance"
                      prepend-icon="mdi-magnify"
                    >
                      ดึงข้อมูลสรุป
                    </v-btn>
                  </div>
                </div>

                <v-data-table
                  :headers="attendanceHeaders"
                  :items="processedAttendance"
                  :loading="loadingAttendance"
                  class="elevation-1"
                  density="comfortable"
                >
                  <template v-slot:top>
                    <v-toolbar flat>
                      <v-toolbar-title>รายการเข้างานที่ประมวลผลแล้ว</v-toolbar-title>
                      <v-spacer></v-spacer>
                      <v-btn
                        color="success"
                        variant="outlined"
                        @click="loadProcessedAttendance"
                      >
                        <v-icon left>mdi-refresh</v-icon>
                        รีเฟรช
                      </v-btn>
                    </v-toolbar>
                  </template>

                  <template v-slot:item.work_date="{ item }">
                    {{ formatDate(item.work_date) }}
                  </template>

                  <template v-slot:item.check_in_time="{ item }">
                    {{ formatTime(item.check_in_time) }}
                  </template>

                  <template v-slot:item.check_out_time="{ item }">
                    {{ formatTime(item.check_out_time) }}
                  </template>

                  <template v-slot:item.status="{ item }">
                    <v-chip
                      :color="getStatusColor(item.status)"
                      size="small"
                      variant="flat"
                    >
                      {{ getStatusText(item.status) }}
                    </v-chip>
                  </template>

                  <template v-slot:item.total_hours="{ item }">
                    <strong>{{ item.total_hours ? item.total_hours.toFixed(2) : '-' }}</strong> ชม.
                  </template>

                  <template v-slot:item.is_overnight="{ item }">
                    <v-icon v-if="item.is_overnight" color="orange">mdi-weather-night</v-icon>
                    <v-icon v-else color="blue">mdi-weather-sunny</v-icon>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>

            <!-- ส่วนที่ 4: Statistics -->
            <v-row class="mt-6">
              <v-col cols="12" md="3">
                <v-card color="primary" dark>
                  <v-card-text>
                    <div class="text-h4">{{ statistics.total_records || 0 }}</div>
                    <div>รายการทั้งหมด</div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="3">
                <v-card color="success" dark>
                  <v-card-text>
                    <div class="text-h4">{{ statistics.complete_records || 0 }}</div>
                    <div>สมบูรณ์</div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="3">
                <v-card color="warning" dark>
                  <v-card-text>
                    <div class="text-h4">{{ statistics.missing_in_records || 0 }}</div>
                    <div>ลืมสแกนเข้า</div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="3">
                <v-card color="error" dark>
                  <v-card-text>
                    <div class="text-h4">{{ statistics.missing_out_records || 0 }}</div>
                    <div>ลืมสแกนออก</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog for Add/Edit Shift -->
    <v-dialog v-model="shiftDialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-primary text-white">
          {{ editingShift ? 'แก้ไขช่วงเวลาทำงาน' : 'เพิ่มช่วงเวลาทำงาน' }}
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="shiftForm">
            <v-text-field
              v-model="shiftForm.shift_name"
              label="ชื่อช่วงเวลา"
              variant="outlined"
              :rules="[v => !!v || 'กรุณากรอกชื่อช่วงเวลา']"
            ></v-text-field>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="shiftForm.start_time"
                  label="เวลาเข้างาน"
                  type="time"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณากรอกเวลาเข้างาน']"
                ></v-text-field>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="shiftForm.end_time"
                  label="เวลาออกงาน"
                  type="time"
                  variant="outlined"
                  :rules="[v => !!v || 'กรุณากรอกเวลาออกงาน']"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-checkbox
              v-model="shiftForm.is_overnight"
              label="เป็นกะข้ามวัน"
              color="primary"
            ></v-checkbox>

            <v-checkbox
              v-model="shiftForm.is_active"
              label="เปิดใช้งาน"
              color="primary"
            ></v-checkbox>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="shiftDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveShift">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';

// =====================================================
// Data
// =====================================================

const masterShifts = ref([]);
const processedAttendance = ref([]);
const statistics = ref({});

const loadingShifts = ref(false);
const loadingAttendance = ref(false);

const shiftDialog = ref(false);
const editingShift = ref(null);

const shiftForm = ref({
  shift_name: '',
  start_time: '',
  end_time: '',
  is_overnight: false,
  is_active: true
});

const processForm = ref({
  employee_id: '',
  start_date: '',
  end_date: ''
});

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
});

// =====================================================
// Table Headers
// =====================================================

const shiftHeaders = [
  { title: 'ชื่อช่วงเวลา', key: 'shift_name', sortable: true },
  { title: 'เวลาเข้างาน', key: 'start_time', sortable: true },
  { title: 'เวลาออกงาน', key: 'end_time', sortable: true },
  { title: 'ประเภท', key: 'is_overnight', sortable: true },
  { title: 'สถานะ', key: 'is_active', sortable: true },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const attendanceHeaders = [
  { title: 'วันที่', key: 'work_date', sortable: true },
  { title: 'รหัสพนักงาน', key: 'employee_code', sortable: true },
  { title: 'ชื่อ-นามสกุล', key: 'first_name', sortable: true },
  { title: 'เวลาเข้า', key: 'check_in_time', sortable: true },
  { title: 'เวลาออก', key: 'check_out_time', sortable: true },
  { title: 'ช่วงเวลา', key: 'shift_name', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'ชั่วโมง', key: 'total_hours', sortable: true },
  { title: 'ข้ามวัน', key: 'is_overnight', sortable: true }
];

// =====================================================
// Methods
// =====================================================

async function loadMasterShifts() {
  try {
    loadingShifts.value = true;
    const response = await api.get('/master-times');
    masterShifts.value = response.data.data || [];
  } catch (error) {
    showSnackbar('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    console.error('Error loading master shifts:', error);
  } finally {
    loadingShifts.value = false;
  }
}

async function loadProcessedAttendance() {
  try {
    loadingAttendance.value = true;
    const params = {};

    if (processForm.value.employee_id) {
      params.employee_id = processForm.value.employee_id;
    }
    if (processForm.value.start_date) {
      params.start_date = processForm.value.start_date;
    }
    if (processForm.value.end_date) {
      params.end_date = processForm.value.end_date;
    }

    const response = await api.get('/master-times/processed-attendance', { params });
    processedAttendance.value = response.data.data || [];

    // Load statistics
    if (processForm.value.start_date && processForm.value.end_date) {
      await loadStatistics();
    }
  } catch (error) {
    showSnackbar('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    console.error('Error loading processed attendance:', error);
  } finally {
    loadingAttendance.value = false;
  }
}

async function loadStatistics() {
  try {
    const response = await api.get('/master-times/statistics', {
      params: {
        start_date: processForm.value.start_date,
        end_date: processForm.value.end_date
      }
    });
    statistics.value = response.data.data || {};
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}



function openShiftDialog(shift = null) {
  if (shift) {
    editingShift.value = shift;
    shiftForm.value = { ...shift };
  } else {
    editingShift.value = null;
    shiftForm.value = {
      shift_name: '',
      start_time: '',
      end_time: '',
      is_overnight: false,
      is_active: true
    };
  }
  shiftDialog.value = true;
}

async function saveShift() {
  try {
    if (editingShift.value) {
      // Update
      await api.put(`/master-times/${editingShift.value.id}`, shiftForm.value);
      showSnackbar('อัพเดทข้อมูลสำเร็จ', 'success');
    } else {
      // Create
      await api.post('/master-times', shiftForm.value);
      showSnackbar('เพิ่มข้อมูลสำเร็จ', 'success');
    }

    shiftDialog.value = false;
    await loadMasterShifts();
  } catch (error) {
    showSnackbar('เกิดข้อผิดพลาดในการบันทึก', 'error');
    console.error('Error saving shift:', error);
  }
}

async function deleteShift(id) {
  if (!confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) return;

  try {
    await api.delete(`/master-times/${id}`);
    showSnackbar('ลบข้อมูลสำเร็จ', 'success');
    await loadMasterShifts();
  } catch (error) {
    showSnackbar('เกิดข้อผิดพลาดในการลบ', 'error');
    console.error('Error deleting shift:', error);
  }
}

function showSnackbar(message, color = 'success') {
  snackbar.value = {
    show: true,
    message,
    color
  };
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(dateTimeString) {
  if (!dateTimeString) return '-';
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusColor(status) {
  const colors = {
    'COMPLETE': 'success',
    'MISSING_IN': 'warning',
    'MISSING_OUT': 'error'
  };
  return colors[status] || 'grey';
}

function getStatusText(status) {
  const texts = {
    'COMPLETE': 'สมบูรณ์',
    'MISSING_IN': 'ลืมสแกนเข้างาน',
    'MISSING_OUT': 'ลืมสแกนออกงาน'
  };
  return texts[status] || status;
}

// =====================================================
// Lifecycle
// =====================================================

onMounted(async () => {
  await loadMasterShifts();

  // Set default date range (last 7 days)
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  processForm.value.start_date = lastWeek.toISOString().split('T')[0];
  processForm.value.end_date = today.toISOString().split('T')[0];
});
</script>

<style scoped>
.master-times-container {
  max-width: 1400px;
  margin: 0 auto;
}

.bg-primary {
  background-color: rgb(var(--v-theme-primary)) !important;
}
</style>
