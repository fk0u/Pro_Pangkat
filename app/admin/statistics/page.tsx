"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BarChart, PieChart, DonutChart } from "@/components/charts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Download, FileBarChart, Info, Loader2, UserCircle, Building, FileCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface Period {
  value: string;
  label: string;
}

interface PeriodData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface ActivityLog {
  id: string;
  action: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    nip: string;
    role: string;
  };
}

interface UnitKerja {
  id: string;
  name: string;
  jenjang: string;
  wilayahId: string;
}

interface ProposalData {
  id: string;
  status: string;
  periode: string;
  createdAt: string;
  pegawai: {
    id: string;
    nip: string;
    name: string;
    golongan: string;
    unitKerja: UnitKerja;
  };
}

interface StatisticsData {
  proposals: {
    total: number;
    byStatus: Record<string, number>;
  };
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  unitKerja: {
    total: number;
    byJenjang: Record<string, number>;
  };
  documents: {
    total: number;
    byStatus: Record<string, number>;
  };
  recentData: {
    proposals: ProposalData[];
    activities: ActivityLog[];
  };
}

export default function StatisticsPage() {
  const { toast } = useToast()
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("all")
  const [periodId, setPeriodId] = useState<string | null>(null)
  const [periodOptions, setPeriodOptions] = useState<Period[]>([])
  
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
  
  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (periodId) {
        params.append("periodId", periodId)
      }
      if (timeRange !== "all") {
        params.append("timePeriod", timeRange)
      }
      
      const response = await fetch(`/api/admin/statistics?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch statistics data")
      }
      
      const result = await response.json()
      setStatistics(result.data)
    } catch (error) {
      console.error("Error fetching statistics:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data statistik. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [periodId, timeRange, toast])
  
  useEffect(() => {
    fetchPeriods()
    fetchStatistics()
  }, [fetchPeriods, fetchStatistics])
  
  // Format data for charts
  const formatStatusData = () => {
    if (!statistics) return []
    
    return Object.entries(statistics.proposals.byStatus).map(([status, count]) => ({
      status: formatStatus(status),
      jumlah: count
    }))
  }
  
  const formatRoleData = () => {
    if (!statistics) return []
    
    return Object.entries(statistics.users.byRole).map(([role, count]) => ({
      role: formatRole(role),
      jumlah: count
    }))
  }
  
  const formatUnitKerjaData = () => {
    if (!statistics) return []
    
    return Object.entries(statistics.unitKerja.byJenjang).map(([jenjang, count]) => ({
      jenjang,
      jumlah: count
    }))
  }
  
  const formatDocumentStatusData = () => {
    if (!statistics) return []
    
    return Object.entries(statistics.documents.byStatus).map(([status, count]) => ({
      status: formatDocumentStatus(status),
      jumlah: count
    }))
  }
  
  // Helper functions to format values
  const formatStatus = (status: string) => {
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
  
  const formatRole = (role: string) => {
    const roleMap: Record<string, string> = {
      "ADMIN": "Admin",
      "PEGAWAI": "Pegawai",
      "OPERATOR": "Operator Dinas",
      "OPERATOR_SEKOLAH": "Operator Sekolah",
      "OPERATOR_UNIT_KERJA": "Operator Unit Kerja"
    }
    return roleMap[role] || role
  }
  
  const formatDocumentStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      "MENUNGGU_VERIFIKASI": "Menunggu Verifikasi",
      "PERLU_PERBAIKAN": "Perlu Perbaikan",
      "DISETUJUI": "Disetujui",
      "DITOLAK": "Ditolak"
    }
    return statusMap[status] || status
  }
  
  // Color mappings for charts
  const getStatusColors = () => {
    return {
      "Draft": "gray",
      "Diajukan": "blue",
      "Diproses Operator": "yellow",
      "Diproses Admin": "orange",
      "Ditolak Operator": "pink",
      "Ditolak": "red",
      "Ditolak Admin": "rose",
      "Disetujui Operator": "lime",
      "Disetujui Admin": "green",
      "Selesai": "emerald"
    }
  }
  
  const getRoleColors = () => {
    return {
      "Admin": "red",
      "Pegawai": "blue",
      "Operator Dinas": "green",
      "Operator Sekolah": "amber",
      "Operator Unit Kerja": "indigo"
    }
  }
  
  const getDocumentStatusColors = () => {
    return {
      "Menunggu Verifikasi": "blue",
      "Perlu Perbaikan": "orange",
      "Disetujui": "green",
      "Ditolak": "red"
    }
  }

  const handleExport = () => {
    // For a real implementation, we redirect to the export API
    window.location.href = `/api/admin/exports?format=csv&type=proposals${periodId ? `&periodId=${periodId}` : ''}`
  }
  
  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <FileBarChart className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Statistik & Analisis</h1>
                <p className="text-sky-100">Dashboard Kenaikan Pangkat</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Halaman ini menampilkan statistik dan visualisasi data dari sistem kenaikan pangkat.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Filters */}
        <Card className="shadow">
          <CardHeader>
            <CardTitle className="text-lg">Filter Statistik</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-center">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Rentang Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="week">7 Hari Terakhir</SelectItem>
                <SelectItem value="month">30 Hari Terakhir</SelectItem>
                <SelectItem value="year">1 Tahun Terakhir</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={periodId || ""} onValueChange={setPeriodId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Periode</SelectItem>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button className="ml-auto" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Ekspor Statistik
            </Button>
          </CardContent>
        </Card>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Memuat data statistik...</span>
          </div>
        ) : !statistics ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Tidak ada data statistik yang tersedia</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Dokumen</p>
                      <p className="text-3xl font-bold">{statistics.proposals.total}</p>
                    </div>
                    <FileCheck className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Pengguna</p>
                      <p className="text-3xl font-bold">{statistics.users.total}</p>
                    </div>
                    <UserCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Unit Kerja</p>
                      <p className="text-3xl font-bold">{statistics.unitKerja.total}</p>
                    </div>
                    <Building className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Berkas</p>
                      <p className="text-3xl font-bold">{statistics.documents.total}</p>
                    </div>
                    <FileBarChart className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts */}
            <Tabs defaultValue="proposals">
              <TabsList className="mb-4">
                <TabsTrigger value="proposals">Pengajuan</TabsTrigger>
                <TabsTrigger value="users">Pengguna</TabsTrigger>
                <TabsTrigger value="unitKerja">Unit Kerja</TabsTrigger>
                <TabsTrigger value="documents">Dokumen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="proposals">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Status Pengajuan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChart
                        data={formatStatusData()}
                        index="status"
                        categories={["jumlah"]}
                        colors={["indigo"]}
                        showLegend={false}
                        valueFormatter={(number: number) => `${Intl.NumberFormat("id").format(number)}`}
                        yAxisWidth={48}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Distribusi Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChart
                        data={formatStatusData()}
                        index="status"
                        category="jumlah"
                        colors={Object.values(getStatusColors())}
                        valueFormatter={(number: number) => `${Intl.NumberFormat("id").format(number)}`}
                        showTooltip={true}
                        showLabel={false}
                        className="h-60"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="users">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Pengguna Berdasarkan Peran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChart
                        data={formatRoleData()}
                        index="role"
                        categories={["jumlah"]}
                        colors={["blue"]}
                        showLegend={false}
                        valueFormatter={(number: number) => `${Intl.NumberFormat("id").format(number)}`}
                        yAxisWidth={48}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Distribusi Peran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DonutChart
                        data={formatRoleData()}
                        index="role"
                        category="jumlah"
                        colors={Object.values(getRoleColors())}
                        valueFormatter={(number: number) => `${Intl.NumberFormat("id").format(number)}`}
                        showTooltip={true}
                        className="h-60"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="unitKerja">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Unit Kerja Berdasarkan Jenjang</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChart
                        data={formatUnitKerjaData()}
                        index="jenjang"
                        categories={["jumlah"]}
                        colors={["green"]}
                        showLegend={false}
                        valueFormatter={(number: number) => `${Intl.NumberFormat("id").format(number)}`}
                        yAxisWidth={48}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Distribusi Jenjang</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PieChart
                        data={formatUnitKerjaData()}
                        index="jenjang"
                        category="jumlah"
                        valueFormatter={(number: number) => `${Intl.NumberFormat("id").format(number)}`}
                        showTooltip={true}
                        showLabel={false}
                        className="h-60"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Dokumen Berdasarkan Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChart
                        data={formatDocumentStatusData()}
                        index="status"
                        categories={["jumlah"]}
                        colors={["rose"]}
                        showLegend={false}
                        valueFormatter={(number: number) => `${Intl.NumberFormat("id").format(number)}`}
                        yAxisWidth={48}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">Distribusi Status Dokumen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DonutChart
                        data={formatDocumentStatusData()}
                        index="status"
                        category="jumlah"
                        colors={Object.values(getDocumentStatusColors())}
                        valueFormatter={(number: number) => `${Intl.NumberFormat("id").format(number)}`}
                        showTooltip={true}
                        className="h-60"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Recent Data */}
            <Card className="shadow">
              <CardHeader>
                <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                {statistics.recentData.activities.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Tidak ada aktivitas terbaru</p>
                ) : (
                  <div className="space-y-4">
                    {statistics.recentData.activities.map((activity) => (
                      <div key={activity.id} className="flex items-start border-b pb-4 last:border-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <UserCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.user.name} ({formatRole(activity.user.role)})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
