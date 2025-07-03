"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  FileSpreadsheet,
  Loader2,
  X,
  ArrowLeft,
  User,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Usulan {
  id: string
  nip: string
  nama: string
  golonganAsal: string
  golonganTujuan: string
  jabatan: string
  unitKerja: string
  tanggalUsulan: string
  status: "menunggu_verifikasi" | "sedang_diproses" | "disetujui" | "ditolak" | "butuh_perbaikan"
  keterangan?: string
  dokumenLengkap: boolean
  createdAt: string
  updatedAt: string
}

interface PegawaiOption {
  id: string
  nip: string
  nama: string
  jabatan: string
  golongan: string
  unitKerja: string
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    menunggu_verifikasi: { variant: "secondary" as const, label: "Menunggu Verifikasi", icon: Clock },
    sedang_diproses: { variant: "default" as const, label: "Sedang Diproses", icon: Clock },
    disetujui: { variant: "default" as const, label: "Disetujui", icon: CheckCircle, className: "bg-green-500" },
    ditolak: { variant: "destructive" as const, label: "Ditolak", icon: XCircle },
    butuh_perbaikan: { variant: "outline" as const, label: "Butuh Perbaikan", icon: AlertTriangle, className: "border-orange-500 text-orange-600" }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.menunggu_verifikasi
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={"className" in config ? config.className : ""}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  )
}

