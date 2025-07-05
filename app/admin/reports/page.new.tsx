"use client"

import * as XLSX from "xlsx"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Info, BarChart3, Download, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DocumentReport {
  id: string;
  nama: string;
  dokumen: string;
  tanggal: string;
  status: string;
  nip?: string;
  unitKerja?: string;
}

interface PeriodData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface ProposalData {
  id: string;
  pegawai?: {
    name: string;
    nip: string;
    unitKerja: string | { nama: string };
  };
  jenis?: string;
  createdAt: string;
  status: string;
}

export default function ReportExportPage() {
  const { toast } = useToast()
  const [data, setData] = useState<DocumentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [period, setPeriod] = useState("current")
  const [periodOptions, setPeriodOptions] = useState<{value: string, label: string}[]>([])
  
  const fetchPeriods = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/periods")
      
      if (!response.ok) {
        throw new Error("Failed to fetch periods")
      }
      
      const result = await response.json()
      
      const options = [
        { value: "current", label: "Periode Aktif" },
        ...result.data.map((p: PeriodData) => ({ 
          value: p.id, 
          label: `${p.title} (${new Date(p.startDate).toLocaleDateString("id-ID")} - ${new Date(p.endDate).toLocaleDateString("id-ID")})` 
        }))
      ]
      
      setPeriodOptions(options)
    } catch (error) {
      console.error("Error fetching periods:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data periode. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }, [toast])
  
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (period !== "current") {
        params.append("periodId", period)
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      
      const url = `/api/admin/reports?${params.toString()}`
      console.log("Fetching admin report data from:", url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", response.status, errorText)
        throw new Error(`Failed to fetch report data: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      
      // Debug the API response
      console.log("API Response Structure:", {
        success: result.success,
        hasData: result.data !== undefined,
        dataType: result.data ? typeof result.data : 'undefined',
        isArray: result.data ? Array.isArray(result.data) : false,
        dataLength: result.data && Array.isArray(result.data) ? result.data.length : 'N/A'
      });
      
      // Check if the API response has the expected structure
      // The response might be in format: { data: { data: [...], pagination: {...} } }
      const responseData = result.data?.data ? result.data.data : 
                           Array.isArray(result.data) ? result.data : 
                           [];
      
      console.log("Extracted response data:", {
        isArray: Array.isArray(responseData),
        length: Array.isArray(responseData) ? responseData.length : 'N/A',
        sample: responseData && Array.isArray(responseData) && responseData.length > 0 ? 
                responseData[0]?.id : 'No items'
      });
      
      // Transform the data to match our interface
      const transformedData: DocumentReport[] = Array.isArray(responseData) ? responseData.map((item: ProposalData) => {
        if (!item || !item.pegawai) {
          console.warn("Skipping invalid item without pegawai data:", item?.id || "unknown");
          return {
            id: item?.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            nama: "Data Tidak Lengkap",
            nip: "N/A",
            unitKerja: "N/A",
            dokumen: item?.jenis || "Kenaikan Pangkat",
            tanggal: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: item?.status || "UNKNOWN"
          };
        }

        return {
          id: item.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nama: item.pegawai?.name || "N/A",
          nip: item.pegawai?.nip || "N/A",
          unitKerja: typeof item.pegawai?.unitKerja === 'object' ? item.pegawai?.unitKerja?.nama : item.pegawai?.unitKerja || "N/A",
          dokumen: item.jenis || "Kenaikan Pangkat",
          tanggal: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: item.status || "UNKNOWN"
        };
      }) : []
      
      setData(transformedData)
      
      // Also save the pagination info if available
      if (result.data?.pagination) {
        console.log("Pagination info:", result.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Gagal memuat data laporan: ${error.message}` 
          : "Gagal memuat data laporan. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [period, statusFilter, toast])
  
  useEffect(() => {
    fetchPeriods()
    fetchReportData()
  }, [fetchPeriods, fetchReportData])

  // Helper function to get readable status text
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      "DRAFT": "Draft",
      "DIAJUKAN": "Diajukan",
      "DIPROSES_OPERATOR": "Diproses Operator",
      "DITOLAK_OPERATOR": "Ditolak Operator",
      "DISETUJUI_OPERATOR": "Disetujui Operator",
      "DIPROSES_ADMIN": "Diproses Admin",
      "DITOLAK": "Ditolak",
      "DITOLAK_ADMIN": "Ditolak Admin",
      "DISETUJUI_ADMIN": "Disetujui Admin",
      "SELESAI": "Selesai"
    }
    return statusMap[status] || status
  }
  
  // Helper function to get badge color class based on status
  const getStatusBadgeClass = (status: string) => {
    if (status.includes("DISETUJUI") || status === "SELESAI") {
      return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    } else if (status.includes("DIPROSES") || status === "DIAJUKAN") {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    } else if (status.includes("DITOLAK")) {
      return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    } else {
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  }

  // Calculate statistics
  const total = data?.length || 0
  const disetujui = data?.filter((d) => d.status?.includes("DISETUJUI") || d.status === "SELESAI")?.length || 0
  const diproses = data?.filter((d) => d.status?.includes("DIPROSES") || d.status === "DIAJUKAN")?.length || 0
  const ditolak = data?.filter((d) => d.status?.includes("DITOLAK"))?.length || 0

  const exportExcel = () => {
    const worksheetData = [
      ["Nama Pegawai", "NIP", "Unit Kerja", "Dokumen", "Tanggal", "Status"],
      ...data.map(item => [item.nama, item.nip || "-", item.unitKerja || "-", item.dokumen, item.tanggal, getStatusText(item.status)])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Dokumen")

    const fileName = `laporan-kenaikan-pangkat-${new Date().toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    toast({
      title: "Ekspor Berhasil",
      description: `File ${fileName} berhasil diunduh.`
    })
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Laporan & Ekspor</h1>
                <p className="text-indigo-100">Data Kenaikan Pangkat</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-indigo-200" />
                <p className="text-indigo-100">
                  Halaman ini menampilkan laporan dan ekspor data kenaikan pangkat.
                  Anda dapat memfilter berdasarkan periode dan status.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Filters */}
        <Card className="shadow">
          <CardHeader>
            <CardTitle className="text-lg">Filter Laporan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-center">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status Dokumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
                <SelectItem value="DISETUJUI_ADMIN">Disetujui Admin</SelectItem>
                <SelectItem value="DISETUJUI_OPERATOR">Disetujui Operator</SelectItem>
                <SelectItem value="DIPROSES_ADMIN">Diproses Admin</SelectItem>
                <SelectItem value="DIPROSES_OPERATOR">Diproses Operator</SelectItem>
                <SelectItem value="DITOLAK">Ditolak</SelectItem>
                <SelectItem value="DITOLAK_OPERATOR">Ditolak Operator</SelectItem>
                <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportExcel} className="ml-auto">
              <Download className="h-4 w-4 mr-2" /> Export Excel
            </Button>
          </CardContent>
        </Card>

        {/* Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-sm">Total Dokumen</p>
              <p className="text-2xl font-bold">{total}</p>
            </CardContent>
          </Card>
          <Card className="shadow">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-sm">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">{disetujui}</p>
            </CardContent>
          </Card>
          <Card className="shadow">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-sm">Diproses</p>
              <p className="text-2xl font-bold text-yellow-500">{diproses}</p>
            </CardContent>
          </Card>
          <Card className="shadow">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-sm">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{ditolak}</p>
            </CardContent>
          </Card>
        </div>

        {/* Riwayat Dokumen */}
        <Card className="shadow">
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Dokumen</CardTitle>
            <p className="text-sm text-muted-foreground">Data dokumen pengajuan pegawai</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat data laporan...</span>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tidak ada data yang sesuai dengan filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-separate border-spacing-y-2 transition-colors duration-300">
                  <thead className="text-left bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2">Nama Pegawai</th>
                      <th className="px-4 py-2">NIP</th>
                      <th className="px-4 py-2">Unit Kerja</th>
                      <th className="px-4 py-2">Dokumen</th>
                      <th className="px-4 py-2">Tanggal</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr
                        key={item.id}
                        className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm border rounded-lg transition-colors duration-300"
                      >
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{item.nama}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.nip || "-"}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.unitKerja || "-"}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.dokumen}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {new Date(item.tanggal).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                            {getStatusText(item.status)}
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
      </div>
    </DashboardLayout>
  )
}
