<script setup>
import { onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const store = useNotificationStore()
const router = useRouter()

onMounted(() => {
  store.loadNotifications()
  store.subscribeToNotifications()
})

const handleClick = (notification) => {
  store.markRead(notification.id)
  if (notification.link) {
    router.push(notification.link)
  }
}
</script>

<template>
  <v-menu location="bottom end" :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="mr-2">
        <v-badge
          :content="store.unreadCount"
          :model-value="store.unreadCount > 0"
          color="error"
          floating
        >
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card min-width="350" max-width="400" max-height="500" class="d-flex flex-column">
      <v-card-title class="d-flex justify-space-between align-center py-3 px-4 bg-grey-lighten-4">
        <span class="text-subtitle-1 font-weight-bold">Notifications</span>
        <v-chip size="x-small" v-if="store.unreadCount > 0" color="primary">
          {{ store.unreadCount }} New
        </v-chip>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-list class="flex-grow-1 overflow-y-auto py-0" lines="three">
        <template v-if="store.notifications.length > 0">
          <v-list-item
            v-for="item in store.notifications"
            :key="item.id"
            :value="item"
            @click="handleClick(item)"
            :class="{'bg-blue-lighten-5': !item.is_read}"
            class="border-b"
          >
            <template v-slot:prepend>
              <v-avatar :color="item.type === 'error' ? 'red-lighten-4' : 'blue-lighten-4'" size="32">
                <v-icon size="16" :color="item.type === 'error' ? 'error' : 'primary'">
                  {{ item.type === 'error' ? 'mdi-alert-circle' : 'mdi-information' }}
                </v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="text-body-2 font-weight-bold mb-1">
              {{ item.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption text-medium-emphasis mb-1">
              {{ item.message }}
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <div class="d-flex flex-column align-end justify-start h-100 mt-1">
                <span class="text-caption text-grey">{{ dayjs(item.created_at).fromNow() }}</span>
                <v-icon v-if="!item.is_read" icon="mdi-circle-medium" color="primary" size="small"></v-icon>
              </div>
            </template>
          </v-list-item>
        </template>
        
        <v-list-item v-else class="pa-8 text-center">
          <v-icon icon="mdi-bell-sleep-outline" size="48" color="grey-lighten-2" class="mb-2"></v-icon>
          <div class="text-body-2 text-medium-emphasis">No notifications yet</div>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>
