"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { DashboardSkeleton } from "@/components/loading-skeleton"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  LogOut, User, FileText, RefreshCw, Clock, CheckCircle, 
  XCircle, Bell, Calendar, Activity, BarChart, Users, Building
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/date-utils"

// Define dashboard data types
interface UserProfile {
  id: string;
  name: string;
  nip: string;
  role: string;
  unitKerja?: string;
  wilayah?: string;
}

interface GeneralStats {
  totalProposals: number;
  pendingDocuments: number;
  activeTimelines: number;
}

interface Timeline {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  priority: number;
  jabatanType: string;
}

interface Activity {
  id: string;
  action: string;
  details: Record<string, unknown>;
  userName: string;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

interface EmployeeStats {
  totalProposals: number;
  pendingProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  latestProposal?: {
    id: string;
    periode: string;
    status: string;
    createdAt: string;
    documentCount: number;
  };
}

interface OperatorStats {
  totalProposals: number;
  pendingProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  employeesCount: number;
  unitKerjaCount: number;
  pendingReviews: {
    id: string;
    periode: string;
    status: string;
    employeeName: string;
    employeeNip: string;
    unitKerja: string;
    createdAt: string;
  }[];
}

interface DashboardData {
  userProfile: UserProfile;
  generalStats: GeneralStats;
  timelines: Timeline[];
  recentActivities: Activity[];
  notifications: Notification[];
  employeeStats?: EmployeeStats;
  operatorStats?: OperatorStats;
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      
      const response = await fetch("/api/dashboard", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache"
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error fetching dashboard data: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setDashboardData(result.data)
        setError(null)
        
        // Show welcome toast only on initial load, not refresh
        if (isLoading) {
          toast({
            title: `Selamat datang, ${result.data.userProfile.name}! 🎉`,
            description: "Anda berhasil masuk ke sistem ProPangkat",
          })
        }
      } else {
        throw new Error(result.message || "Failed to fetch dashboard data")
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat memuat data")
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isLoading, toast])

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Show loading skeleton when data is loading
  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
        {/* Header with user info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {dashboardData?.userProfile?.name.split(' ').map(name => name[0]).join('').substring(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Selamat Datang, {dashboardData?.userProfile?.name || 'Pengguna'}
              </h1>
              <p className="text-muted-foreground">
                {dashboardData?.userProfile?.role || 'Pegawai'} {dashboardData?.userProfile?.unitKerja ? `- ${dashboardData.userProfile.unitKerja}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setIsRefreshing(true)
                fetchDashboardData().finally(() => setIsRefreshing(false))
              }}
              disabled={isRefreshing}
            >
              <Activity className="mr-2 h-4 w-4" />
              {isRefreshing ? 'Memperbarui...' : 'Perbarui Data'}
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Usulan
                  </p>
                  <h3 className="text-2xl font-bold">
                    {dashboardData?.generalStats?.totalProposals || 0}
                  </h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Dokumen Menunggu
                  </p>
                  <h3 className="text-2xl font-bold">
                    {dashboardData?.generalStats?.pendingDocuments || 0}
                  </h3>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {dashboardData?.userProfile?.role === 'PEGAWAI' ? 'Usulan Disetujui' : 'Total Unit Kerja'}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {dashboardData?.userProfile?.role === 'PEGAWAI' 
                      ? dashboardData?.employeeStats?.approvedProposals || 0
                      : dashboardData?.operatorStats?.unitKerjaCount || 0}
                  </h3>
                </div>
                <div className="p-2 bg-green-500/10 rounded-full">
                  {dashboardData?.userProfile?.role === 'PEGAWAI' 
                    ? <CheckCircle className="h-5 w-5 text-green-500" />
                    : <Building className="h-5 w-5 text-green-500" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {dashboardData?.userProfile?.role === 'PEGAWAI' ? 'Usulan Ditolak' : 'Total Pegawai'}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {dashboardData?.userProfile?.role === 'PEGAWAI' 
                      ? dashboardData?.employeeStats?.rejectedProposals || 0
                      : dashboardData?.operatorStats?.employeesCount || 0}
                  </h3>
                </div>
                <div className="p-2 bg-red-500/10 rounded-full">
                  {dashboardData?.userProfile?.role === 'PEGAWAI' 
                    ? <XCircle className="h-5 w-5 text-red-500" />
                    : <Users className="h-5 w-5 text-blue-500" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent activities */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
                    dashboardData.recentActivities.map((activity, idx) => (
                      <div key={activity.id} className={`flex items-start space-x-4 p-4 ${idx !== dashboardData.recentActivities.length - 1 ? 'border-b' : ''}`}>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{activity.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.userName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.action}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(activity.createdAt))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      Tidak ada aktivitas terbaru
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications/Timeline */}
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Jadwal & Notifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.timelines && dashboardData.timelines.length > 0 ? (
                    dashboardData.timelines.map((timeline) => (
                      <div key={timeline.id} className="relative pl-6 pb-4 border-l border-muted">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-muted-foreground"></div>
                        <h4 className="text-sm font-semibold">{timeline.title}</h4>
                        {timeline.description && (
                          <p className="text-xs text-muted-foreground mt-1">{timeline.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {new Date(timeline.startDate).toLocaleDateString('id-ID')} - {new Date(timeline.endDate).toLocaleDateString('id-ID')}
                          </Badge>
                          <Badge variant={timeline.priority === 1 ? "destructive" : timeline.priority === 2 ? "default" : "secondary"} className="text-xs">
                            {timeline.priority === 1 ? 'Penting' : timeline.priority === 2 ? 'Normal' : 'Info'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Tidak ada jadwal atau notifikasi
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const stats = [
    { title: "Total Usulan", value: "156", color: "bg-blue-500" },
    { title: "Disetujui", value: "89", color: "bg-green-500" },
    { title: "Pending", value: "45", color: "bg-blue-600" },
    { title: "Ditolak", value: "22", color: "bg-blue-700" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <DashboardSidebar />

      {/* Main Content */}
      <div className="ml-28 transition-all duration-300">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4"
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Image
                src="/images/kaltim-logo.png"
                alt="Kalimantan Timur Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-full px-4 py-2">
                <Avatar className="h-10 w-10 bg-gray-800 dark:bg-gray-600">
                  <AvatarFallback className="text-white font-semibold">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Dr. Ahmad Wijaya, S.Pd</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">198501012010011001 • Dinas Pendidikan</p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Main Dashboard Content */}
        <main className="p-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Selamat Datang, Dr. Ahmad Wijaya, S.Pd
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Dashboard Kenaikan pangkat periode Agustus 2025</p>

            {/* Success Alert */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    Selamat! Anda dapat mengajukan Kenaikan Pangkat Periode Agustus 2025
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`${stat.color} h-32 flex items-center justify-center text-white`}>
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        <div className="text-sm opacity-90">{stat.title}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Content Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Area */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}>
              <Card className="h-80">
                <CardContent className="p-6 flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-lg font-medium mb-2">Grafik Statistik</div>
                    <p className="text-sm">Area untuk menampilkan grafik kenaikan pangkat</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Area */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>
              <Card className="h-80">
                <CardContent className="p-6 flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-lg font-medium mb-2">Aktivitas Terbaru</div>
                    <p className="text-sm">Area untuk menampilkan aktivitas dan notifikasi</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="mt-6"
          >
            <Card className="h-64">
              <CardContent className="p-6 flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-lg font-medium mb-2">Area Konten Tambahan</div>
                  <p className="text-sm">Area untuk menampilkan informasi dan fitur tambahan</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
