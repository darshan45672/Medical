import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

type Notification = {
  id: string
  title: string
  message: string
  type: NotificationType
  timestamp: string
  read?: boolean
  priority?: 'low' | 'medium' | 'high'
  category?: 'claim' | 'payment' | 'document' | 'system' | 'general'
}

type NotificationState = {
  notifications: Notification[]
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  getUnreadCount: () => number
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (notif) => {
        const newNotification: Notification = {
          ...notif,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications.slice(0, 49)], // Keep max 50 notifications
        }))
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearNotifications: () => set({ notifications: [] }),
      getUnreadCount: () => {
        const state = get()
        return state.notifications.filter((n) => !n.read).length
      },
    }),
    {
      name: 'notification-storage',
    }
  )
)
