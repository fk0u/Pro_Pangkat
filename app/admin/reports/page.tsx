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

// Wrapper to provide fixed height for all chart containers
const ChartWrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: '100%', height: 300 }}>
    {children}
  </div>
)

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

  // Helper function to get status display text with more statuses
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      "DRAFT": "Draft",
      "DIAJUKAN": "Diajukan",
      "DIPROSES_OPERATOR": "Diproses Operator",
      "DITOLAK_OPERATOR": "Ditolak Operator",
      "DISETUJUI_OPERATOR": "Disetujui Operator",
      "DIPROSES_ADMIN": "Diproses Admin",
      "DITOLAK": "Ditolak Admin",
      "DITOLAK_ADMIN": "Ditolak Admin",
      "DISETUJUI_ADMIN": "Disetujui Admin",
      "SELESAI": "Selesai",
      "DIKEMBALIKAN_ADMIN": "Dikembalikan Admin",
      "DITOLAK_SEKOLAH": "Ditolak Sekolah",
      "DISETUJUI_SEKOLAH": "Disetujui Sekolah"
    }
    return statusMap[status] || status
  }

  // Get unit kerja name - improved handling
  const getUnitKerjaName = (unitKerja?: { nama?: string; name?: string } | string): string => {
    if (typeof unitKerja === 'string') return unitKerja;
    return unitKerja?.nama || unitKerja?.name || "Unit Kerja Tidak Diketahui"
  }

  // Get wilayah name - improved handling  
  const getWilayahName = (wilayah?: { nama?: string; name?: string } | string): string => {
    if (typeof wilayah === 'string') return wilayah;
    return wilayah?.nama || wilayah?.name || "Wilayah Tidak Diketahui"
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
        getWilayahName(item.pegawai.wilayah),
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

  // Calculate summary statistics with better coverage and detailed breakdown
  const totalUsulan = data.length
  
  // Disetujui - hanya yang disetujui admin dan selesai
  const disetujuiAdmin = data.filter((d) => 
    d.status === "DISETUJUI_ADMIN" || 
    d.status === "SELESAI"
  ).length
  
  // Sedang diproses - semua yang masih dalam proses
  const diproses = data.filter((d) => 
    d.status === "DIPROSES_ADMIN" ||
    d.status === "DIPROSES_OPERATOR" ||
    d.status === "DISETUJUI_OPERATOR" ||
    d.status === "DIAJUKAN"
  ).length
  
  // Ditolak - semua yang ditolak di berbagai tingkat
  const ditolakTotal = data.filter((d) => 
    d.status === "DITOLAK" || 
    d.status === "DITOLAK_ADMIN" ||
    d.status === "DITOLAK_OPERATOR" ||
    d.status === "DITOLAK_SEKOLAH" ||
    d.status === "DIKEMBALIKAN_ADMIN"
  ).length
  
  // Breakdown ditolak untuk keterangan detail
  const ditolakAdmin = data.filter((d) => 
    d.status === "DITOLAK" || 
    d.status === "DITOLAK_ADMIN"
  ).length
  
  const ditolakOperator = data.filter((d) => 
    d.status === "DITOLAK_OPERATOR"
  ).length
  
  const ditolakSekolah = data.filter((d) => 
    d.status === "DITOLAK_SEKOLAH"
  ).length
  
  const dikembalikan = data.filter((d) => 
    d.status === "DIKEMBALIKAN_ADMIN"
  ).length
  
  const draft = data.filter((d) => d.status === "DRAFT").length

  // Debug logging
  console.log("Stats breakdown:", {
    totalUsulan,
    disetujuiAdmin,
    diproses,
    ditolakTotal,
    ditolakAdmin,
    ditolakOperator,
    dikembalikan,
    draft,
    dataLength: data.length,
    statuses: data.map(d => d.status),
    ditolakSekolah
  });

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-4 md:p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-2 md:space-y-0">
              <BarChart3 className="h-6 w-6 md:h-8 md:w-8 mr-0 md:mr-3" />
              <div className="text-center md:text-left">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Laporan & Analisis Dashboard</h1>
                <p className="text-rose-100 text-sm md:text-base">Analisis lengkap data usulan kenaikan pangkat dengan statistik dan visualisasi</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-3 md:p-4">
              <div className="flex items-start md:items-center">
                <Info className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 text-rose-200 flex-shrink-0 mt-1 md:mt-0" />
                <p className="text-rose-100 text-xs md:text-sm lg:text-base">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">Total Usulan</CardTitle>
                    <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">{totalUsulan}</div>
                    <p className="text-xs text-muted-foreground">Total usulan dalam database</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">Disetujui Admin</CardTitle>
                    <Award className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold text-green-600">{disetujuiAdmin}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalUsulan > 0 ? `${Math.round((disetujuiAdmin / totalUsulan) * 100)}%` : '0%'} disetujui & selesai
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">Sedang Diproses</CardTitle>
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold text-yellow-600">{diproses}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalUsulan > 0 ? `${Math.round((diproses / totalUsulan) * 100)}%` : '0%'} sedang diproses
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">Ditolak Total</CardTitle>
                    <Users className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold text-red-600">{ditolakTotal}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Admin: {ditolakAdmin} | Operator: {ditolakOperator} | Sekolah: {ditolakSekolah} | Dikembalikan: {dikembalikan}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">Draft</CardTitle>
                    <Database className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold text-gray-600">{draft}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalUsulan > 0 ? `${Math.round((draft / totalUsulan) * 100)}%` : '0%'} belum diajukan
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">Perlu Perhatian</CardTitle>
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold text-orange-600">
                      {data.filter(d => d.status === "DISETUJUI_OPERATOR").length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Menunggu persetujuan admin
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Additional Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200 text-sm">Detail Disetujui</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700 dark:text-green-300">Disetujui Admin:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {data.filter(d => d.status === "DISETUJUI_ADMIN").length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700 dark:text-green-300">Selesai Diproses:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {data.filter(d => d.status === "SELESAI").length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-red-800 dark:text-red-200 text-sm">Detail Ditolak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700 dark:text-red-300">Ditolak Admin:</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{ditolakAdmin}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700 dark:text-red-300">Ditolak Operator:</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{ditolakOperator}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700 dark:text-red-300">Ditolak Sekolah:</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{ditolakSekolah}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700 dark:text-red-300">Dikembalikan:</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{dikembalikan}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 dark:text-yellow-200 text-sm">Detail Dalam Proses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">Diproses Admin:</span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                          {data.filter(d => d.status === "DIPROSES_ADMIN").length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">Diproses Operator:</span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                          {data.filter(d => d.status === "DIPROSES_OPERATOR").length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">Baru Diajukan:</span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                          {data.filter(d => d.status === "DIAJUKAN").length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            {statistics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Status Distribution Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base md:text-lg">Distribusi Status Usulan</CardTitle>
                      <CardDescription className="text-sm">Breakdown status semua usulan dalam sistem</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
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
                            label={({ statusText, percent }) => `${statusText} ${percent ? (percent * 100).toFixed(0) : 0}%`}
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
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Wilayah Distribution Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base md:text-lg">Distribusi per Wilayah</CardTitle>
                      <CardDescription className="text-sm">Jumlah usulan berdasarkan wilayah kerja</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statistics.byWilayah}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="wilayah" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Periode Trend Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base md:text-lg">Trend per Periode</CardTitle>
                      <CardDescription className="text-sm">Perkembangan usulan berdasarkan periode</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={statistics.byPeriode}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periode" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Golongan Distribution Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base md:text-lg">Distribusi Golongan</CardTitle>
                      <CardDescription className="text-sm">Usulan berdasarkan golongan pegawai</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statistics.byGolongan}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="golongan" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#82ca9d" />
                        </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Data Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}>
              <Card className="shadow hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Database className="h-4 w-4 md:h-5 md:w-5" />
                      Data Lengkap Usulan
                    </CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Menampilkan {data.length} total usulan dari database
                    </p>
                  </div>
                  <Button 
                    onClick={exportExcel} 
                    className="bg-green-600 hover:bg-green-700 text-white text-sm w-full sm:w-auto" 
                    disabled={data.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export ke Excel
                  </Button>
                </CardHeader>
                <CardContent>
                  {data.length === 0 ? (
                    <div className="text-center py-8 md:py-12 text-muted-foreground">
                      <Database className="h-8 w-8 md:h-12 md:w-12 mx-auto opacity-20 mb-4" />
                      <p className="text-base md:text-lg font-medium">Database Kosong</p>
                      <p className="text-sm">Belum ada data usulan yang tersimpan dalam database</p>
                      <Button onClick={fetchReports} variant="outline" className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Periksa Ulang Database
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs md:text-sm border-separate border-spacing-y-1">
                        <thead className="text-left bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium">No</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium">Nama Pegawai</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium hidden sm:table-cell">NIP</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium hidden md:table-cell">Jabatan</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium hidden lg:table-cell">Unit Kerja</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium hidden lg:table-cell">Wilayah</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium hidden md:table-cell">Golongan</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium hidden sm:table-cell">Periode</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium">Status</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium hidden md:table-cell">Tgl Pengajuan</th>
                            <th className="px-2 md:px-4 py-2 md:py-3 font-medium hidden lg:table-cell">Dokumen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((item, index) => (
                            <tr
                              key={item.id}
                              className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm border rounded-lg transition-colors duration-200"
                            >
                              <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-gray-500">{index + 1}</td>
                              <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-gray-900 dark:text-gray-100">
                                <div className="max-w-[120px] md:max-w-none truncate">{item.pegawai.name}</div>
                                <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {item.pegawai.nip}
                                </div>
                              </td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{item.pegawai.nip}</td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-gray-700 dark:text-gray-300 hidden md:table-cell">
                                <div className="max-w-[150px] truncate">{item.pegawai.jabatan}</div>
                              </td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                                <div className="max-w-[120px] truncate">{getUnitKerjaName(item.pegawai.unitKerja)}</div>
                              </td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-gray-700 dark:text-gray-300 hidden lg:table-cell">{getWilayahName(item.pegawai.wilayah)}</td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-gray-700 dark:text-gray-300 hidden md:table-cell">{item.pegawai.golongan}</td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{item.periode}</td>
                              <td className="px-2 md:px-4 py-2 md:py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    item.status === "DISETUJUI_ADMIN"
                                      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                      : item.status === "SELESAI"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100"
                                      : item.status === "DISETUJUI_SEKOLAH"
                                      ? "bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100"
                                      : item.status === "DIPROSES_ADMIN"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                      : item.status === "DISETUJUI_OPERATOR"
                                      ? "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100"
                                      : item.status === "DIPROSES_OPERATOR" || item.status === "DIAJUKAN"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                      : item.status === "DITOLAK_ADMIN" || item.status === "DITOLAK"
                                      ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                      : item.status === "DITOLAK_OPERATOR"
                                      ? "bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100"
                                      : item.status === "DITOLAK_SEKOLAH"
                                      ? "bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-100"
                                      : item.status === "DIKEMBALIKAN_ADMIN"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100"
                                      : item.status === "DRAFT"
                                      ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                                  }`}
                                >
                                  <span className="hidden sm:inline">{getStatusText(item.status)}</span>
                                  <span className="sm:hidden">{getStatusText(item.status).substring(0, 8)}{getStatusText(item.status).length > 8 ? '...' : ''}</span>
                                </span>
                              </td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-gray-700 dark:text-gray-300 hidden md:table-cell">
                                {new Date(item.createdAt).toLocaleDateString("id-ID")}
                              </td>
                              <td className="px-2 md:px-4 py-2 md:py-3 text-center hidden lg:table-cell">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
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
