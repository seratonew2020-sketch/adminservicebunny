import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { fetchNotifications, markNotificationAsRead } from '@/services/api'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const authStore = useAuthStore()

  const loadNotifications = async () => {
    const data = await fetchNotifications()
    notifications.value = data
    updateUnreadCount()
  }

  const updateUnreadCount = () => {
    unreadCount.value = notifications.value.filter(n => !n.is_read).length
  }

  const markRead = async (id) => {
    // Optimistic update
    const notif = notifications.value.find(n => n.id === id)
    if (notif && !notif.is_read) {
      notif.is_read = true
      updateUnreadCount()
      await markNotificationAsRead(id)
    }
  }

  const subscribeToNotifications = () => {
    const userId = authStore.user?.id
    if (!userId) return

    supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          notifications.value.unshift(payload.new)
          updateUnreadCount()
          // Optional: Show toast
        }
      )
      .subscribe()
  }

  return {
    notifications,
    unreadCount,
    loadNotifications,
    markRead,
    subscribeToNotifications
  }
})
