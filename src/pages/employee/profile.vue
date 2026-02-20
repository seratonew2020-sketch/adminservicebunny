<template>
  <v-container class="pa-3 pa-md-6 profile-container" fluid>
    <!-- Page Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-3" size="32">mdi-account-circle</v-icon>
          My Profile
        </h1>
        <p class="text-medium-emphasis mt-1">Manage your personal information and settings</p>
      </div>
      <v-btn
        v-if="!isEditing && employeeData"
        color="primary"
        variant="elevated"
        class="text-none font-weight-bold rounded-lg"
        prepend-icon="mdi-pencil"
        @click="startEditing"
      >
        Edit Profile
      </v-btn>
    </div>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col cols="12" md="4">
        <v-skeleton-loader type="card, list-item-two-line" elevation="2" class="rounded-xl"></v-skeleton-loader>
      </v-col>
      <v-col cols="12" md="8">
        <v-skeleton-loader type="article, table-heading, list-item-two-line@4" elevation="2" class="rounded-xl"></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- Content -->
    <v-row v-else-if="employeeData">
      <!-- Left Column: Avatar & Quick Info -->
      <v-col cols="12" md="4" lg="3">
        <v-card class="premium-card text-center pa-6 rounded-xl border" elevation="0">
          <div class="avatar-wrapper mx-auto mb-4">
            <v-avatar size="140" color="surface-variant" class="profile-avatar border-md border-primary border-opacity-50">
              <v-img v-if="employeeData.profile_image_url" :src="employeeData.profile_image_url" cover></v-img>
              <span v-else class="text-h3 font-weight-bold text-primary">{{ initials }}</span>
            </v-avatar>
            <v-btn v-if="isEditing" icon="mdi-camera" size="small" color="primary" class="avatar-edit-btn" elevation="4"></v-btn>
          </div>

          <h2 class="text-h5 font-weight-bold mb-1">{{ employeeData.first_name }} {{ employeeData.last_name }}</h2>
          <p class="text-medium-emphasis mb-3">{{ user?.email }}</p>

          <div class="d-flex justify-center gap-2 flex-wrap mb-4">
            <v-chip color="primary" size="small" variant="tonal" class="font-weight-medium">
              <v-icon start icon="mdi-briefcase-outline" size="small"></v-icon>
              {{ employeeData.positions?.title || 'No Position' }}
            </v-chip>
            <v-chip color="secondary" size="small" variant="tonal" class="font-weight-medium">
              <v-icon start icon="mdi-domain" size="small"></v-icon>
              {{ employeeData.departments?.department_name || employeeData.departments?.name || 'No Dept' }}
            </v-chip>
          </div>

          <v-divider class="my-4"></v-divider>

          <v-list density="compact" class="text-left bg-transparent">
            <v-list-item prepend-icon="mdi-identifier" class="px-0">
              <v-list-item-title class="text-caption text-medium-emphasis">Employee ID</v-list-item-title>
              <v-list-item-subtitle class="font-weight-medium text-body-1">{{ employeeData.employee_id || employeeData.employee_code || '-' }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item prepend-icon="mdi-calendar-start" class="px-0 mt-2">
              <v-list-item-title class="text-caption text-medium-emphasis">Join Date</v-list-item-title>
              <v-list-item-subtitle class="font-weight-medium text-body-1">{{ formatDate(employeeData.join_date) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Right Column: Details & Form -->
      <v-col cols="12" md="8" lg="9">
        <v-card class="premium-card pa-1 rounded-xl border" elevation="0">
          <v-card-title class="pa-4 pb-0 text-h6 font-weight-bold d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-card-account-details</v-icon>
            Personal Information
          </v-card-title>

          <v-card-text class="pa-4 pt-4">
            <v-form @submit.prevent="saveProfile" v-model="formValid" ref="form">
              <v-row>
                <!-- First Name -->
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">First Name</div>
                  <v-text-field
                    v-model="editForm.first_name"
                    :readonly="!isEditing"
                    :variant="isEditing ? 'outlined' : 'plain'"
                    density="comfortable"
                    hide-details="auto"
                    color="primary"
                    :bg-color="isEditing ? 'surface' : 'transparent'"
                    :class="{'focused-input': isEditing}"
                    placeholder="Enter first name"
                    :rules="[v => !!v || 'First name is required']"
                  ></v-text-field>
                </v-col>

                <!-- Last Name -->
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">Last Name</div>
                  <v-text-field
                    v-model="editForm.last_name"
                    :readonly="!isEditing"
                    :variant="isEditing ? 'outlined' : 'plain'"
                    density="comfortable"
                    hide-details="auto"
                    color="primary"
                    :bg-color="isEditing ? 'surface' : 'transparent'"
                    :class="{'focused-input': isEditing}"
                    placeholder="Enter last name"
                    :rules="[v => !!v || 'Last name is required']"
                  ></v-text-field>
                </v-col>

                <!-- Phone -->
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">Phone Number</div>
                  <v-text-field
                    v-model="editForm.phone"
                    :readonly="!isEditing"
                    :variant="isEditing ? 'outlined' : 'plain'"
                    density="comfortable"
                    hide-details="auto"
                    color="primary"
                    :bg-color="isEditing ? 'surface' : 'transparent'"
                    :class="{'focused-input': isEditing}"
                    placeholder="Enter phone number"
                    prepend-inner-icon="mdi-phone-outline"
                  ></v-text-field>
                </v-col>

                <!-- Address -->
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">Emergency Contact / Address</div>
                  <v-text-field
                    v-model="editForm.address"
                    :readonly="!isEditing"
                    :variant="isEditing ? 'outlined' : 'plain'"
                    density="comfortable"
                    hide-details="auto"
                    color="primary"
                    :bg-color="isEditing ? 'surface' : 'transparent'"
                    :class="{'focused-input': isEditing}"
                    placeholder="Enter address"
                    prepend-inner-icon="mdi-map-marker-outline"
                  ></v-text-field>
                </v-col>

                <!-- Profile URL (Only in edit mode) -->
                 <v-col cols="12" v-if="isEditing">
                  <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">Profile Image URL</div>
                  <v-text-field
                    v-model="editForm.profile_image_url"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    color="primary"
                    bg-color="surface"
                    class="focused-input"
                    placeholder="https://example.com/image.jpg"
                    prepend-inner-icon="mdi-link-variant"
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Edit Mode Actions -->
              <v-expand-transition>
                <div v-if="isEditing" class="d-flex justify-end mt-6 pt-4 border-t">
                  <v-btn
                    variant="tonal"
                    color="medium-emphasis"
                    class="mr-3 text-none px-6 rounded-lg"
                    @click="cancelEditing"
                    :disabled="saving"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    class="text-none px-6 font-weight-bold rounded-lg"
                    type="submit"
                    :loading="saving"
                    prepend-icon="mdi-content-save"
                  >
                    Save Changes
                  </v-btn>
                </div>
              </v-expand-transition>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error State (Not Found) -->
    <v-row v-else-if="!loading && !employeeData" justify="center" align="center" style="min-height: 400px">
      <v-col cols="12" md="6" class="text-center">
        <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-account-off</v-icon>
        <h2 class="text-h5 font-weight-bold mb-2">Profile Not Found</h2>
        <p class="text-medium-emphasis mb-6">Could not locate employee record linked to your account.</p>
        <v-btn color="primary" variant="tonal" to="/dashboard">Return to Dashboard</v-btn>
      </v-col>
    </v-row>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top" rounded="pill">
      <div class="d-flex align-center">
        <v-icon :icon="snackbar.icon" class="mr-2"></v-icon>
        <span class="font-weight-medium">{{ snackbar.text }}</span>
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import { storeToRefs } from 'pinia';
import dayjs from 'dayjs';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const loading = ref(true);
const saving = ref(false);
const isEditing = ref(false);
const employeeData = ref(null);
const formValid = ref(true);

const editForm = ref({
  first_name: '',
  last_name: '',
  phone: '',
  address: '',
  profile_image_url: ''
});

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
  icon: 'mdi-check-circle'
});

const showSnackbar = (text, type = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color: type,
    icon: type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'
  };
};

