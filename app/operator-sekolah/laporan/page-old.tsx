"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Download, FileText, TrendingUp, Users, Calendar, LucidePieChart } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts"

export default function OperatorSekolahLaporanPage() {
  const [periode, setPeriode] = useState("2025")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalPegawai: 45,
    totalUsulan: 22,
    usulanSelesai: 10,
    usulanProses: 7,
    usulanMenunggu: 3,
    tingkatPenyelesaian: 45.5
  })

  useEffect(() => {
    fetchLaporanData()
  }, [periode])

  const fetchLaporanData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/operator-sekolah/laporan?period=${periode}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching laporan:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/operator-sekolah/laporan/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: periode })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `laporan-usulan-${periode}-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting:', error)
    }
  }

  // Mock data for charts
  const monthlyData = [
    { month: "Jan", usulan: 2, disetujui: 1 },
    { month: "Feb", usulan: 3, disetujui: 2 },
    { month: "Mar", usulan: 1, disetujui: 1 },
    { month: "Apr", usulan: 4, disetujui: 3 },
    { month: "Mei", usulan: 2, disetujui: 2 },
    { month: "Jun", usulan: 3, disetujui: 1 },
  ]

  const statusData = [
    { name: "Disetujui", value: 10, color: "#10B981" },
    { name: "Sedang Diproses", value: 7, color: "#3B82F6" },
    { name: "Menunggu Verifikasi", value: 3, color: "#F59E0B" },
    { name: "Ditolak", value: 2, color: "#EF4444" },
  ]

  const golonganData = [
    { golongan: "III/a → III/b", jumlah: 3 },
    { golongan: "III/b → III/c", jumlah: 5 },
    { golongan: "III/c → III/d", jumlah: 7 },
    { golongan: "III/d → IV/a", jumlah: 4 },
    { golongan: "IV/a → IV/b", jumlah: 3 },
  ]

  const handleExport = (type: string) => {
    setLoading(true)
    // Simulate export process
    setTimeout(() => {
      setLoading(false)
      console.log(`Exporting ${type} report...`)
    }, 2000)
  }

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold">Laporan & Statistik</h1>
                  <p className="text-purple-100">SMA Negeri 1 Balikpapan</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={periode} onValueChange={setPeriode}>
                  <SelectTrigger className="w-[150px] bg-white/20 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">Tahun 2025</SelectItem>
                    <SelectItem value="2024">Tahun 2024</SelectItem>
                    <SelectItem value="2023">Tahun 2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usulan</p>
                  <p className="text-2xl font-bold">22</p>
                  <p className="text-xs text-green-600">+15% dari tahun lalu</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tingkat Persetujuan</p>
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-xs text-green-600">+5% dari tahun lalu</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rata-rata Waktu Proses</p>
                  <p className="text-2xl font-bold">45</p>
                  <p className="text-xs text-gray-500">hari</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pegawai Aktif</p>
                  <p className="text-2xl font-bold">45</p>
                  <p className="text-xs text-blue-600">100% aktif</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Tren Usulan Bulanan
                </CardTitle>
                <CardDescription>Perbandingan usulan dan persetujuan per bulan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="usulan" stroke="#3B82F6" strokeWidth={2} name="Usulan" />
                      <Line type="monotone" dataKey="disetujui" stroke="#10B981" strokeWidth={2} name="Disetujui" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LucidePieChart className="h-5 w-5 mr-2 text-green-600" />
                  Distribusi Status
                </CardTitle>
                <CardDescription>Persentase usulan berdasarkan status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Golongan Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                Distribusi Kenaikan Golongan
              </CardTitle>
              <CardDescription>Jumlah usulan berdasarkan jenis kenaikan golongan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={golonganData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="golongan" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2 text-indigo-600" />
                Export Laporan
              </CardTitle>
              <CardDescription>Unduh laporan dalam berbagai format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleExport("excel")}
                  disabled={loading}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Download className="h-6 w-6" />
                  <span>Export Excel</span>
                </Button>
                <Button
                  onClick={() => handleExport("pdf")}
                  disabled={loading}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Download className="h-6 w-6" />
                  <span>Export PDF</span>
                </Button>
                <Button
                  onClick={() => handleExport("summary")}
                  disabled={loading}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <FileText className="h-6 w-6" />
                  <span>Ringkasan Laporan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
