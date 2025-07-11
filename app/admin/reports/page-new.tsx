"use client"

import { useState, useEffect, useCallback } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { 
  Info, 
  BarChart3, 
  Download, 
  Loader2, 
  RefreshCw, 
  Database,
  FileText,
  Users,
  TrendingUp,
  Award
} from "lucide-react"
import { motion } from "framer-motion"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"

interface ReportData {
  id: string
  pegawai: {
    id: string
    name: string
    nip: string
    jabatan: string
    golongan: string
    tmtGolongan: string
    jenisJabatan: string
    unitKerja?: {
      id: string
      nama: string
      wilayah?: {
        id: string
        nama: string
      }
    }
    wilayah?: {
      id: string
      nama: string
    }
  }
  status: string
  periode: string
  createdAt: string
  updatedAt: string
  documents: Array<{
    id: string
    fileName: string
    fileSize: number
    status: string
    requirement: {
      id: string
      name: string
      code: string
    }
  }>
}

interface Statistics {
  total: number
  byStatus: Array<{ status: string; count: number }>
  byWilayah: Array<{ wilayah: string; count: number }>
  byGolongan: Array<{ golongan: string; count: number }>
  byPeriode: Array<{ periode: string; count: number }>
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300']

export default function ReportExportPage() {
  const { toast } = useToast()
  const [data, setData] = useState<ReportData[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch ALL reports data from database
  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching ALL reports data from database...');
      
      const response = await fetch('/api/admin/reports?page=1&limit=10000')
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Gagal mengambil data: ${response.status} - ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('API Response:', result);
      
      if (result.status === "success") {
        const proposals = result.data || []
        const stats = result.statistics || null
        
        console.log('Extracted data:', { proposals: proposals.length, statistics: stats });
        
        setData(proposals)
        setStatistics(stats)
        
        toast({
          title: "Berhasil",
          description: `Data laporan berhasil dimuat (${proposals.length} usulan)`,
        })
      } else {
        console.warn('API returned error status:', result);
        setError(result.message || "API mengembalikan status error")
        
        toast({
          title: "Error", 
          description: result.message || "API mengembalikan status error",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal"
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: `Gagal memuat data laporan: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Initialize data on component mount
  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Helper function to get status display text
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      "DRAFT": "Draft",
      "DIAJUKAN": "Diajukan",
      "DIPROSES_OPERATOR": "Diproses Operator",
      "DITOLAK_OPERATOR": "Ditolak Operator",
      "DISETUJUI_OPERATOR": "Disetujui Operator",
      "DIPROSES_ADMIN": "Diproses Admin",
      "DITOLAK": "Ditolak",
      "DISETUJUI_ADMIN": "Disetujui",
      "SELESAI": "Selesai"
    }
    return statusMap[status] || status
  }

  // Get unit kerja name
  const getUnitKerjaName = (unitKerja?: { nama?: string }): string => {
    return unitKerja?.nama || "-"
  }

  // Get wilayah name
  const getWilayahName = (unitKerja?: { wilayah?: { nama?: string } }): string => {
    return unitKerja?.wilayah?.nama || "-"
  }

  // Export to Excel function
  const exportExcel = () => {
    if (data.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive"
      })
      return
    }

    const worksheetData = [
      [
        "No",
        "Nama Pegawai", 
        "NIP", 
        "Jabatan",
        "Unit Kerja", 
        "Wilayah",
        "Golongan",
        "Jenis Jabatan",
        "Periode",
        "Status",
        "Tanggal Pengajuan", 
        "Tanggal Update",
        "Jumlah Dokumen"
      ],
      ...data.map((item, index) => [
        index + 1,
        item.pegawai.name,
        item.pegawai.nip,
        item.pegawai.jabatan,
        getUnitKerjaName(item.pegawai.unitKerja),
        getWilayahName(item.pegawai.unitKerja),
        item.pegawai.golongan,
        item.pegawai.jenisJabatan || "-",
        item.periode,
        getStatusText(item.status),
        new Date(item.createdAt).toLocaleDateString("id-ID"),
        new Date(item.updatedAt).toLocaleDateString("id-ID"),
        item.documents?.length || 0
      ])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Lengkap Usulan")

    // Auto-fit columns
    const colWidths = worksheetData[0].map((_, colIndex) => {
      const maxLength = Math.max(
        ...worksheetData.map(row => String(row[colIndex] || "").length)
      )
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
    })
    worksheet["!cols"] = colWidths

    const fileName = `laporan-lengkap-usulan-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    toast({
      title: "Berhasil",
      description: `Data laporan berhasil diekspor ke file ${fileName}`,
    })
  }

  // Calculate summary statistics
  const totalUsulan = data.length
  const disetujui = data.filter((d) => d.status === "DISETUJUI_ADMIN" || d.status === "SELESAI").length
  const diproses = data.filter((d) => d.status.includes("DIPROSES") || d.status === "DISETUJUI_OPERATOR").length
  const ditolak = data.filter((d) => d.status === "DITOLAK" || d.status === "DITOLAK_ADMIN").length

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Laporan & Analisis Dashboard</h1>
                <p className="text-rose-100">Analisis lengkap data usulan kenaikan pangkat dengan statistik dan visualisasi</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-rose-200" />
                <p className="text-rose-100 text-sm md:text-base">
                  Dashboard ini menampilkan analisis real-time dari seluruh data usulan dengan berbagai metrik dan visualisasi interaktif.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-lg font-medium">Memuat data laporan...</span>
            <span className="text-sm text-muted-foreground">Menganalisis database...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto opacity-20 mb-4 text-red-400" />
            <p className="text-lg font-medium text-red-600">Gagal Memuat Data Laporan</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchReports} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalUsulan}</div>
                    <p className="text-xs text-muted-foreground">Total usulan dalam database</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
                    <Award className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{disetujui}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalUsulan > 0 ? `${Math.round((disetujui / totalUsulan) * 100)}%` : '0%'} dari total usulan
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sedang Diproses</CardTitle>
                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{diproses}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalUsulan > 0 ? `${Math.round((diproses / totalUsulan) * 100)}%` : '0%'} sedang diproses
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
                    <Users className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{ditolak}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalUsulan > 0 ? `${Math.round((ditolak / totalUsulan) * 100)}%` : '0%'} ditolak
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            {statistics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi Status Usulan</CardTitle>
                      <CardDescription>Breakdown status semua usulan dalam sistem</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statistics.byStatus.map((item, index) => ({
                              ...item,
                              statusText: getStatusText(item.status),
                              fill: COLORS[index % COLORS.length]
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ statusText, percent }) => `${statusText} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {statistics.byStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Wilayah Distribution Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi per Wilayah</CardTitle>
                      <CardDescription>Jumlah usulan berdasarkan wilayah kerja</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statistics.byWilayah}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="wilayah" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Periode Trend Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Trend per Periode</CardTitle>
                      <CardDescription>Perkembangan usulan berdasarkan periode</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={statistics.byPeriode}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periode" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Golongan Distribution Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribusi Golongan</CardTitle>
                      <CardDescription>Usulan berdasarkan golongan pegawai</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statistics.byGolongan}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="golongan" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Data Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <Card className="shadow">
                <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Lengkap Usulan
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Menampilkan {data.length} total usulan dari database
                    </p>
                  </div>
                  <Button onClick={exportExcel} className="bg-green-600 hover:bg-green-700 text-white" disabled={data.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export ke Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  {data.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto opacity-20 mb-4" />
                      <p className="text-lg font-medium">Database Kosong</p>
                      <p className="text-sm">Belum ada data usulan yang tersimpan dalam database</p>
                      <Button onClick={fetchReports} variant="outline" className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Periksa Ulang Database
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border-separate border-spacing-y-1">
                        <thead className="text-left bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 font-medium">No</th>
                            <th className="px-4 py-3 font-medium">Nama Pegawai</th>
                            <th className="px-4 py-3 font-medium">NIP</th>
                            <th className="px-4 py-3 font-medium">Jabatan</th>
                            <th className="px-4 py-3 font-medium">Unit Kerja</th>
                            <th className="px-4 py-3 font-medium">Wilayah</th>
                            <th className="px-4 py-3 font-medium">Golongan</th>
                            <th className="px-4 py-3 font-medium">Periode</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Tgl Pengajuan</th>
                            <th className="px-4 py-3 font-medium">Dokumen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((item, index) => (
                            <tr
                              key={item.id}
                              className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm border rounded-lg transition-colors duration-200"
                            >
                              <td className="px-4 py-3 font-medium text-gray-500">{index + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.pegawai.name}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.pegawai.nip}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.pegawai.jabatan}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{getUnitKerjaName(item.pegawai.unitKerja)}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{getWilayahName(item.pegawai.unitKerja)}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.pegawai.golongan}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.periode}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    item.status === "DISETUJUI_ADMIN" || item.status === "SELESAI"
                                      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                      : item.status.includes("DIPROSES") || item.status.includes("OPERATOR")
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                      : item.status === "DITOLAK" || item.status === "DITOLAK_ADMIN"
                                      ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                                  }`}
                                >
                                  {getStatusText(item.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                {new Date(item.createdAt).toLocaleDateString("id-ID")}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {item.documents?.length || 0} file
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
