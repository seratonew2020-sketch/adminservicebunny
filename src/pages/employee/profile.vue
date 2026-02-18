<script setup>
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { employee, user } = storeToRefs(authStore)
</script>

<template>
  <v-container class="pa-6">
    <h1 class="text-h4 font-weight-bold mb-6">My Profile</h1>

    <v-row v-if="employee">
      <v-col cols="12" md="4">
        <v-card class="text-center pa-6">
          <v-avatar size="120" color="grey-lighten-2" class="mb-4">
            <v-img v-if="employee.profile_image_url" :src="employee.profile_image_url" cover></v-img>
            <v-icon v-else icon="mdi-account" size="60"></v-icon>
          </v-avatar>
          <h2 class="text-h5 font-weight-bold">{{ employee.first_name }} {{ employee.last_name }}</h2>
          <p class="text-medium-emphasis">{{ employee.email || user.email }}</p>
          <v-chip class="mt-2" color="primary" size="small">{{ employee.role }}</v-chip>

          <v-btn block variant="outlined" color="primary" class="mt-6" to="/employee/edit-profile">
            Edit Profile
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card title="Personal Information">
          <v-list lines="two">
            <v-list-item title="Employee ID" :subtitle="employee.employee_id || employee.employee_code || '-'"></v-list-item>
            <v-list-item title="Phone" :subtitle="employee.phone || '-'"></v-list-item>
            <v-list-item title="Address" :subtitle="employee.address || '-'"></v-list-item>
            <v-list-item title="Department" :subtitle="employee.departments?.name || employee.dept_id || '-'"></v-list-item>
            <v-list-item title="Position" :subtitle="employee.positions?.title || employee.pos_id || '-'"></v-list-item>
            <v-list-item title="Join Date" :subtitle="employee.join_date || '-'"></v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    <v-alert v-else type="info" text="Loading profile..."></v-alert>
  </v-container>
</template>