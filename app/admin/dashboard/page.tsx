"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, CheckCircle, AlertTriangle, Users, Bell, Settings, BarChart3, Calendar, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import type { DashboardStats } from "@/lib/types"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    fetchDashboardStats()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUserData(data.data)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/statistics/dashboard")
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat statistik dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) {
    return (
      <DashboardLayout userType="admin">
        <div className="text-center py-8">
          <p className="text-gray-500">Gagal memuat data statistik</p>
          <Button onClick={fetchDashboardStats} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const statsCards = [
    {
      title: "Total Usulan",
      value: stats.overview.totalProposals.toString(),
      description: `+${stats.overview.submittedProposals} dari bulan lalu`,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      trend: `+${Math.round((stats.overview.submittedProposals / Math.max(stats.overview.totalProposals, 1)) * 100)}%`,
    },
    {
      title: "Perlu Verifikasi",
      value: stats.overview.processingProposals.toString(),
      description: "Butuh perhatian",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      trend: "Urgent",
    },
    {
      title: "Total Pengguna",
      value: stats.overview.totalUsers.toString(),
      description: "Pengguna aktif",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      trend: "+5%",
    },
    {
      title: "Disetujui",
      value: stats.overview.completedProposals.toString(),
      description: "Berhasil diproses",
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      trend: `+${Math.round((stats.overview.completedProposals / Math.max(stats.overview.totalProposals, 1)) * 100)}%`,
    },
  ]

  const pendingNotifications = [
    {
      title: `${stats.overview.processingProposals} usulan perlu verifikasi`,
      description: "Menunggu tindakan operator",
      action: "Lihat",
      type: "urgent",
      time: "Sekarang",
    },
    {
      title: "Timeline akan berakhir",
      description: "12 hari tersisa untuk pengusulan",
      action: "Perpanjang",
      type: "warning",
      time: "2 jam lalu",
    },
    {
      title: "Backup otomatis berhasil",
      description: "Terakhir: 08 Jan 2025, 02:00",
      action: "Detail",
      type: "success",
      time: "6 jam lalu",
    },
  ]

  const systemHealth = [
    { metric: "Server Performance", value: 98, status: "excellent" },
    { metric: "Database Health", value: 95, status: "good" },
    { metric: "API Response Time", value: 87, status: "good" },
    { metric: "User Satisfaction", value: 92, status: "excellent" },
  ]

  const getHealthColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "warning":
        return "text-orange-600"
      default:
        return "text-red-600"
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Dashboard Administrator - {userData?.user?.name || "Loading..."}
            </h1>
            <p className="text-purple-100 mb-4">Ringkasan sistem ProPangkat</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-purple-200 mr-3" />
                  <div>
                    <p className="text-purple-100 text-sm">Sistem Status</p>
                    <p className="text-white font-semibold">Optimal</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-200 mr-3" />
                  <div>
                    <p className="text-purple-100 text-sm">Active Users</p>
                    <p className="text-white font-semibold">{stats?.overview.totalUsers || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-purple-200 mr-3" />
                  <div>
                    <p className="text-purple-100 text-sm">Timeline Active</p>
                    <p className="text-white font-semibold">Agustus 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 break-words">{stat.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 break-words">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Distribusi Status Usulan
                </CardTitle>
                <CardDescription>Persentase usulan berdasarkan status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.statusDistribution.map((item, index) => (
                  <motion.div
                    key={item.status}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.status}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.count} usulan</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={item.percentage} className="flex-1 h-2" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10">
                        {item.percentage}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-orange-600" />
                  Aktivitas Terbaru
                </CardTitle>
                <CardDescription>Aktivitas sistem terbaru</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.recentActivities.slice(0, 5).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + index * 0.1, duration: 0.4 }}
                    className="flex items-start justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{activity.action}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{activity.details}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {activity.userName} • {new Date(activity.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.userRole}
                    </Badge>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-green-600" />
                System Health Monitor
              </CardTitle>
              <CardDescription>Status kesehatan sistem secara real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemHealth.map((metric, index) => (
                  <motion.div
                    key={metric.metric}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 + index * 0.1, duration: 0.4 }}
                    className="text-center space-y-2"
                  >
                    <div className="relative w-20 h-20 mx-auto">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200 dark:text-gray-700"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={getHealthColor(metric.status)}
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${metric.value}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-bold ${getHealthColor(metric.status)}`}>{metric.value}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{metric.metric}</p>
                      <Badge variant={metric.status === "excellent" ? "default" : "secondary"} className="text-xs mt-1">
                        {metric.status === "excellent" ? "Excellent" : "Good"}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Aksi cepat untuk administrasi sistem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { title: "Kelola Pengguna", icon: Users, href: "/admin/users" },
                  { title: "Timeline KAPE", icon: Calendar, href: "/admin/timeline" },
                  { title: "Inbox Usulan", icon: FileText, href: "/admin/inbox" },
                  { title: "Laporan", icon: BarChart3, href: "/admin/reports" },
                  { title: "Notifikasi", icon: Bell, href: "/admin/notifications" },
                  { title: "Pengaturan", icon: Settings, href: "/admin/settings" },
                ].map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.8 + index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-20 flex-col space-y-2 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
                      onClick={() => (window.location.href = action.href)}
                    >
                      <action.icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{action.title}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
