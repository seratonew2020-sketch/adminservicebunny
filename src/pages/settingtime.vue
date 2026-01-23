<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1>ตั้งค่าเวลาการทำงาน (Master Time)</h1>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            เพิ่มเวลาใหม่
          </v-btn>
        </div>

        <v-card elevation="2">
          <v-data-table
            :headers="headers"
            :items="masterTimes"
            :loading="loading"
            class="elevation-1"
          >
            <template v-slot:item.actions="{ item }">
              <v-icon
                size="small"
                class="me-2"
                @click="openDialog(item)"
                color="primary"
              >
                mdi-pencil
              </v-icon>
              <v-icon
                size="small"
                @click="confirmDelete(item)"
                color="error"
              >
                mdi-delete
              </v-icon>
            </template>
            <template v-slot:no-data>
              <v-alert type="info" class="mt-4">ไม่พบข้อมูลเวลาหลัก</v-alert>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog for Add/Edit -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="form" v-model="valid">
              <v-text-field
                v-model="editedItem.name"
                label="ชื่อช่วงเวลา"
                placeholder="เช่น กะเช้า, กะบ่าย"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                class="mb-2"
              ></v-text-field>

              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="editedItem.start_time"
                    label="เวลาเริ่มต้น"
                    type="time"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editedItem.end_time"
                    label="เวลาสิ้นสุด"
                    type="time"
                    :rules="[rules.required, rules.endTimeAfterStart]"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
            ยกเลิก
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="save"
            :loading="saving"
            :disabled="!valid"
          >
            บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">ยืนยันการลบ</v-card-title>
        <v-card-text>คุณต้องการลบข้อมูลเวลา "{{ editedItem.name }}" ใช่หรือไม่?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete">ยกเลิก</v-btn>
          <v-btn color="error" variant="text" @click="deleteItemConfirm" :loading="deleting">ลบข้อมูล</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">ปิด</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { fetchMasterTimes, createMasterTime, updateMasterTime, deleteMasterTime } from '@/services/api';

const masterTimes = ref([]);
const loading = ref(false);
const dialog = ref(false);
const dialogDelete = ref(false);
const valid = ref(false);
const saving = ref(false);
const deleting = ref(false);

const headers = [
  { title: 'ชื่อช่วงเวลา', key: 'name', align: 'start' },
  { title: 'เวลาเริ่มต้น', key: 'start_time', align: 'center' },
  { title: 'เวลาสิ้นสุด', key: 'end_time', align: 'center' },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'end' },
];

const editedIndex = ref(-1);
const editedItem = reactive({
  id: null,
  name: '',
  start_time: '',
  end_time: '',
});

const defaultItem = {
  id: null,
  name: '',
  start_time: '',
  end_time: '',
};

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'เพิ่มเวลาใหม่' : 'แก้ไขเวลา';
});

const rules = {
  required: value => !!value || 'กรุณากรอกข้อมูล',
  endTimeAfterStart: value => {
    if (!editedItem.start_time || !value) return true;
    return value > editedItem.start_time || 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น';
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    masterTimes.value = await fetchMasterTimes();
  } catch (error) {
    showSnackbar('ไม่สามารถดึงข้อมูลเวลาได้', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const openDialog = (item = null) => {
  if (item) {
    editedIndex.value = masterTimes.value.indexOf(item);
    Object.assign(editedItem, item);
  } else {
    editedIndex.value = -1;
    Object.assign(editedItem, defaultItem);
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  setTimeout(() => {
    Object.assign(editedItem, defaultItem);
    editedIndex.value = -1;
  }, 300);
};

const save = async () => {
  if (!valid.value) return;

  saving.value = true;
  try {
    if (editedIndex.value > -1) {
      // Update
      await updateMasterTime(editedItem.id, editedItem);
      showSnackbar('อัปเดตข้อมูลสำเร็จ');
    } else {
      // Create
      await createMasterTime(editedItem);
      showSnackbar('สร้างข้อมูลสำเร็จ');
    }
    await loadData();
    closeDialog();
  } catch (error) {
    showSnackbar('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item) => {
  editedIndex.value = masterTimes.value.indexOf(item);
  Object.assign(editedItem, item);
  dialogDelete.value = true;
};

const closeDelete = () => {
  dialogDelete.value = false;
  setTimeout(() => {
    Object.assign(editedItem, defaultItem);
    editedIndex.value = -1;
  }, 300);
};

const deleteItemConfirm = async () => {
  deleting.value = true;
  try {
    await deleteMasterTime(editedItem.id);
    showSnackbar('ลบข้อมูลสำเร็จ');
    await loadData();
  } catch (error) {
    showSnackbar('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
  } finally {
    deleting.value = false;
    closeDelete();
  }
};

const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};
</script>
