import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Notification = {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info'
  timestamp: string
}

type NotificationState = {
  notifications: Notification[]
  addNotification: (notif: Notification) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notif) =>
        set((state) => ({
          notifications: [notif, ...state.notifications],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'notification-storage',
    }
  )
)
