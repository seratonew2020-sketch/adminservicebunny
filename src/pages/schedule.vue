<script setup>
import { useTheme } from 'vuetify'
import { ref } from 'vue'

const theme = useTheme()
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dates = [23, 24, 25, 26, 27, 28, 29]

const shifts = ref([
  { id: 1, title: 'Morning Shift', time: '09:00 - 17:00', assignee: 'Sarah Jenkins', type: 'Work', color: 'primary', day: 0 },
  { id: 2, title: 'Meeting', time: '10:00 - 11:00', assignee: 'All Team', type: 'Meeting', color: 'purple', day: 0 },
  { id: 3, title: 'Afternoon Shift', time: '13:00 - 21:00', assignee: 'Marcus', type: 'Work', color: 'primary', day: 1 },
  { id: 4, title: 'Client Call', time: '14:00 - 15:00', assignee: 'Sarah', type: 'Meeting', color: 'purple', day: 1 },
  { id: 5, title: 'Morning Shift', time: '09:00 - 17:00', assignee: 'Elena', type: 'Work', color: 'primary', day: 2 },
  { id: 6, title: 'Training', time: '11:00 - 12:30', assignee: 'New Hires', type: 'Training', color: 'orange', day: 3 },
  { id: 7, title: 'Code Review', time: '15:00 - 16:00', assignee: 'Tech Team', type: 'Review', color: 'green', day: 4 },
])

const getShiftsForDay = (dayIndex) => shifts.value.filter(s => s.day === dayIndex)
</script>

<template>
  <v-container fluid class="pa-8">
     <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Schedule</h1>
        <p class="text-medium-emphasis">Weekly team calendar.</p>
      </div>
      <div class="d-flex gap-2">
         <v-btn variant="outlined" rounded="lg">Previous</v-btn>
         <v-btn variant="outlined" rounded="lg">Next</v-btn>
         <v-btn color="primary" rounded="lg" class="ml-2">Add Event</v-btn>
      </div>
    </div>

    <!-- Calendar Mockup -->
    <v-card flat rounded="xl" class="border overflow-hidden" :class="theme.global.current.value.dark ? 'bg-surface-dark' : 'bg-white'">
       <div class="d-flex border-b">
          <div v-for="(day, i) in days" :key="day" class="flex-grow-1 text-center py-4 border-r" :class="{'border-r-0': i === 6}">
             <p class="text-caption text-medium-emphasis text-uppercase font-weight-bold">{{ day }}</p>
             <div class="text-h6 font-weight-bold mt-1" :class="{'text-primary': i === 0}">{{ dates[i] }}</div>
          </div>
       </div>
       <div class="d-flex" style="min-height: 500px;">
          <div v-for="(day, i) in days" :key="`col-${day}`" class="flex-grow-1 border-r pa-2" :class="{'border-r-0': i === 6, 'bg-grey-lighten-5': i >= 5 && !theme.global.current.value.dark}">

             <div v-for="shift in getShiftsForDay(i)" :key="shift.id" class="mb-2">
                <v-card flat rounded="lg" :color="`${shift.color}-lighten-5`" class="pa-3 border-l-4" :style="{ borderLeftColor: `var(--v-theme-${shift.color}) !important` }">
                   <p class="text-caption font-weight-bold" :class="`text-${shift.color}-darken-2`">{{ shift.time }}</p>
                   <p class="text-sm font-weight-bold mt-1" :class="`text-${shift.color}-darken-4`">{{ shift.title }}</p>
                   <div class="d-flex align-center mt-2">
                      <v-avatar size="20" color="surface" class="mr-2">
                         <span class="text-xs">{{ shift.assignee.charAt(0) }}</span>
                      </v-avatar>
                      <span class="text-xs text-medium-emphasis text-truncate">{{ shift.assignee }}</span>
                   </div>
                </v-card>
             </div>

             <div v-if="i === 2" class="d-flex justify-center mt-8 opacity-50">
               <span class="text-caption text-medium-emphasis italic">No events</span>
             </div>

          </div>
       </div>
    </v-card>
  </v-container>
</template>

<style scoped>
.border-l-4 {
  border-left-width: 4px !important;
  border-left-style: solid;
}
</style>
