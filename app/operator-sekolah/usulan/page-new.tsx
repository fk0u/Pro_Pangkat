"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UsulanModal } from "@/components/usulan-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { FileText, Search, Eye, Edit, Download, Filter, Plus, CheckCircle, Clock, AlertTriangle, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Usulan {
  id: string
  pegawaiId: string
  pegawai?: {
    nip: string
    nama: string
    jabatan: string
    golongan: string
    unitKerja: string
    statusKepegawaian: string
  }
  periode: string
  jenisUsulan: string
  golonganTujuan: string
  statusVerifikasi: string
  keterangan?: string
  tanggalUsulan: string
  tanggalVerifikasi?: string
  verifikasiOleh?: string
  documents?: Array<{
    id: string
    nama: string
    jenis: string
    ukuran: string
    url: string
  }>
  createdAt?: string
  updatedAt?: string
}

interface PegawaiOption {
  id: string
  nip: string
  nama: string
  jabatan: string
  golongan: string
}

export default function OperatorSekolahUsulanPage() {
  const [usulanData, setUsulanData] = useState<Usulan[]>([])
  const [pegawaiOptions, setPegawaiOptions] = useState<PegawaiOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedUsulan, setSelectedUsulan] = useState<Usulan | null>(null)
  
  const { toast } = useToast()

  const itemsPerPage = 10

  useEffect(() => {
    fetchUsulanData()
    fetchPegawaiOptions()
  }, [currentPage, search, statusFilter])

  const fetchUsulanData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter })
      })

      const response = await fetch(`/api/operator-sekolah/usulan?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsulanData(data.usulan || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.totalCount || 0)
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data usulan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching usulan:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPegawaiOptions = async () => {
    try {
      const response = await fetch('/api/operator-sekolah/pegawai?limit=1000')
      if (response.ok) {
        const data = await response.json()
        const options = data.pegawai?.map((p: any) => ({
          id: p.id,
          nip: p.nip,
          nama: p.nama,
          jabatan: p.jabatan,
          golongan: p.golongan
        })) || []
        setPegawaiOptions(options)
      }
    } catch (error) {
      console.error("Error fetching pegawai options:", error)
    }
  }

  const handleViewUsulan = (usulan: Usulan) => {
    setSelectedUsulan(usulan)
    setModalMode('view')
    setModalOpen(true)
  }

  const handleEditUsulan = (usulan: Usulan) => {
    setSelectedUsulan(usulan)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleCreateUsulan = () => {
    setSelectedUsulan(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleSaveUsulan = async (data: Partial<Usulan>, files?: FileList | null) => {
    try {
      let response
      
      if (modalMode === 'create') {
        // For create, handle file uploads with FormData
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value.toString())
          }
        })
        
        if (files) {
          Array.from(files).forEach((file, index) => {
            formData.append(`files`, file)
          })
        }

        response = await fetch('/api/operator-sekolah/usulan', {
          method: 'POST',
          body: formData
        })
      } else if (modalMode === 'edit' && selectedUsulan) {
        // For edit, just send JSON data (file upload can be separate)
        response = await fetch(`/api/operator-sekolah/usulan/${selectedUsulan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      }

      if (response?.ok) {
        toast({
          title: "Sukses",
          description: `Usulan berhasil ${modalMode === 'create' ? 'ditambahkan' : 'diperbarui'}`,
        })
        fetchUsulanData()
        setModalOpen(false)
      } else {
        const errorData = await response?.json()
        toast({
          title: "Error",
          description: errorData?.message || "Terjadi kesalahan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error saving usulan:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan data",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUsulan = async (usulan: Usulan) => {
    try {
      const response = await fetch(`/api/operator-sekolah/usulan/${usulan.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Usulan berhasil dihapus",
        })
        fetchUsulanData()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData?.message || "Gagal menghapus usulan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting usulan:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus data",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      'DRAFT': { variant: 'outline', icon: <Edit className="h-3 w-3" /> },
      'DIAJUKAN': { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      'DIVERIFIKASI': { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      'DIKEMBALIKAN': { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
      'DISETUJUI': { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      'DITOLAK': { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> }
    }
    const config = variants[status] || { variant: 'outline' as const, icon: null }
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const resetFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usulan Kenaikan Pangkat</h1>
            <p className="text-muted-foreground">
              Kelola usulan kenaikan pangkat pegawai
            </p>
          </div>
          <Button onClick={handleCreateUsulan} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tambah Usulan
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usulanData.filter(u => u.statusVerifikasi === 'DRAFT').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diajukan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usulanData.filter(u => u.statusVerifikasi === 'DIAJUKAN').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diverifikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usulanData.filter(u => u.statusVerifikasi === 'DIVERIFIKASI').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usulanData.filter(u => u.statusVerifikasi === 'DISETUJUI').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama pegawai atau NIP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status Verifikasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                  <SelectItem value="DIVERIFIKASI">Diverifikasi</SelectItem>
                  <SelectItem value="DIKEMBALIKAN">Dikembalikan</SelectItem>
                  <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                  <SelectItem value="DITOLAK">Ditolak</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetFilters} className="flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" onClick={fetchUsulanData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Usulan</CardTitle>
            <CardDescription>
              Menampilkan {usulanData.length} dari {totalCount} usulan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="ml-2">Memuat data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Jenis Usulan</TableHead>
                      <TableHead>Golongan Tujuan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usulanData.map((usulan) => (
                      <TableRow key={usulan.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{usulan.pegawai?.nama}</p>
                            <p className="text-sm text-muted-foreground">{usulan.pegawai?.nip}</p>
                            <p className="text-xs text-muted-foreground">{usulan.pegawai?.jabatan}</p>
                          </div>
                        </TableCell>
                        <TableCell>{usulan.periode}</TableCell>
                        <TableCell>{usulan.jenisUsulan}</TableCell>
                        <TableCell className="font-mono">{usulan.golonganTujuan}</TableCell>
                        <TableCell>{getStatusBadge(usulan.statusVerifikasi)}</TableCell>
                        <TableCell>{formatDate(usulan.tanggalUsulan)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUsulan(usulan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUsulan(usulan)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Usulan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus usulan untuk {usulan.pegawai?.nama}? 
                                    Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUsulan(usulan)}>
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {usulanData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada data usulan ditemukan
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        <UsulanModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          usulan={selectedUsulan}
          mode={modalMode}
          onSave={handleSaveUsulan}
          pegawaiOptions={pegawaiOptions}
        />
      </div>
    </DashboardLayout>
  )
}