export default function OperatorSekolahUsulanPage() {
  const [loading, setLoading] = useState(true)
  const [usulanData, setUsulanData] = useState<Usulan[]>([])
  const [filteredData, setFilteredData] = useState<Usulan[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedUsulan, setSelectedUsulan] = useState<Usulan | null>(null)
  const { toast } = useToast()

  // Fetch data dari API
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operator-sekolah/usulan')
      
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match interface
        const transformedData = data.usulan.map((item: any) => ({
          id: item.id,
          nip: item.pegawai?.nip || '',
          nama: item.pegawai?.name || '',
          golonganAsal: item.pegawai?.golongan || 'III/a',
          golonganTujuan: 'III/b', // Default progression
          jabatan: item.pegawai?.jabatan || '',
          unitKerja: item.pegawai?.unitKerja || '',
          tanggalUsulan: item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '',
          status: mapApiStatusToLocal(item.status),
          keterangan: item.notes || '',
          dokumenLengkap: (item.documents || []).length > 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt || item.createdAt
        }))
        
        setUsulanData(transformedData)
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data usulan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Map API status to local status
  const mapApiStatusToLocal = (apiStatus: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'menunggu_verifikasi',
      'SUBMITTED': 'menunggu_verifikasi',
      'PENDING': 'menunggu_verifikasi',
      'APPROVED': 'disetujui',
      'REJECTED': 'ditolak',
      'DISETUJUI_OPERATOR': 'sedang_diproses',
      'DIPROSES_ADMIN': 'sedang_diproses',
      'SELESAI': 'disetujui',
      'DITOLAK': 'ditolak',
      'DIKEMBALIKAN_OPERATOR': 'butuh_perbaikan',
      'DIKEMBALIKAN_ADMIN': 'butuh_perbaikan',
      'MENUNGGU_VERIFIKASI_DINAS': 'menunggu_verifikasi',
      'MENUNGGU_VERIFIKASI_SEKOLAH': 'menunggu_verifikasi',
      'PERLU_PERBAIKAN_DARI_DINAS': 'butuh_perbaikan',
      'PERLU_PERBAIKAN_DARI_SEKOLAH': 'butuh_perbaikan'
    }
    return statusMap[apiStatus] || 'menunggu_verifikasi'
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = usulanData

    // Filter berdasarkan pencarian
    if (searchQuery) {
      filtered = filtered.filter(
        (usulan) =>
          usulan.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          usulan.nip.includes(searchQuery) ||
          usulan.unitKerja.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter berdasarkan status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((usulan) => usulan.status === statusFilter)
    }

    setFilteredData(filtered)
  }, [usulanData, searchQuery, statusFilter])

  const handleViewUsulan = (usulan: Usulan) => {
    setSelectedUsulan(usulan)
    setIsViewModalOpen(true)
  }

  const getStatsData = () => {
    const stats = {
      total: usulanData.length,
      menunggu: usulanData.filter(u => u.status === 'menunggu_verifikasi').length,
      diproses: usulanData.filter(u => u.status === 'sedang_diproses').length,
      disetujui: usulanData.filter(u => u.status === 'disetujui').length,
      ditolak: usulanData.filter(u => u.status === 'ditolak').length,
      perbaikan: usulanData.filter(u => u.status === 'butuh_perbaikan').length
    }
    return stats
  }

  const stats = getStatsData()

  if (loading) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat data usulan...</p>
          </div>
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
            <h1 className="text-3xl font-bold tracking-tight">Usulan Kenaikan Pangkat</h1>
            <p className="text-muted-foreground">
              Kelola dan verifikasi usulan kenaikan pangkat pegawai
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.menunggu}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diproses</CardTitle>
              <Loader2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.diproses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.disetujui}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ditolak}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter dan Pencarian</CardTitle>
            <CardDescription>
              Filter usulan berdasarkan status dan cari berdasarkan nama atau NIP pegawai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama, NIP, atau unit kerja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
                    <SelectItem value="sedang_diproses">Sedang Diproses</SelectItem>
                    <SelectItem value="disetujui">Disetujui</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                    <SelectItem value="butuh_perbaikan">Butuh Perbaikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Usulan Kenaikan Pangkat</CardTitle>
            <CardDescription>
              Menampilkan {filteredData.length} dari {usulanData.length} usulan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Kenaikan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchQuery || statusFilter !== "all" ? 
                            "Tidak ada usulan yang sesuai dengan filter" : 
                            "Belum ada usulan kenaikan pangkat"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((usulan) => (
                      <TableRow key={usulan.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{usulan.nama}</p>
                            <p className="text-sm text-muted-foreground">{usulan.nip}</p>
                          </div>
                        </TableCell>
                        <TableCell>{usulan.jabatan}</TableCell>
                        <TableCell>{usulan.unitKerja}</TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-600">
                            {usulan.golonganAsal} → {usulan.golonganTujuan}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(usulan.status)}
                        </TableCell>
                        <TableCell>{usulan.tanggalUsulan}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUsulan(usulan)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Detail Usulan */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Usulan Kenaikan Pangkat</DialogTitle>
              <DialogDescription>
                Informasi lengkap usulan untuk {selectedUsulan?.nama}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUsulan && (
              <div className="space-y-6 mt-4">
                {/* Data Pegawai dan Usulan */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Data Pegawai */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">Data Pegawai</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">NIP</Label>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-300 font-mono text-sm text-gray-900">
                          {selectedUsulan.nip}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Nama</Label>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-300 text-sm text-gray-900 font-medium">
                          {selectedUsulan.nama}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Jabatan</Label>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-300 text-sm text-gray-900">
                          {selectedUsulan.jabatan}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Unit Kerja</Label>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-300 text-sm text-gray-900">
                          {selectedUsulan.unitKerja}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Usulan */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">Data Usulan</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Kenaikan Pangkat</Label>
                        <div className="mt-1 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded border border-blue-200 text-sm">
                          <span className="font-semibold text-blue-700">
                            {selectedUsulan.golonganAsal}
                          </span>
                          <span className="mx-2 text-gray-500">→</span>
                          <span className="font-semibold text-green-700">
                            {selectedUsulan.golonganTujuan}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Periode</Label>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-300 text-sm text-gray-900">
                          2025
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-300">
                          {getStatusBadge(selectedUsulan.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Tanggal Diajukan</Label>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-300 text-sm text-gray-900">
                          {selectedUsulan.tanggalUsulan}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Keterangan</Label>
                        <div className="mt-1 p-3 bg-yellow-50 rounded border border-yellow-300 text-sm text-yellow-800 font-medium">
                          Harap mengupload dokumen
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Dokumen */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2">Status Dokumen</h4>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-lg">
                    <div className="flex gap-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Informasi Penting</p>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          Pegawai <strong className="text-blue-900">{selectedUsulan.nama}</strong> harus login dan mengupload 
                          dokumen yang diperlukan. Usulan akan diproses setelah semua dokumen lengkap.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="bg-gray-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-700 mb-1">Belum ada dokumen yang diupload</p>
                    <p className="text-sm text-gray-500">Pegawai perlu mengupload dokumen persyaratan</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-6 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </Button>
              <Button className="px-6 bg-blue-600 hover:bg-blue-700 text-white">
                Edit Usulan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
