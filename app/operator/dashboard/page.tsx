"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Clock, CheckCircle, AlertTriangle, Users, Eye, TrendingUp, Upload, Calendar, BarChart3, RotateCcw } from "lucide-react"
import Link from "next/link"
import { formatWilayahForDisplay } from "@/lib/wilayah-utils"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface UserData {
  user: {
    id: string
    nip: string
    name: string
    email: string
    role: string
    wilayah: string
  }
}

interface DashboardData {
  overview: {
    totalProposals: number
    perluVerifikasi: number
    sedangDiproses: number
    dikirimBKN: number
    selesai: number
    ditolak: number
    dikembalikan: number
    documents: {
      total: number
      menungguVerifikasi: number
      disetujui: number
      dikembalikan: number
      ditolak: number
    }
    avgProcessingTime: number
    completionRate: number
  }
  urgentProposals: Array<{
    id: string
    periode: string
    pegawai: {
      name: string
      nip: string
      unitKerja: string
      jabatan: string
      golongan: string
    }
    status: string
    documentProgress: string
    pendingDocuments: number
    daysRemaining: number
    urgencyLevel: "critical" | "urgent" | "warning" | "normal"
    createdAt: string
    lastActivity: string
  }>
  statusDistribution: Array<{
    status: string
    statusKey: string
    count: number
    percentage: number
    color: string
  }>
  jabatanDistribution: Record<string, number>
  monthlyTrend: Array<{
    status: string
    count: number
  }>
  timelineInfo: {
    current: {
      title: string
      endDate: string
      daysRemaining: number
      priority: number
      jabatanType: string
    } | null
    upcoming: Array<{
      title: string
      startDate: string
      jabatanType: string
      priority: number
    }>
  }
  recentActivities: Array<{
    id: string
    action: string
    details: any
    user: string
    createdAt: string
  }>
  region: string
  metadata: {
    lastUpdated: string
    totalActiveTimelines: number
    operatorName: string
  }
}

