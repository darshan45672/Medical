"use client"

import { toast } from 'sonner'
import { useNotificationStore } from '@/stores/notification-store'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationOptions {
  title: string
  message: string
  type: NotificationType
  persistent?: boolean
  duration?: number
  priority?: 'low' | 'medium' | 'high'
  category?: 'claim' | 'payment' | 'document' | 'system' | 'general'
}

export const useNotifications = () => {
  const { addNotification } = useNotificationStore()

  const showNotification = ({
    title,
    message,
    type = 'info',
    persistent = false,
    duration,
    priority = 'medium',
    category = 'general'
  }: NotificationOptions) => {
    // Show toast notification
    const getToastIcon = (type: NotificationType) => {
      switch (type) {
        case 'success':
          return '✅'
        case 'error':
          return '❌'
        case 'warning':
          return '⚠️'
        case 'info':
        default:
          return 'ℹ️'
      }
    }

    const toastOptions = {
      icon: getToastIcon(type),
      duration: duration || (type === 'error' ? 6000 : 4000),
      description: message,
    }

    switch (type) {
      case 'success':
        toast.success(title, toastOptions)
        break
      case 'error':
        toast.error(title, toastOptions)
        break
      case 'warning':
        toast.warning(title, toastOptions)
        break
      case 'info':
      default:
        toast.info(title, toastOptions)
        break
    }

    // Add to persistent storage if requested or if it's high priority
    if (persistent || priority === 'high') {
      addNotification({
        title,
        message,
        type,
        priority,
        category
      })
    }
  }

  // Convenience methods
  const success = (title: string, message: string, options?: Partial<NotificationOptions>) =>
    showNotification({ title, message, type: 'success', ...options })

  const error = (title: string, message: string, options?: Partial<NotificationOptions>) =>
    showNotification({ title, message, type: 'error', persistent: true, ...options })

  const warning = (title: string, message: string, options?: Partial<NotificationOptions>) =>
    showNotification({ title, message, type: 'warning', ...options })

  const info = (title: string, message: string, options?: Partial<NotificationOptions>) =>
    showNotification({ title, message, type: 'info', ...options })

  return {
    showNotification,
    success,
    error,
    warning,
    info
  }
}
