"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  School,
  GraduationCap,
  BookOpen,
  UserCheck,
} from "lucide-react"
import Link from "next/link"

export default function OperatorSekolahDashboardPage() {
  const [stats, setStats] = useState({
    totalPegawai: 0,
    totalUsulan: 0,
    usulanMenunggu: 0,
    usulanDiproses: 0,
    usulanSelesai: 0,
    unitKerja: '',
    deadlineAktif: null,
  })

  const [pegawaiData, setPegawaiData] = useState([])
  const [usulanTerbaru, setUsulanTerbaru] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch stats data
      const statsRes = await fetch('/api/operator-sekolah/dashboard')
      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats')
      }
      const statsData = await statsRes.json()
      setStats(statsData)

      // Fetch recent data
      const recentRes = await fetch('/api/operator-sekolah/dashboard/recent')
      if (!recentRes.ok) {
        throw new Error('Failed to fetch recent data')
      }
      const recentData = await recentRes.json()
      setPegawaiData(recentData.recentPegawai)
      setUsulanTerbaru(recentData.recentUsulan)
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Keep mock data as fallback
      setStats({
        totalPegawai: 0,
        totalUsulan: 0,
        usulanMenunggu: 0,
        usulanDiproses: 0,
        usulanSelesai: 0,
        unitKerja: 'N/A',
        deadlineAktif: null,
      })
      setPegawaiData([])
      setUsulanTerbaru([])
    } finally {
      setIsLoading(false)
    }
  }

  const statsCards = [
    {
      title: "Total Pegawai",
      value: stats.totalPegawai.toString(),
      description: "Pegawai di sekolah",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      change: "Aktif semua",
    },
    {
      title: "Total Usulan",
      value: stats.totalUsulan.toString(),
      description: "Usulan tahun ini",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      change: "+2 bulan ini",
    },
    {
      title: "Menunggu Verifikasi",
      value: stats.usulanMenunggu.toString(),
      description: "Perlu ditindaklanjuti",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      change: "Segera proses",
    },
    {
      title: "Sedang Diproses",
      value: stats.usulanDiproses.toString(),
      description: "Dalam tahap verifikasi",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      change: "Progress baik",
    },
    {
      title: "Selesai",
      value: stats.usulanSelesai.toString(),
      description: "Berhasil disetujui",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      change: "Bulan ini",
    },
  ]

  return (
    <DashboardLayout userType="operator-sekolah">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <School className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Dashboard Operator Sekolah</h1>
                <p className="text-purple-100">{stats.unitKerja || 'Unit Kerja Anda'}</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-purple-200 mr-3" />
                  <p className="text-purple-100 font-medium">
                    Kelola data pegawai dan usulan kenaikan pangkat di sekolah Anda
                  </p>
                </div>
                {stats.deadlineAktif && (
                  <div className="text-right">
                    <p className="text-xs text-purple-200">Deadline Aktif:</p>
                    <p className="text-sm font-medium text-white">
                      {new Date(stats.deadlineAktif).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                )}
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
          {statsCards.map((stat, index) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pegawai Terbaru */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                  Data Pegawai Sekolah
                </CardTitle>
                <CardDescription>Daftar pegawai di sekolah Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : pegawaiData.length > 0 ? (
                  pegawaiData.map((pegawai: { id: string; nama: string; golongan: string; jabatan: string; unitKerja: string; nip?: string; jenisJabatan?: string; status?: string }, index) => (
                    <motion.div
                      key={pegawai.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.1, duration: 0.4 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{pegawai.nama}</p>
                          <Badge variant="secondary" className="text-xs">
                            {pegawai.golongan}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {pegawai.nip} • {pegawai.jabatan}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{pegawai.jenisJabatan}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {pegawai.status}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Belum ada data pegawai</p>
                  </div>
                )}
                <Link href="/operator-sekolah/pegawai" className="w-full">
                  <Button className="w-full mt-4 bg-transparent" variant="outline">
                    Lihat Semua Pegawai
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Usulan Terbaru */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Usulan Terbaru
                </CardTitle>
                <CardDescription>Usulan kenaikan pangkat terbaru</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : usulanTerbaru.length > 0 ? (
                  usulanTerbaru.map((usulan: { id: string; pegawai: string; golonganAsal: string; golonganTujuan: string; tanggal: string; status: string }, index) => (
                    <motion.div
                      key={usulan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.1, duration: 0.4 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">{usulan.pegawai}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {usulan.golonganAsal} → {usulan.golonganTujuan}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{usulan.tanggal}</p>
                      </div>
                      <Badge
                        variant={usulan.status.includes("Menunggu") ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {usulan.status}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Belum ada usulan</p>
                  </div>
                )}
                <Link href="/operator-sekolah/usulan" className="w-full">
                  <Button className="w-full mt-4 bg-transparent" variant="outline">
                    Lihat Semua Usulan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Akses cepat ke fitur utama</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/operator-sekolah/pegawai/tambah">
                  <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Tambah Pegawai</span>
                  </Button>
                </Link>
                <Link href="/operator-sekolah/usulan">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Kelola Usulan</span>
                  </Button>
                </Link>
                <Link href="/operator-sekolah/laporan">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">Laporan</span>
                  </Button>
                </Link>
                <Link href="/operator-sekolah/timeline">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
                  >
                    <Clock className="h-6 w-6" />
                    <span className="text-sm">Timeline</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
