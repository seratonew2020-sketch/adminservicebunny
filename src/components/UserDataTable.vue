<template>
    <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        :items-per-page="5"
        class="elevation-1"
    >
        <template v-slot:["item.actions"]="{ item }">
            <v-icon small @click="editItem(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
        </template>
    </v-data-table>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/useUserStore'

const { users, loading, fetchUsers } = useUserStore()

const headers = [
    { title: 'ID', key: 'id' },
    { title: 'Employee Code', key: 'employee_code' },
    { title: 'Full Name', key: 'full_name' },
    { title: 'Department', key: 'department' },
    { title: 'Actions', key: 'actions' }
]

fetchUsers()

function editItem(item) {
    console.log('Edit', item)
}

function deleteItem(item) {
    console.log('Delete', item)
}
</script>