const initials = computed(() => {
  if (!employeeData.value) return 'U';
  const f = employeeData.value.first_name?.charAt(0) || '';
  const l = employeeData.value.last_name?.charAt(0) || '';
  return `${f}${l}`.toUpperCase();
});

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('MMMM D, YYYY');
};

const fetchProfile = async () => {
  loading.value = true;
  try {
    if (user.value?.id) {
      const data = await api.fetchEmployeeByUserId(user.value.id);
      if (data) {
        employeeData.value = data;
        syncForm(data);
      }
    }
  } catch (error) {
    console.error("Failed to load profile", error);
    showSnackbar('Failed to load profile data', 'error');
  } finally {
    loading.value = false;
  }
};

const syncForm = (data) => {
  editForm.value = {
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    phone: data.phone || '',
    address: data.address || '',
    profile_image_url: data.profile_image_url || ''
  };
};

const startEditing = () => {
  syncForm(employeeData.value);
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  syncForm(employeeData.value);
};

const saveProfile = async () => {
  if (!formValid.value) return;

  saving.value = true;
  try {
    const updatedData = await api.updateEmployee(employeeData.value.id, {
      first_name: editForm.value.first_name,
      last_name: editForm.value.last_name,
      phone: editForm.value.phone,
      address: editForm.value.address,
      profile_image_url: editForm.value.profile_image_url
    });

    if (updatedData) {
      // Re-fetch to get updated relationships/formatting if backend did triggers
      await fetchProfile();
      isEditing.value = false;
      showSnackbar('Profile updated successfully!', 'success');
    }
  } catch (error) {
    console.error("Update failed", error);
    showSnackbar('Failed to update profile', 'error');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.premium-card {
  background: var(--v-surface-base);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.3s ease;
}

.v-theme--dark .premium-card {
  background: rgba(30,30,30, 0.4);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2) !important;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  border: 2px solid var(--v-surface-base);
}

.focused-input :deep(.v-field) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.focused-input :deep(.v-field:hover) {
  background: rgba(var(--v-theme-primary), 0.03);
}

.focused-input :deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
  background: transparent;
}

/* Make plaintext readonly inputs look like normal text layout */
.v-text-field--variant-plain :deep(.v-field__input) {
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 1.05rem;
  font-weight: 500;
  opacity: 1 !important;
}
.v-text-field--variant-plain :deep(input[readonly]) {
  cursor: default;
}

.gap-2 {
  gap: 8px;
}
</style>