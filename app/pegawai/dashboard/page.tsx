"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { FileText, Clock, CheckCircle, AlertTriangle, Calendar, User, Upload, Eye, XCircle } from "lucide-react"

interface UserData {
  user: {
    id: string
    nip: string
    name: string
    email: string
    role: string
    golongan: string
    jabatan: string
    unitKerja: {
      id: string
      nama: string
      npsn: string
      jenjang: string
      alamat: string
      kecamatan: string
      wilayahId: string
      wilayah: any
      status: string
      kepalaSekolah: string
      telepon: string
      email: string
      website: string
      createdAt: string
      updatedAt: string
    } | string
    wilayah: string
  }
}

interface DashboardData {
  overview: {
    totalProposals: number
    activeProposal: {
      id: string
      periode: string
      status: string
      daysRemaining: number
    } | null
    documentStats: {
      menungguVerifikasi: number
      perluPerbaikan: number
      disetujui: number
      ditolak: number
    }
    daysRemaining: number
  }
  proposals: any[]
  recentActivities: any[]
}

export default function PegawaiDashboardPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [showPendingProposalModal, setShowPendingProposalModal] = useState(false)
  const [pendingProposal, setPendingProposal] = useState<any>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchDashboardData()
    checkPendingProposals()
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
      const response = await fetch("/api/pegawai/dashboard")
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.data)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
      toast({
        title: "Selamat datang! 🎉",
        description: "Anda berhasil masuk ke sistem ProPangkat",
      })
    }
  }

  const checkPendingProposals = async () => {
    try {
      const response = await fetch("/api/pegawai/proposals")
      if (response.ok) {
        const data = await response.json()
        
        // Check for proposals created by operator-sekolah that need employee completion
        const needsAttention = data.proposals?.find((proposal: any) => 
          ['DRAFT'].includes(proposal.status) &&
          proposal.operator && // Created by operator-sekolah
          (!proposal.periode || !proposal.documents || proposal.documents.length === 0)
        )
        
        if (needsAttention) {
          setPendingProposal(needsAttention)
          setShowPendingProposalModal(true)
        }
      }
    } catch (error) {
      console.error("Error checking pending proposals:", error)
    }
  }

  const handleCompleteProposal = () => {
    if (pendingProposal) {
      // Navigate to input usulan with proposal ID
      router.push(`/pegawai/input-usulan?edit=${pendingProposal.id}`)
      setShowPendingProposalModal(false)
      
      toast({
        title: "📝 Silakan Lengkapi Data",
        description: "Harap melengkapi data dan berkas dokumen untuk melanjutkan proses pengajuan usulan kenaikan pangkat.",
        duration: 5000,
      })
    }
  }

  const handleWithdrawProposal = async () => {
    if (!pendingProposal) return

    try {
      setIsWithdrawing(true)
      const response = await fetch(`/api/pegawai/proposals/${pendingProposal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "withdraw",
          notes: "Usulan dibatalkan oleh pegawai"
        })
      })

      if (response.ok) {
        toast({
          title: "✅ Usulan Berhasil Dibatalkan",
          description: "Usulan kenaikan pangkat telah dibatalkan.",
        })
        setShowPendingProposalModal(false)
        setPendingProposal(null)
        // Refresh dashboard data
        fetchDashboardData()
      } else {
        const errorData = await response.json()
        toast({
          title: "❌ Gagal Membatalkan Usulan",
          description: errorData.message || "Terjadi kesalahan saat membatalkan usulan.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error withdrawing proposal:", error)
      toast({
        title: "❌ Gagal Membatalkan Usulan",
        description: "Terjadi kesalahan saat membatalkan usulan.",
        variant: "destructive"
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const stats = [
    {
      title: "Dokumen Menunggu Verifikasi",
      value: dashboardData?.overview.documentStats.menungguVerifikasi.toString() || "0",
      description: "Dokumen yang sedang dalam proses verifikasi",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Dokumen Perlu Perbaikan",
      value: dashboardData?.overview.documentStats.perluPerbaikan.toString() || "0",
      description: "Dokumen yang perlu diperbaiki",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Dokumen Disetujui",
      value: dashboardData?.overview.documentStats.disetujui.toString() || "0",
      description: "Dokumen yang telah disetujui",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Sisa Waktu Pengusulan",
      value: dashboardData?.overview.daysRemaining ? `${dashboardData.overview.daysRemaining} Hari` : "0 Hari",
      description: "Lama sisa waktu pengusulan dokumen",
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ]

  const getActivityStatus = (action: string) => {
    if (action.includes("upload") || action.includes("submit")) return "Sedang Diverifikasi"
    if (action.includes("approve")) return "Disetujui"
    if (action.includes("reject")) return "Perlu Perbaikan"
    return "Sedang Diproses"
  }

  const getActivityType = (action: string) => {
    if (action.includes("approve")) return "success"
    if (action.includes("reject")) return "warning"
    if (action.includes("upload")) return "info"
    return "default"
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

  const recentActivities = dashboardData?.recentActivities.slice(0, 3).map((activity, index) => ({
    title: activity.action,
    status: getActivityStatus(activity.action),
    date: getRelativeTime(activity.createdAt),
    type: getActivityType(activity.action),
    note: activity.details ? JSON.stringify(activity.details) : undefined,
  })) || []

  const quickActions = [
    {
      title: "Input Dokumen Baru", // Renamed
      description: "Buat pengajuan kenaikan pangkat baru",
      icon: FileText,
      href: "/pegawai/input-usulan",
      color: "bg-blue-500",
    },
    {
      title: "Lihat Timeline",
      description: "Pantau jadwal kenaikan pangkat",
      icon: Calendar,
      href: "/pegawai/timeline",
      color: "bg-green-500",
    },
    {
      title: "Riwayat Dokumen", // Renamed
      description: "Lihat semua pengajuan sebelumnya",
      icon: Eye,
      href: "/pegawai/riwayat-dokumen", // Updated route
      color: "bg-purple-500",
    },
    {
      title: "Update Profil",
      description: "Perbarui data profil Anda",
      icon: User,
      href: "/pegawai/profil",
      color: "bg-orange-500",
    },
    {
      title: "Keamanan Akun",
      description: "Aktifkan Two-Factor Authentication (2FA)",
      icon: User,
      href: "/pegawai/2fa",
      color: "bg-red-500",
    },
  ]

  if (isLoading) {
    return (
      <DashboardLayout userType="pegawai">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="pegawai">
      <div className="space-y-6">
        {/* Pending Proposal Modal */}
        <Dialog open={showPendingProposalModal} onOpenChange={setShowPendingProposalModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Usulan Menunggu Kelengkapan</span>
              </DialogTitle>
              <DialogDescription>
                Operator sekolah telah membuatkan usulan kenaikan pangkat untuk Anda. 
                Silakan lengkapi data dan dokumen yang diperlukan untuk melanjutkan proses pengajuan.
              </DialogDescription>
            </DialogHeader>
            
            {pendingProposal && (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium text-orange-800 dark:text-orange-200">
                      Periode: {pendingProposal.periode || "Belum diisi"}
                    </div>
                    <div className="text-orange-700 dark:text-orange-300">
                      Status: {pendingProposal.status}
                    </div>
                    <div className="text-orange-700 dark:text-orange-300">
                      Dibuat oleh: {pendingProposal.operator?.name || "Operator Sekolah"}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-2 font-medium">Yang perlu dilengkapi:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {!pendingProposal.periode && <li>Periode usulan</li>}
                    {(!pendingProposal.documents || pendingProposal.documents.length === 0) && (
                      <li>Dokumen pendukung</li>
                    )}
                    <li>Data personal dan jabatan</li>
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button
                onClick={handleCompleteProposal}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Lengkapi Data
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Batal Ajukan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan Usulan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin membatalkan usulan kenaikan pangkat ini? 
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Tidak</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleWithdrawProposal}
                      disabled={isWithdrawing}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isWithdrawing ? "Membatalkan..." : "Ya, Batalkan"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-sky-500 to-teal-500 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Selamat Datang, {userData?.user?.name || "Loading..."}!
            </h1>
            <p className="text-sky-100 mb-4">
              Dashboard Kenaikan Pangkat - {typeof userData?.user?.unitKerja === 'object' ? (userData?.user?.unitKerja?.nama || "Unit Kerja") : (userData?.user?.unitKerja || "Loading...")}
            </p>

            {dashboardData?.overview.activeProposal ? (
              <div className="bg-green-500/20 border border-green-300/30 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-200 mr-3" />
                  <p className="text-green-100 font-medium">
                    Usulan Aktif: {dashboardData.overview.activeProposal.periode} 
                    ({dashboardData.overview.activeProposal.status})
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/20 border border-blue-300/30 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-200 mr-3" />
                  <p className="text-blue-100 font-medium">
                    Belum ada usulan aktif. Silakan buat usulan baru.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 break-words">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words leading-relaxed">{stat.description}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor} flex-shrink-0`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-sky-600" />
                  Aktivitas Terbaru
                </CardTitle>
                <CardDescription>Update terbaru dari usulan kenaikan pangkat Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "success"
                          ? "bg-green-500"
                          : activity.type === "warning"
                            ? "bg-orange-500"
                            : activity.type === "error"
                              ? "bg-red-500"
                              : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{activity.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge
                          variant={
                            activity.type === "success"
                              ? "default"
                              : activity.type === "warning"
                                ? "secondary"
                                : activity.type === "error"
                                  ? "destructive"
                                  : "outline"
                          }
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{activity.date}</span>
                      </div>
                      {activity.note && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 italic break-words">{activity.note}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-teal-600" />
                  Aksi Cepat
                </CardTitle>
                <CardDescription>Fitur yang sering digunakan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 + index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-4 justify-start hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => (window.location.href = action.href)}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mr-4 flex-shrink-0`}
                      >
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm break-words">{action.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 break-words leading-relaxed">{action.description}</p>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