export default function OperatorDashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedUsulan, setSelectedUsulan] = useState<any>(null)

  useEffect(() => {
    fetchUserData()
    fetchDashboardData()
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

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/operator/dashboard")
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.data)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }
  const stats = [
    {
      title: "Total Usulan",
      value: dashboardData?.overview.totalProposals.toString() || "0",
      description: "Usulan yang masuk",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      change: `Total di wilayah ${formatWilayahForDisplay(dashboardData?.region)}`,
    },
    {
      title: "Perlu Verifikasi",
      value: dashboardData?.overview.perluVerifikasi.toString() || "0",
      description: "Butuh perhatian",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      change: "Segera ditangani",
    },
    {
      title: "Sedang Diproses",
      value: dashboardData?.overview.sedangDiproses.toString() || "0",
      description: "Dalam verifikasi",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      change: "Sedang berlangsung",
    },
    {
      title: "Dikirim BKN",
      value: dashboardData?.overview.dikirimBKN.toString() || "0",
      description: "Telah dikirim",
      icon: Upload,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      change: "Menunggu respon",
    },
    {
      title: "Selesai",
      value: dashboardData?.overview.selesai.toString() || "0",
      description: "Berhasil diproses",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      change: "Telah selesai",
    },
  ]

  const handleVerifikasi = () => {
    // In real implementation, this would call an API
    setOpen(false)
    // Refresh data
    fetchDashboardData()
  }

  const handleBatalVerifikasi = () => {
    setSelectedUsulan(null)
    setOpen(false)
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Baru saja"
    if (diffInHours < 24) return `${diffInHours} jam lalu`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} hari lalu`
  }

  if (isLoading) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }


  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Selamat Datang, {userData?.user?.name || "Loading..."}!
            </h1>
            <p className="text-green-100 mb-4">
              Dashboard Operator Wilayah {formatWilayahForDisplay(dashboardData?.region)}
            </p>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-green-200 mr-3" />
                <p className="text-green-100 font-medium">
                  Ada {dashboardData?.overview.perluVerifikasi || 0} usulan yang perlu segera diverifikasi
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 break-words">{stat.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 break-words">{stat.change}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Timeline Information & Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Current Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Timeline Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.timelineInfo?.current ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      {dashboardData.timelineInfo.current.title}
                    </h4>
                    <div className="flex items-center text-sm text-green-700 dark:text-green-300 mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {dashboardData.timelineInfo.current.daysRemaining > 0 
                          ? `${dashboardData.timelineInfo.current.daysRemaining} hari tersisa`
                          : "Timeline berakhir"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Badge 
                        variant={dashboardData.timelineInfo.current.priority >= 3 ? "destructive" : 
                                dashboardData.timelineInfo.current.priority === 2 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        Priority {dashboardData.timelineInfo.current.priority}
                      </Badge>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {dashboardData.timelineInfo.current.jabatanType === "all" ? "Semua Jabatan" : 
                         dashboardData.timelineInfo.current.jabatanType.charAt(0).toUpperCase() + 
                         dashboardData.timelineInfo.current.jabatanType.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  {dashboardData.timelineInfo.upcoming.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Timeline Mendatang:</h5>
                      <div className="space-y-2">
                        {dashboardData.timelineInfo.upcoming.map((timeline, index) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                              {timeline.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Mulai: {new Date(timeline.startDate).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada timeline aktif saat ini</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance & Document Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Statistik Kinerja & Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Document Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData?.overview.documents?.total || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Dokumen</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {dashboardData?.overview.documents?.menungguVerifikasi || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Menunggu Verifikasi</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData?.overview.documents?.disetujui || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Disetujui</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {(dashboardData?.overview.documents?.dikembalikan || 0) + 
                       (dashboardData?.overview.documents?.ditolak || 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Ditolak/Dikembalikan</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rata-rata Pemrosesan</span>
                    <span className="text-sm font-bold text-indigo-600">{dashboardData?.overview.avgProcessingTime || 0} hari</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tingkat Penyelesaian</span>
                    <span className="text-sm font-bold text-emerald-600">{dashboardData?.overview.completionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Operator</span>
                    <span className="text-sm font-bold text-gray-600">{dashboardData?.metadata?.operatorName || "N/A"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Urgent Verification */}
          <motion.div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Usulan Perlu Segera Diverifikasi
                </CardTitle>
                <CardDescription>Usulan yang mendekati batas waktu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.urgentProposals.length ? (
                  dashboardData.urgentProposals.map((usulan, index) => (
                    <motion.div
                      key={usulan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{usulan.pegawai.name}</p>
                          <Badge variant={usulan.urgencyLevel === "urgent" ? "destructive" : "secondary"} className="text-xs">
                            {usulan.daysRemaining} hari
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {usulan.pegawai.nip} • {usulan.pegawai.unitKerja}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-gray-500 mr-2">Dokumen:</span>
                          <span className="text-xs font-medium">{usulan.documentProgress}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUsulan(usulan)
                          setOpen(true)
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Verifikasi
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada usulan yang perlu verifikasi mendesak</p>
                  </div>
                )}
                <Link href="/operator/inbox" className="w-full">
                  <Button className="w-full mt-6" variant="outline">
                    Lihat Semua Usulan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Ringkasan Usulan per Status
                </CardTitle>
                <CardDescription>Distribusi status usulan saat ini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.statusDistribution.map((item, index) => (
                  <motion.div
                    key={item.status}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + index * 0.1, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.status}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.count} usulan</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                Aktivitas Terbaru
              </CardTitle>
              <CardDescription>Aktivitas verifikasi hari ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentActivities.length ? (
                  dashboardData.recentActivities.slice(0, 5).map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 + index * 0.1, duration: 0.4 }}
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.action} - {activity.user}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Aktivitas
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Belum ada aktivitas terbaru</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail Pop-up */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Usulan</DialogTitle>
            </DialogHeader>
            {selectedUsulan && (
              <div className="space-y-2 text-sm">
                <p><strong>Nama:</strong> {selectedUsulan.pegawai?.name || selectedUsulan.nama}</p>
                <p><strong>NIP:</strong> {selectedUsulan.pegawai?.nip || selectedUsulan.nip}</p>
                <p><strong>Unit Kerja:</strong> {selectedUsulan.pegawai?.unitKerja || selectedUsulan.opd}</p>
                <p><strong>Dokumen:</strong> {selectedUsulan.documentProgress || selectedUsulan.dokumen}</p>
                <p><strong>Deadline:</strong> {selectedUsulan.daysRemaining ? `${selectedUsulan.daysRemaining} hari` : selectedUsulan.deadline}</p>
              </div>
            )}
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick= {handleBatalVerifikasi}>
                Batal
              </Button>
              <Button onClick={handleVerifikasi}>
                Verifikasi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
