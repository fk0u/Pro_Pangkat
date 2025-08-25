"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Users } from "lucide-react"
import { SearchAndFilter } from "@/components/pegawai/search-and-filter"
import { PegawaiTable } from "@/components/pegawai/table"
import { useToast } from "@/hooks/use-toast"
interface PegawaiData {
  id: string
  nip: string
  nama: string
  email?: string
  jabatan: string
  golongan: string
  statusKepegawaian: string
  unitKerja: string
}

export default function PegawaiPage() {
  const [loading, setLoading] = useState(true)
  const [pegawaiList, setPegawaiList] = useState<PegawaiData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage] = useState(10)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiData | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    email: "",
    jabatan: "",
    golongan: "",
    jenisJabatan: "",
    phone: "",
    address: ""
  })
  
  const [submitting, setSubmitting] = useState(false)
  
  const { toast } = useToast()

  // Reset form
  const resetForm = () => {
    setFormData({
      nip: "",
      nama: "",
      email: "",
      jabatan: "",
      golongan: "",
      jenisJabatan: "",
      phone: "",
      address: ""
    })
  }

  // Handle view pegawai
  const handleViewPegawai = (pegawai: PegawaiData) => {
    setSelectedPegawai(pegawai)
    setIsViewModalOpen(true)
  }

  // Handle edit pegawai
  const handleEditPegawai = (pegawai: PegawaiData) => {
    setSelectedPegawai(pegawai)
    setFormData({
      nip: pegawai.nip,
      nama: pegawai.nama,
      email: pegawai.email || "",
      jabatan: pegawai.jabatan,
      golongan: pegawai.golongan,
      jenisJabatan: pegawai.statusKepegawaian,
      phone: "",
      address: ""
    })
    setIsEditModalOpen(true)
  }

  // Handle delete pegawai
  const handleDeletePegawai = async (pegawai: PegawaiData) => {
    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/operator-sekolah/pegawai/${pegawai.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Berhasil!",
          description: `Pegawai ${pegawai.nama} berhasil dihapus`,
        })
        loadPegawaiData()
      } else {
        throw new Error('Failed to delete pegawai')
      }
    } catch (error) {
      console.error('Error deleting pegawai:', error)
      toast({
        title: "Error",
        description: "Gagal menghapus pegawai",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle add pegawai
  const handleAddPegawai = async () => {
    try {
      setSubmitting(true)
      
      // Validasi input
      if (!formData.nip || !formData.nama) {
        toast({
          title: "Error",
          description: "NIP dan nama harus diisi",
          variant: "destructive"
        })
        return
      }
      
      const response = await fetch('/api/operator-sekolah/pegawai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nip: formData.nip,
          name: formData.nama,
          email: formData.email || null,
          jabatan: formData.jabatan || null,
          golongan: formData.golongan || null,
          jenisJabatan: formData.jenisJabatan || null,
          phone: formData.phone || null,
          address: formData.address || null
        })
      })

      if (response.ok) {
        toast({
          title: "Berhasil!",
          description: "Pegawai baru berhasil ditambahkan",
        })
        setIsAddModalOpen(false)
        resetForm()
        loadPegawaiData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add pegawai')
      }
    } catch (error) {
      console.error('Error adding pegawai:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menambahkan pegawai",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle update pegawai
  const handleUpdatePegawai = async () => {
    if (!selectedPegawai) return
    
    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/operator-sekolah/pegawai/${selectedPegawai.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.nama,
          email: formData.email || null,
          jabatan: formData.jabatan || null,
          golongan: formData.golongan || null,
          jenisJabatan: formData.jenisJabatan || null,
          phone: formData.phone || null,
          address: formData.address || null
        })
      })

      if (response.ok) {
        toast({
          title: "Berhasil!",
          description: "Data pegawai berhasil diperbarui",
        })
        setIsEditModalOpen(false)
        resetForm()
        setSelectedPegawai(null)
        loadPegawaiData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update pegawai')
      }
    } catch (error) {
      console.error('Error updating pegawai:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui pegawai",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Fetch data pegawai
  const loadPegawaiData = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: perPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter })
      })

      const response = await fetch(`/api/operator-sekolah/pegawai?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        
        // Map data dari API
        const mappedData = (result.data || []).map((item: ApiResponse) => ({
          id: item.id || '',
          nip: item.nip || '',
          nama: item.name || '',
          email: item.email || '',
          jabatan: item.jabatan || '',
          golongan: item.golongan || '',
          statusKepegawaian: item.jenisJabatan || 'PNS',
          unitKerja: typeof item.unitKerja === 'string' 
            ? item.unitKerja 
            : typeof item.unitKerja === 'object' && item.unitKerja !== null
              ? (item.unitKerja.nama || '') 
              : ''
        }))
        
        setPegawaiList(mappedData)
        setTotalCount(result.pagination?.totalCount || 0)
      } else {
        console.error('Failed to fetch pegawai data')
        toast({
          title: "Error",
          description: "Gagal memuat data pegawai",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading pegawai:", error)
      toast({
        title: "Error", 
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter, perPage, toast])

  // Load data saat komponen dimount dan filter berubah
  useEffect(() => {
    loadPegawaiData()
  }, [loadPegawaiData])

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Handle filter status
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getVariant = (status: string) => {
      switch (status) {
        case 'PNS': return 'default'
        case 'PPPK': return 'secondary'
        default: return 'outline'
      }
    }
    
    return <Badge variant={getVariant(status)}>{status}</Badge>
  }

  return (
    <div className="relative">
      <DashboardLayout userType="operator-sekolah">
        <div className="container mx-auto py-10 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          {loading ? (
            <>
              <div className="space-y-2">
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-4 w-[350px]" />
              </div>
              <Skeleton className="h-10 w-[150px]" />
            </>
          ) : (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Manajemen Pegawai</h1>
                <p className="text-muted-foreground">
                  Kelola data pegawai di unit kerja Anda
                </p>
              </div>
              <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Pegawai
              </Button>
            </>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalCount}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PNS</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {pegawaiList.filter(p => p.statusKepegawaian === 'PNS').length}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PPPK</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {pegawaiList.filter(p => p.statusKepegawaian === 'PPPK').length}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter & Table Section */}
        <Card>
          <CardContent className="space-y-6">
            <div>
              <SearchAndFilter
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={handleSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilter}
              />
            </div>
            <div>
              <PegawaiTable
                loading={loading}
                data={pegawaiList}
                onView={handleViewPegawai}
                onEdit={handleEditPegawai}
                onDelete={handleDeletePegawai}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pegawai</CardTitle>
            <CardDescription>
              Menampilkan {pegawaiList.length} dari {totalCount} pegawai
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                <span>Memuat data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIP</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Golongan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pegawaiList.length > 0 ? (
                      pegawaiList.map((pegawai) => (
                        <TableRow key={pegawai.id}>
                          <TableCell className="font-mono text-sm">
                            {pegawai.nip || '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {pegawai.nama || '-'}
                          </TableCell>
                          <TableCell>
                            {pegawai.jabatan || '-'}
                          </TableCell>
                          <TableCell className="font-mono">
                            {pegawai.golongan || '-'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={pegawai.statusKepegawaian || 'PNS'} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewPegawai(pegawai)}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditPegawai(pegawai)}
                                title="Edit Data"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    title="Hapus Pegawai"
                                    disabled={submitting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus pegawai <strong>{pegawai.nama}</strong>? 
                                      Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeletePegawai(pegawai)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada data pegawai ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Show range and per-page selector */}
        <div className="flex items-center justify-between mb-4">
          <div>
            Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center space-x-2">
            <span>Show</span>
            <Select value={perPage.toString()} onValueChange={val => { setPerPage(Number(val)); setCurrentPage(1); }} className="w-20">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10,20,50,100].map(n => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button disabled={currentPage === 1} onClick={() => setCurrentPage(page => page - 1)}>Previous</Button>
          <span>Page {currentPage} of {Math.ceil(totalCount / perPage)}</span>
          <Button disabled={currentPage >= Math.ceil(totalCount / perPage)} onClick={() => setCurrentPage(page => page + 1)}>Next</Button>
        </div>

        {/* Modal Tambah Pegawai */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Pegawai Baru</DialogTitle>
              <DialogDescription>
                Lengkapi data pegawai baru untuk unit kerja Anda
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Masukkan NIP"
                />
              </div>
              <div>
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Masukkan email"
                />
              </div>
              <div>
                <Label htmlFor="jabatan">Jabatan</Label>
                <Input
                  id="jabatan"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Masukkan jabatan"
                />
              </div>
              <div>
                <Label htmlFor="golongan">Golongan</Label>
                <Input
                  id="golongan"
                  value={formData.golongan}
                  onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                  placeholder="Contoh: III/a"
                />
              </div>
              <div>
                <Label htmlFor="jenisJabatan">Status Kepegawaian</Label>
                <Select value={formData.jenisJabatan} onValueChange={(value) => setFormData({ ...formData, jenisJabatan: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PNS">PNS</SelectItem>
                    <SelectItem value="PPPK">PPPK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">No. Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Masukkan no. telepon"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddPegawai} disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Edit Pegawai */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Data Pegawai</DialogTitle>
              <DialogDescription>
                Perbarui data pegawai {selectedPegawai?.nama}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nip">NIP</Label>
                <Input
                  id="edit-nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Masukkan NIP"
                />
              </div>
              <div>
                <Label htmlFor="edit-nama">Nama Lengkap</Label>
                <Input
                  id="edit-nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Masukkan email"
                />
              </div>
              <div>
                <Label htmlFor="edit-jabatan">Jabatan</Label>
                <Input
                  id="edit-jabatan"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Masukkan jabatan"
                />
              </div>
              <div>
                <Label htmlFor="edit-golongan">Golongan</Label>
                <Input
                  id="edit-golongan"
                  value={formData.golongan}
                  onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                  placeholder="Contoh: III/a"
                />
              </div>
              <div>
                <Label htmlFor="edit-jenisJabatan">Status Kepegawaian</Label>
                <Select value={formData.jenisJabatan} onValueChange={(value) => setFormData({ ...formData, jenisJabatan: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PNS">PNS</SelectItem>
                    <SelectItem value="PPPK">PPPK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-phone">No. Telepon</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Masukkan no. telepon"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-address">Alamat</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleUpdatePegawai} disabled={submitting}>
                {submitting ? "Memperbarui..." : "Perbarui"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal View Pegawai */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Pegawai</DialogTitle>
              <DialogDescription>
                Informasi lengkap pegawai {selectedPegawai?.nama}
              </DialogDescription>
            </DialogHeader>
            {selectedPegawai && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">NIP</Label>
                  <p className="text-sm font-mono">{selectedPegawai.nip || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nama Lengkap</Label>
                  <p className="text-sm">{selectedPegawai.nama || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{selectedPegawai.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Jabatan</Label>
                  <p className="text-sm">{selectedPegawai.jabatan || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Golongan</Label>
                  <p className="text-sm font-mono">{selectedPegawai.golongan || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status Kepegawaian</Label>
                  <StatusBadge status={selectedPegawai.statusKepegawaian || 'PNS'} />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Unit Kerja</Label>
                  <p className="text-sm">{selectedPegawai.unitKerja || '-'}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Tutup
              </Button>
              <Button onClick={() => {
                setIsViewModalOpen(false)
                if (selectedPegawai) handleEditPegawai(selectedPegawai)
              }}>
                Edit Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
