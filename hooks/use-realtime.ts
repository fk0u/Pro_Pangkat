import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from '@/hooks/use-toast'

interface RealtimeConfig<T = unknown> {
  endpoint: string
  onDataUpdate?: (data: T) => void
  onError?: (error: Error) => void
}

interface RealtimeHookReturn<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  lastUpdate: Date | null
  isConnected: boolean
  updateConfig: (newConfig: Partial<RealtimeConfig<T>>) => void
}

interface NotificationData {
  notifications: Array<{ id: string; title: string; isRead: boolean }>
  summary: { unread: number }
}

function isNotificationData(data: unknown): data is NotificationData {
  return typeof data === 'object' && data !== null && 'notifications' in data && 'summary' in data
}

export function useRealtime<T = unknown>(
  initialConfig: RealtimeConfig<T>
): RealtimeHookReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [config, setConfig] = useState(initialConfig)

  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    wsRef.current = new WebSocket('ws://localhost:8080')

    wsRef.current.onopen = () => {
      setIsConnected(true)
      console.log('WebSocket connected')
    }

    wsRef.current.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data)
        setData(result)
        setLastUpdate(new Date())
        if (config.onDataUpdate) {
          config.onDataUpdate(result)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    wsRef.current.onerror = (event) => {
      const error = new Error('WebSocket error')
      setError(error)
      if (config.onError) {
        config.onError(error)
      }
      console.error('WebSocket error:', event)
    }

    wsRef.current.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
      // Optional: implement reconnection logic here
    }
  }, [config])

  const updateConfig = useCallback((newConfig: Partial<RealtimeConfig<T>>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    isConnected,
    updateConfig,
    // The following functions are no longer needed with WebSockets
    refresh: async () => {},
    pause: () => {},
    resume: () => {},
  }
}

// Specialized hook for notifications
export function useRealtimeNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)

  const { data, ...rest } = useRealtime<NotificationData>({
    endpoint: '/api/notifications?unreadOnly=true', // Endpoint is now for initial data load if needed
    onDataUpdate: (data) => {
      if (isNotificationData(data) && data.summary?.unread !== undefined) {
        setUnreadCount(data.summary.unread)
      }
    }
  })

  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          markAllAsRead: !notificationId
        })
      })

    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  return {
    notifications: data?.notifications || [],
    unreadCount,
    markAsRead,
    ...rest
  }
}

