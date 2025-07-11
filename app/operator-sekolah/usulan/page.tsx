"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  Eye, 
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  status: "menunggu_verifikasi" | "sedang_diproses" | "disetujui" | "ditolak" | "butuh_perbaikan" | "ditarik"
  rawStatus: string
  keterangan?: string
  dokumenLengkap: boolean
  createdAt: string
  updatedAt: string
}


const getStatusBadge = (status: string) => {
  const statusConfig = {
    menunggu_verifikasi: { variant: "secondary" as const, label: "Menunggu Verifikasi", icon: Clock },
    sedang_diproses: { variant: "default" as const, label: "Sedang Diproses", icon: Clock },
    disetujui: { variant: "default" as const, label: "Disetujui", icon: CheckCircle, className: "bg-green-500" },
    ditolak: { variant: "destructive" as const, label: "Ditolak", icon: XCircle },
    butuh_perbaikan: { variant: "outline" as const, label: "Butuh Perbaikan", icon: AlertTriangle, className: "border-orange-500 text-orange-600" },
    ditarik: { variant: "outline" as const, label: "Ditarik", icon: XCircle, className: "border-gray-400 text-gray-500" }
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

// Function to determine the next golongan level
const getNextGolongan = (currentGolongan: string): string => {
  const golonganMap: Record<string, string> = {
    'I/a': 'I/b',
    'I/b': 'I/c',
    'I/c': 'I/d',
    'I/d': 'II/a',
    'II/a': 'II/b',
    'II/b': 'II/c',
    'II/c': 'II/d',
    'II/d': 'III/a',
    'III/a': 'III/b',
    'III/b': 'III/c',
    'III/c': 'III/d',
    'III/d': 'IV/a',
    'IV/a': 'IV/b',
    'IV/b': 'IV/c',
    'IV/c': 'IV/d',
    'IV/d': 'IV/e',
    'IV/e': 'IV/e' // No higher level
  }
  
  return golonganMap[currentGolongan] || 'III/b' // Default to III/b if unknown
}

export default function OperatorSekolahUsulanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [usulanData, setUsulanData] = useState<Usulan[]>([])
  const [filteredData, setFilteredData] = useState<Usulan[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedUsulan, setSelectedUsulan] = useState<Usulan | null>(null)
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false)
  const [processAction, setProcessAction] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE')
  const [processNotes, setProcessNotes] = useState('')
  const [processingAction, setProcessingAction] = useState(false)
  
  const { toast } = useToast()

  // Fetch data dari API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operator-sekolah/usulan')
      
      if (response.ok) {
        const data = await response.json()
        // Disable lint for explicit any
        // Map API response; disable explicit any lint for this line
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedData = (data.usulan as any[]).map((item: any) => ({
            id: item.id,
            nip: item.pegawai?.nip || '',
            nama: item.pegawai?.name || '',
            golonganAsal: item.pegawai?.golongan || 'III/a',
            golonganTujuan: getNextGolongan(item.pegawai?.golongan || 'III/a'),
            jabatan: item.pegawai?.jabatan || '',
            unitKerja: typeof item.pegawai?.unitKerja === 'string' 
              ? item.pegawai.unitKerja 
              : typeof item.pegawai?.unitKerja === 'object' && item.pegawai?.unitKerja !== null
                ? (item.pegawai.unitKerja.nama || '') 
                : '',
            tanggalUsulan: item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '',
            status: mapApiStatusToLocal(item.status),
            rawStatus: item.status,
            keterangan: item.notes || '',
            dokumenLengkap: (item.documents || []).length > 0,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt || item.createdAt
          }))
          // Filter out usulan with status "ditarik" as they should not be shown
          .filter((usulan: Usulan) => usulan.status !== 'ditarik')
        
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
  }, [toast])

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
      'DITOLAK_SEKOLAH': 'ditolak',
      'DITOLAK_DINAS': 'ditolak',
      'DITOLAK_ADMIN': 'ditolak',
      'DIKEMBALIKAN_OPERATOR': 'butuh_perbaikan',
      'DIKEMBALIKAN_ADMIN': 'butuh_perbaikan',
      'MENUNGGU_VERIFIKASI_DINAS': 'menunggu_verifikasi',
      'MENUNGGU_VERIFIKASI_SEKOLAH': 'menunggu_verifikasi',
      'MENUNGGU_KONFIRMASI': 'menunggu_verifikasi',
      'PERLU_PERBAIKAN_DARI_DINAS': 'butuh_perbaikan',
      'PERLU_PERBAIKAN_DARI_SEKOLAH': 'butuh_perbaikan',
      'DISETUJUI_SEKOLAH': 'sedang_diproses',
      'DITARIK': 'ditarik' // Add status for withdrawn proposals
    }
    return statusMap[apiStatus] || 'menunggu_verifikasi'
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

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


  const getStatsData = () => {
    const stats = {
      total: usulanData.length,
      menunggu: usulanData.filter(u => u.status === 'menunggu_verifikasi').length,
      diproses: usulanData.filter(u => u.status === 'sedang_diproses').length,
      disetujui: usulanData.filter(u => u.status === 'disetujui').length,
      ditolak: usulanData.filter(u => u.status === 'ditolak').length,
      perbaikan: usulanData.filter(u => u.status === 'butuh_perbaikan').length,
      ditarik: usulanData.filter(u => u.status === 'ditarik').length
    }
    return stats
  }

  // Fungsi handleViewDocuments dan handleApproveDocument dihapus karena tombol dokumen sudah tidak ada
  // dan operator-sekolah tidak boleh menyetujui dokumen

  const stats = getStatsData()
  
  /* 
  // These functions are kept for reference but not currently used
  const handleRejectDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'DITOLAK' })
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Dokumen telah ditolak",
          variant: "destructive"
        })
        // Refresh data after rejection
        fetchData()
      } else {
        const errorData = await response.json()
        toast({
          title: "Gagal",
          description: errorData.message || "Gagal menolak dokumen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error rejecting document:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menolak dokumen",
        variant: "destructive"
      })
    }
  }

  const handleApproveProposal = (usulan: Usulan) => {
    if (!usulan.dokumenLengkap) {
      toast({
        title: "Tidak dapat disetujui",
        description: "Pastikan semua dokumen telah diunggah dan disetujui terlebih dahulu",
        variant: "destructive"
      })
      return
    }
    
    setSelectedUsulan(usulan)
    setIsProcessingModalOpen(true)
    setProcessAction('APPROVE')
  }
  */

  const handleSubmitProcess = async () => {
    if (!selectedUsulan) return
    
    try {
      setProcessingAction(true)
      
      const response = await fetch('/api/operator-sekolah/usulan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usulanId: selectedUsulan.id,
          action: processAction,
          notes: processNotes
        })
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: processAction === 'APPROVE' 
            ? "Usulan telah disetujui dan diteruskan ke operator" 
            : processAction === 'REJECT'
              ? "Usulan telah ditolak"
              : "Usulan telah dikembalikan untuk perbaikan",
          variant: processAction === 'REJECT' ? "destructive" : "default"
        })
        // Close modal and refresh data
        setIsProcessingModalOpen(false)
        setProcessNotes('')
        fetchData()
      } else {
        const errorData = await response.json()
        toast({
          title: "Gagal",
          description: errorData.message || "Gagal memproses usulan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error processing proposal:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memproses usulan",
        variant: "destructive"
      })
    } finally {
      setProcessingAction(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="flex justify-center items-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
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
                    <SelectItem value="ditarik">Ditarik</SelectItem>
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
                              onClick={() => router.push(`/operator-sekolah/usulan/${usulan.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                            {(usulan.status === 'menunggu_verifikasi' && usulan.rawStatus !== 'MENUNGGU_VERIFIKASI_DINAS') && (
                              <>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUsulan(usulan);
                                    setProcessAction('REJECT');
                                    setIsProcessingModalOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Tolak
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedUsulan(usulan);
                                    setProcessAction('APPROVE');
                                    setIsProcessingModalOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Setujui
                                </Button>
                              </>
                            )}
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
                <p>Detail usulan akan ditampilkan di sini...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Process Proposal Modal */}
        <Dialog open={isProcessingModalOpen} onOpenChange={setIsProcessingModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {processAction === 'APPROVE' ? 'Setujui Usulan' : 
                 processAction === 'REJECT' ? 'Tolak Usulan' : 'Kembalikan Usulan'}
              </DialogTitle>
              <DialogDescription>
                {processAction === 'APPROVE' 
                  ? 'Usulan akan disetujui dan diteruskan ke operator untuk diproses lebih lanjut.'
                  : processAction === 'REJECT'
                    ? 'Usulan akan ditolak dan tidak dapat diproses lebih lanjut.'
                    : 'Usulan akan dikembalikan ke pegawai untuk perbaikan.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  placeholder="Tambahkan catatan (opsional)"
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProcessingModalOpen(false)}>
                Batal
              </Button>
              <Button 
                variant={processAction === 'REJECT' ? "destructive" : "default"}
                onClick={handleSubmitProcess}
                disabled={processingAction}
              >
                {processingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {processAction === 'APPROVE' ? 'Setujui dan Teruskan' : 
                 processAction === 'REJECT' ? 'Tolak Usulan' : 'Kembalikan Usulan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
