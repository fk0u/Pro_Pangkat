import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from '@/hooks/use-toast'

interface RealtimeConfig<T = unknown> {
  endpoint: string
  interval?: number
  enableNotifications?: boolean
  autoRefresh?: boolean
  onDataUpdate?: (data: T) => void
  onError?: (error: Error) => void
}

interface RealtimeHookReturn<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  lastUpdate: Date | null
  isConnected: boolean
  refresh: () => Promise<void>
  pause: () => void
  resume: () => void
  updateConfig: (newConfig: Partial<RealtimeConfig<T>>) => void
}

interface DashboardData {
  urgentProposals?: Array<{ id: string }>
  [key: string]: unknown
}

interface NotificationData {
  notifications: Array<{ id: string; title: string; isRead: boolean }>
  summary: { unread: number }
}

interface ProposalData {
  proposals: Array<{
    id: string
    createdAt: string
    documentProgress: { pending: number }
  }>
}

// Type guard functions
function isDashboardData(data: unknown): data is DashboardData {
  return typeof data === 'object' && data !== null && 'urgentProposals' in data
}

function isNotificationData(data: unknown): data is NotificationData {
  return typeof data === 'object' && data !== null && 'notifications' in data && 'summary' in data
}

function isProposalData(data: unknown): data is ProposalData {
  return typeof data === 'object' && data !== null && 'proposals' in data
}

export function useRealtime<T = unknown>(
  initialConfig: RealtimeConfig<T>
): RealtimeHookReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [config, setConfig] = useState(initialConfig)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(config.endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setError(null)
        setLastUpdate(new Date())
        setIsConnected(true)
        retryCountRef.current = 0

        // Call update callback if provided
        if (config.onDataUpdate) {
          config.onDataUpdate(result.data)
        }

        // Show notification for important updates if enabled
        if (config.enableNotifications && isDashboardData(result.data) && result.data.urgentProposals?.length > 0) {
          const urgentCount = result.data.urgentProposals.length
          toast({
            title: "Update Realtime",
            description: `${urgentCount} usulan memerlukan perhatian segera`,
            variant: urgentCount > 5 ? "destructive" : "default",
          })
        }
      } else {
        throw new Error(result.message || 'Failed to fetch data')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled, don't treat as error
      }

      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      setIsConnected(false)
      retryCountRef.current++

      // Call error callback if provided
      if (config.onError) {
        config.onError(error)
      }

      // Show error toast only after max retries
      if (retryCountRef.current >= maxRetries) {
        toast({
          title: "Koneksi Bermasalah",
          description: "Gagal memuat data realtime. Silakan refresh halaman.",
          variant: "destructive",
        })
      }

      console.error('Realtime data fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [config])

  const startPolling = useCallback(() => {
    if (isPaused || !config.autoRefresh) return

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    // Initial fetch
    fetchData(abortControllerRef.current.signal)

    // Set up polling interval
    const interval = config.interval || 30000 // Default 30 seconds
    intervalRef.current = setInterval(() => {
      if (!isPaused && config.autoRefresh) {
        // Create new abort controller for each request
        abortControllerRef.current = new AbortController()
        fetchData(abortControllerRef.current.signal)
      }
    }, interval)
  }, [fetchData, isPaused, config.autoRefresh, config.interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsConnected(false)
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    // Cancel current request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    await fetchData(abortControllerRef.current.signal)
  }, [fetchData])

  const pause = useCallback(() => {
    setIsPaused(true)
    stopPolling()
  }, [stopPolling])

  const resume = useCallback(() => {
    setIsPaused(false)
    if (config.autoRefresh) {
      startPolling()
    }
  }, [config.autoRefresh, startPolling])

  const updateConfig = useCallback((newConfig: Partial<RealtimeConfig<T>>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Effect to start/stop polling based on config changes
  useEffect(() => {
    if (config.autoRefresh && !isPaused) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [config.autoRefresh, config.interval, startPolling, stopPolling, isPaused])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  // Handle visibility change to pause/resume when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause()
      } else if (config.autoRefresh) {
        resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [config.autoRefresh, pause, resume])

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    isConnected,
    refresh,
    pause,
    resume,
    updateConfig,
  }
}

// Specialized hook for operator dashboard realtime data
export function useOperatorRealtimeData() {
  return useRealtime<DashboardData>({
    endpoint: '/api/operator/realtime-stats',
    interval: 30000, // 30 seconds
    enableNotifications: true,
    autoRefresh: true,
  })
}

// Specialized hook for notifications
export function useRealtimeNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)

  const { data, ...rest } = useRealtime<NotificationData>({
    endpoint: '/api/operator/notifications?unreadOnly=true',
    interval: 15000, // 15 seconds for notifications
    enableNotifications: false, // Don't show toast for notification updates
    autoRefresh: true,
    onDataUpdate: (data) => {
      if (isNotificationData(data) && data.summary?.unread !== undefined) {
        setUnreadCount(data.summary.unread)
      }
    }
  })

  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      const response = await fetch('/api/operator/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          markAllAsRead: !notificationId
        })
      })

      if (response.ok) {
        // Refresh notifications after marking as read
        rest.refresh()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [rest])

  return {
    notifications: data?.notifications || [],
    unreadCount,
    markAsRead,
    ...rest
  }
}

// Hook for real-time proposal inbox updates
export function useRealtimeInbox() {
  return useRealtime<ProposalData>({
    endpoint: '/api/operator/inbox',
    interval: 20000, // 20 seconds
    enableNotifications: true,
    autoRefresh: true,
    onDataUpdate: (data) => {
      // Check for new urgent proposals
      if (isProposalData(data)) {
        const urgentProposals = data.proposals?.filter(p => 
          p.documentProgress?.pending > 0 && 
          Math.floor((new Date().getTime() - new Date(p.createdAt).getTime()) / (24 * 60 * 60 * 1000)) > 3
        ) || []

        if (urgentProposals.length > 0) {
          toast({
            title: "Usulan Mendesak",
            description: `${urgentProposals.length} usulan memerlukan verifikasi segera`,
            variant: "destructive",
          })
        }
      }
    }
  })
}
