"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, 
  RefreshCw, Wifi, WifiOff, Bell, BellOff, Activity
} from "lucide-react"
import { useOperatorRealtimeData, useRealtimeNotifications } from "@/hooks/use-realtime"
import { toast } from "@/hooks/use-toast"

interface RealtimeDashboardProps {
  className?: string
}

export function RealtimeDashboard({ className }: RealtimeDashboardProps) {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  
  // Real-time data hooks
  const {
    data: dashboardData,
    isLoading,
    error,
    lastUpdate,
    isConnected,
    refresh,
    pause,
    resume,
    updateConfig
  } = useOperatorRealtimeData()

  const {
    notifications,
    unreadCount,
    markAsRead,
    isConnected: notificationConnected
  } = useRealtimeNotifications()

  // Handle auto-refresh toggle
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled)
    if (autoRefreshEnabled) {
      pause()
    } else {
      resume()
    }
  }

  // Handle notifications toggle
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
    updateConfig({ enableNotifications: !notificationsEnabled })
  }

  // Manual refresh
  const handleManualRefresh = async () => {
    await refresh()
    toast({
      title: "Data Diperbarui",
      description: "Dashboard telah diperbarui dengan data terbaru",
      variant: "default",
    })
  }

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">Terhubung</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">Terputus</span>
        </>
      )}
    </div>
  )

  // Last update timestamp
  const LastUpdateTime = () => (
    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
      <Clock className="h-4 w-4" />
      <span>
        {lastUpdate 
          ? `Diperbarui ${new Date(lastUpdate).toLocaleTimeString('id-ID')}`
          : 'Belum ada update'
        }
      </span>
    </div>
  )

  // Real-time statistics cards
  const StatsCards = () => {
    if (!dashboardData?.stats) return null

    const stats = [
      {
        title: "Total Usulan",
        value: dashboardData.stats.proposals?.total || 0,
        change: `+${dashboardData.stats.proposals?.today || 0} hari ini`,
        icon: FileText,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        trend: dashboardData.stats.proposals?.thisWeek > dashboardData.stats.proposals?.total * 0.1
      },
      {
        title: "Mendesak",
        value: dashboardData.stats.proposals?.urgent || 0,
        change: "Perlu segera ditangani",
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        trend: false
      },
      {
        title: "Sedang Diproses", 
        value: dashboardData.stats.proposals?.processing || 0,
        change: "Dalam verifikasi",
        icon: Clock,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        trend: true
      },
      {
        title: "Selesai Hari Ini",
        value: dashboardData.stats.performance?.dailyProcessed || 0,
        change: `Efisiensi: ${dashboardData.stats.performance?.operatorEfficiency || 0}%`,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        trend: true
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.trend ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {stat.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    )
  }

  // Real-time performance metrics
  const PerformanceMetrics = () => {
    if (!dashboardData?.stats?.performance) return null

    const performance = dashboardData.stats.performance

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Kinerja Realtime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rata-rata Pemrosesan</span>
                <span className="text-sm font-bold">{performance.avgProcessingDays || 0} hari</span>
              </div>
              <Progress 
                value={Math.min((performance.avgProcessingDays || 0) / 14 * 100, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tingkat Penyelesaian</span>
                <span className="text-sm font-bold">{performance.completionRate || 0}%</span>
              </div>
              <Progress 
                value={performance.completionRate || 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tingkat Verifikasi Dokumen</span>
                <span className="text-sm font-bold">
                  {dashboardData.stats.documents?.verificationRate || 0}%
                </span>
              </div>
              <Progress 
                value={dashboardData.stats.documents?.verificationRate || 0} 
                className="h-2"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {dashboardData.stats.regional?.pegawaiCount || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Pegawai</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {dashboardData.stats.regional?.unitKerjaCount || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Unit Kerja</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Real-time notifications panel
  const NotificationsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-600" />
            Notifikasi Realtime
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {notificationConnected ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  notification.isRead
                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message || 'No message'}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs"
                    >
                      Tandai Dibaca
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Tidak ada notifikasi</p>
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => markAsRead()}
            >
              Tandai Semua Dibaca
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Error loading realtime data</span>
          </div>
          <p className="text-sm text-red-600 mt-2">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleManualRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Control Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              <LastUpdateTime />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleNotifications}
                className={notificationsEnabled ? "bg-blue-100 dark:bg-blue-900/20" : ""}
              >
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4 mr-2" />
                ) : (
                  <BellOff className="h-4 w-4 mr-2" />
                )}
                Notifikasi
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoRefresh}
                className={autoRefreshEnabled ? "bg-green-100 dark:bg-green-900/20" : ""}
              >
                <Activity className="h-4 w-4 mr-2" />
                Auto Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <StatsCards />

      {/* Performance and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceMetrics />
        <NotificationsPanel />
      </div>
    </div>
  )
}
