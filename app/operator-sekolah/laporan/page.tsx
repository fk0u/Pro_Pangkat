"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Download, FileText, TrendingUp, Users, PieChart } from "lucide-react"
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
  Legend
} from "recharts"
import { useToast } from "@/hooks/use-toast"

interface LaporanStats {
  totalPegawai: number
  totalUsulan: number
  usulanSelesai: number
  usulanProses: number
  usulanMenunggu: number
  usulanDitolak: number
  tingkatPenyelesaian: number
}

interface MonthlyDataItem {
  month: string
  usulan: number
  disetujui: number
  ditolak: number
  pending: number
}

interface StatusDataItem {
  name: string
  value: number
  color: string
}

interface GolonganDataItem {
  golongan: string
  jumlah: number
}

export default function OperatorSekolahLaporanPage() {
  const [periode, setPeriode] = useState("2025")
  const [loading, setLoading] = useState(true) // Start with true to show initial loading
  const [stats, setStats] = useState<LaporanStats>({
    totalPegawai: 0,
    totalUsulan: 0,
    usulanSelesai: 0,
    usulanProses: 0,
    usulanMenunggu: 0,
    usulanDitolak: 0,
    tingkatPenyelesaian: 0
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyDataItem[]>([])
  const [statusData, setStatusData] = useState<StatusDataItem[]>([])
  const [golonganData, setGolonganData] = useState<GolonganDataItem[]>([])

  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(`/api/operator-sekolah/laporan?period=${periode}&retry=${retryCount}`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok && isMounted) {
          const data = await response.json()
          if (data.stats) {
            setStats(data.stats)
          }
          if (data.monthlyData) {
            setMonthlyData(data.monthlyData)
          }
          if (data.statusData) {
            setStatusData(data.statusData)
          }
          if (data.golonganData) {
            setGolonganData(data.golonganData)
          }
          
          console.log('Laporan data loaded from API:', data)
        } else if (isMounted) {
          // Show error if API fails
          console.error("API failed with status:", response.status)
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
          const errorMsg = errorData.message || 'Gagal memuat data laporan dari server'
          setError(errorMsg)
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive"
          })
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching laporan data:", error)
          // Show error message for failed API calls
          if (!(error instanceof Error) || error.name !== 'AbortError') {
            const errorMsg = error instanceof Error ? error.message : 'Gagal memuat data laporan'
            setError(errorMsg)
            toast({
              title: "Error",
              description: errorMsg + ". Silakan refresh halaman.",
              variant: "destructive"
            })
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    // Debounce API calls
    const timeoutId = setTimeout(() => {
      fetchData()
    }, 300)
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [periode, toast, retryCount])

  const exportToExcel = async () => {
    try {
      setLoading(true)
      toast({
        title: "Info",
        description: "Sedang memproses export data...",
        variant: "default"
      })

      // Add timeout for export
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch('/api/operator-sekolah/laporan/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          period: periode,
          format: 'excel'
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        // Get CSV content from response
        const csvContent = await response.text()
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `laporan-usulan-${periode || 'semua'}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Sukses",
          description: "Laporan Excel berhasil diunduh",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Gagal mengunduh laporan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Error",
        description: "Gagal mengunduh laporan. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    try {
      toast({
        title: "Export PDF",
        description: "Sedang memproses export PDF...",
      })

      const response = await fetch('/api/operator-sekolah/laporan/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: periode
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export PDF')
      }

      // Get the HTML content and open in new window for printing
      const htmlContent = await response.text()
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
        
        // Auto print after a short delay
        setTimeout(() => {
          newWindow.print()
        }, 1000)
      }

      toast({
        title: "Export Berhasil",
        description: "PDF laporan telah dibuka di tab baru. Silakan cetak dari browser.",
      })
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat export PDF",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat data laporan...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center mb-4">
            <p className="text-destructive font-semibold">Error: {error}</p>
            <p className="text-muted-foreground mt-1">Gagal memuat data laporan</p>
          </div>
          <Button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className="mt-4"
          >
            Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator-sekolah">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan & Statistik</h1>
            <p className="text-muted-foreground">
              Analisis data usulan dan kinerja pegawai periode {periode}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={periode} onValueChange={setPeriode}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2" disabled={loading}>
              <FileText className="h-4 w-4" />
              {loading ? "Memproses..." : "Export PDF"}
            </Button>
            <Button onClick={exportToExcel} disabled={loading} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {loading ? "Mengunduh..." : "Export Excel"}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPegawai}</div>
              <p className="text-xs text-muted-foreground">
                Pegawai aktif di unit kerja
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsulan}</div>
              <p className="text-xs text-muted-foreground">
                Usulan periode {periode}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usulan Selesai</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.usulanSelesai}</div>
              <p className="text-xs text-muted-foreground">
                {stats.tingkatPenyelesaian}% dari total usulan
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tingkat Penyelesaian</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tingkatPenyelesaian}%</div>
              <p className="text-xs text-muted-foreground">
                Rasio usulan yang disetujui
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {monthlyData.length > 0 || statusData.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Usulan Bulanan</CardTitle>
              <CardDescription>
                Perbandingan usulan masuk, disetujui, dan ditolak per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="usulan" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Total Usulan"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="disetujui" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Disetujui"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ditolak" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Ditolak"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Tidak ada data usulan untuk periode {periode}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Status Usulan</CardTitle>
              <CardDescription>
                Breakdown status usulan periode {periode}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Tidak ada data status untuk periode {periode}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Data Laporan</h3>
                <p>Belum ada data usulan untuk periode {periode}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Charts */}
        {monthlyData.length > 0 || golonganData.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performa Bulanan Detail</CardTitle>
              <CardDescription>
                Detail usulan per bulan dalam bentuk bar chart
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="usulan" fill="#3B82F6" name="Total Usulan" />
                    <Bar dataKey="disetujui" fill="#10B981" name="Disetujui" />
                    <Bar dataKey="ditolak" fill="#EF4444" name="Ditolak" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Tidak ada data usulan bulanan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Golongan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Usulan per Golongan</CardTitle>
              <CardDescription>
                Usulan kenaikan pangkat berdasarkan golongan asal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {golonganData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={golonganData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="golongan" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Tidak ada data golongan pegawai
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        ) : null}

        {/* Summary Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Ringkasan Laporan
            </CardTitle>
            <CardDescription>
              Informasi penting terkait usulan kenaikan pangkat periode {periode}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-600 mb-2">Pencapaian Positif</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Tingkat penyelesaian {stats.tingkatPenyelesaian}% (target 70%)</li>
                  <li>• {stats.usulanSelesai} usulan berhasil disetujui</li>
                  <li>• Tidak ada usulan yang ditolak bulan ini</li>
                  <li>• Proses verifikasi berjalan lancar</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-blue-600 mb-2">Dalam Proses</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• {stats.usulanProses} usulan sedang diproses</li>
                  <li>• {stats.usulanMenunggu} usulan menunggu verifikasi</li>
                  <li>• Estimasi selesai dalam 2-3 minggu</li>
                  <li>• Dokumen lengkap dan valid</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-orange-600 mb-2">Rekomendasi</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Percepat verifikasi usulan pending</li>
                  <li>• Sosialisasi persyaratan lebih detail</li>
                  <li>• Koordinasi dengan Dinas Pendidikan</li>
                  <li>• Update status secara berkala</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
