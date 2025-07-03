"use client"

import { useState, useEffect, useCallback } from "react"
import { User, Search, Plus, MapPin, Clock, Mail, Phone, Calendar, Building2, GraduationCap, Users2, Import, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DashboardLayout } from "@/components/dashboard-layout"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Interfaces
interface WilayahMaster {
  id: string
  kode: string
  nama: string
  namaLengkap: string
  ibukota: string
}

interface UnitKerja {
  id: string
  nama: string
  jenjang: string
  npsn: string | null
}

interface Pegawai {
  id: string
  nama: string
  email: string
  nip: string | null
  nuptk: string | null
  phone: string | null
  alamat: string | null
  kecamatan: string | null
  pendidikan: string | null
  jabatan: string | null
  unitKerjaId: string | null
  unitKerja: UnitKerja | null
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
  wilayahNama: string
  status: string
  jenisKelamin: string | null
  tanggalLahir: Date | null
  agama: string | null
  createdAt: string
  updatedAt: string
}

interface OperatorInfo {
  role: string
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
}

interface PegawaiSummary {
  total: number
  byStatus: Record<string, number>
  byJabatan: Record<string, number>
  byPendidikan: Record<string, number>
  byJenisKelamin: Record<string, number>
}

// Main Component
export default function OperatorPegawaiEnhancedPage() {
  // Core Data State
  const [data, setData] = useState<Pegawai[]>([])
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<UnitKerja[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<PegawaiSummary>({
    total: 0,
    byStatus: {},
    byJabatan: {},
    byPendidikan: {},
    byJenisKelamin: {}
  })

  // Operator & Wilayah Info
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('AKTIF')
  const [jabatanFilter, setJabatanFilter] = useState('all')
  const [unitKerjaFilter, setUnitKerjaFilter] = useState('all')
  const [pendidikanFilter, setPendidikanFilter] = useState('all')

  // UI & Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null)
  
  // Add Form State
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nama: '', email: '', nip: '', nuptk: '', phone: '', alamat: '', kecamatan: '',
    pendidikan: '', jabatan: '', unitKerjaId: '', status: 'AKTIF',
    jenisKelamin: '', tanggalLahir: '', agama: ''
  })

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importing, setImporting] = useState(false)

  // Auto-refresh interval
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Context & Hooks
  const { toast } = useToast()

  // Data Fetching with Real-time Support
  const fetchPegawaiData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        jabatan: jabatanFilter,
        unitKerja: unitKerjaFilter,
        pendidikan: pendidikanFilter,
      })
      
      const response = await fetch(`/api/pegawai?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) throw new Error('Gagal memuat data pegawai')
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data || [])
        setSummary(result.summary || {
          total: 0,
          byStatus: {},
          byJabatan: {},
          byPendidikan: {},
          byJenisKelamin: {}
        })
        
        // Set operator info from response
        if (result.userInfo) {
          setOperatorInfo({
            role: result.userInfo.role || '',
            wilayah: result.userInfo.wilayah,
            wilayahRelasi: result.userInfo.wilayahRelasi
          })
        }
      }
    } catch (error) {
      console.error('Error fetching pegawai:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, jabatanFilter, unitKerjaFilter, pendidikanFilter, toast])

  // Fetch Unit Kerja Options
  const fetchUnitKerjaOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/unit-kerja?minimal=true')
      if (!response.ok) throw new Error('Gagal memuat unit kerja')
      
      const result = await response.json()
      if (result.success) {
        setUnitKerjaOptions(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching unit kerja options:', error)
    }
  }, [])

  // Auto-refresh data every 30 seconds
  const startAutoRefresh = useCallback(() => {
    const interval = setInterval(() => {
      fetchPegawaiData()
    }, 30000) // 30 seconds
    setRefreshInterval(interval)
  }, [fetchPegawaiData])

  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [refreshInterval])

  // Effects for data loading and auto-refresh
  useEffect(() => {
    fetchPegawaiData()
    fetchUnitKerjaOptions()
  }, [fetchPegawaiData, fetchUnitKerjaOptions])

  useEffect(() => {
    // Start auto-refresh when component mounts
    startAutoRefresh()
    
    // Cleanup on unmount
    return () => {
      stopAutoRefresh()
    }
  }, [startAutoRefresh, stopAutoRefresh])

  // Form Handling
  const resetAddForm = () => {
    setFormData({ 
      nama: '', email: '', nip: '', nuptk: '', phone: '', alamat: '', kecamatan: '',
      pendidikan: '', jabatan: '', unitKerjaId: '', status: 'AKTIF',
      jenisKelamin: '', tanggalLahir: '', agama: ''
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Enhanced validation
      if (!formData.nama || !formData.email) {
        throw new Error('Nama dan Email wajib diisi')
      }

      const response = await fetch('/api/pegawai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menambahkan pegawai')
      }
      
      toast({ 
        title: "Berhasil", 
        description: "Data pegawai berhasil ditambahkan." 
      })
      
      setShowAddDialog(false)
      resetAddForm()
      fetchPegawaiData() // Refresh data
      
    } catch (error) {
      console.error('Error adding pegawai:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "destructive" 
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Import Handling
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return
    
    setImporting(true)
    setImportProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const response = await fetch('/api/pegawai/import', {
        method: 'POST',
        body: formData,
      })
      
      clearInterval(progressInterval)
      setImportProgress(100)
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengimpor data')
      }
      
      toast({ 
        title: "Berhasil", 
        description: `${result.imported} data pegawai berhasil diimpor.` 
      })
      
      setShowImportDialog(false)
      setImportFile(null)
      setImportProgress(0)
      fetchPegawaiData() // Refresh data
      
    } catch (error) {
      console.error('Error importing pegawai:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "destructive" 
      })
    } finally {
      setImporting(false)
    }
  }

  // Export Handling
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        jabatan: jabatanFilter,
        unitKerja: unitKerjaFilter,
        pendidikan: pendidikanFilter,
        format: 'xlsx'
      })
      
      const response = await fetch(`/api/pegawai/export?${params}`)
      if (!response.ok) throw new Error('Gagal mengekspor data')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `pegawai_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast({ 
        title: "Berhasil", 
        description: "Data pegawai berhasil diekspor." 
      })
      
    } catch (error) {
      console.error('Error exporting pegawai:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "destructive" 
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'AKTIF': return 'bg-green-100 text-green-800'
      case 'TIDAK_AKTIF': return 'bg-red-100 text-red-800'
      case 'PENSIUN': return 'bg-gray-100 text-gray-800'
      case 'MUTASI': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getJabatanColor = (jabatan: string) => {
    switch (jabatan) {
      case 'Kepala Sekolah': return 'bg-purple-100 text-purple-800'
      case 'Wakil Kepala Sekolah': return 'bg-blue-100 text-blue-800'
      case 'Guru Kelas': return 'bg-green-100 text-green-800'
      case 'Guru Mata Pelajaran': return 'bg-orange-100 text-orange-800'
      case 'Staf TU': return 'bg-gray-100 text-gray-800'
      case 'Tenaga Kependidikan': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Render Dashboard with Real-time Data
  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Enhanced Header with Wilayah Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Users2 className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-3xl font-bold">Manajemen Pegawai</CardTitle>
                    {operatorInfo?.wilayahRelasi && (
                      <div className="text-green-100 mt-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {operatorInfo.wilayahRelasi.nama} ({operatorInfo.wilayahRelasi.namaLengkap})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowImportDialog(true)} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    <Import className="h-4 w-4 mr-2" /> Import
                  </Button>
                  <Button 
                    onClick={handleExport} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                  <Button 
                    onClick={() => setShowAddDialog(true)} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Tambah Pegawai
                  </Button>
                  <Button 
                    onClick={fetchPegawaiData} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                    disabled={loading}
                  >
                    <Search className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Real-time Statistics Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Pegawai</p>
                  <p className="text-2xl font-bold text-blue-800">{summary.total}</p>
                </div>
                <Users2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Aktif</p>
                  <p className="text-2xl font-bold text-green-800">{summary.byStatus.AKTIF || 0}</p>
                </div>
                <User className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Laki-laki</p>
                  <p className="text-2xl font-bold text-purple-800">{summary.byJenisKelamin.L || 0}</p>
                </div>
                <User className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-pink-50 border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-600 text-sm font-medium">Perempuan</p>
                  <p className="text-2xl font-bold text-pink-800">{summary.byJenisKelamin.P || 0}</p>
                </div>
                <User className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter & Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-medium">Cari Pegawai</Label>
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan nama, NIP, atau email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                      <SelectItem value="PENSIUN">Pensiun</SelectItem>
                      <SelectItem value="MUTASI">Mutasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="jabatan" className="text-sm font-medium">Jabatan</Label>
                  <Select value={jabatanFilter} onValueChange={setJabatanFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jabatan</SelectItem>
                      <SelectItem value="Kepala Sekolah">Kepala Sekolah</SelectItem>
                      <SelectItem value="Wakil Kepala Sekolah">Wakil Kepala Sekolah</SelectItem>
                      <SelectItem value="Guru Kelas">Guru Kelas</SelectItem>
                      <SelectItem value="Guru Mata Pelajaran">Guru Mata Pelajaran</SelectItem>
                      <SelectItem value="Staf TU">Staf TU</SelectItem>
                      <SelectItem value="Tenaga Kependidikan">Tenaga Kependidikan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unitKerja" className="text-sm font-medium">Unit Kerja</Label>
                  <Select value={unitKerjaFilter} onValueChange={setUnitKerjaFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Unit Kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit Kerja</SelectItem>
                      {unitKerjaOptions.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nama} ({unit.jenjang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pendidikan" className="text-sm font-medium">Pendidikan</Label>
                  <Select value={pendidikanFilter} onValueChange={setPendidikanFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Pendidikan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pendidikan</SelectItem>
                      <SelectItem value="S3">S3</SelectItem>
                      <SelectItem value="S2">S2</SelectItem>
                      <SelectItem value="S1">S1</SelectItem>
                      <SelectItem value="D4">D4</SelectItem>
                      <SelectItem value="D3">D3</SelectItem>
                      <SelectItem value="D2">D2</SelectItem>
                      <SelectItem value="D1">D1</SelectItem>
                      <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Data Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Data Pegawai</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Data diperbarui otomatis setiap 30 detik</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2">Memuat data...</span>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada data pegawai yang ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>NIP/NUPTK</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead>Pendidikan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Kontak</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((pegawai) => (
                        <TableRow key={pegawai.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{pegawai.nama}</div>
                              <div className="text-sm text-gray-500">{pegawai.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {pegawai.nip && (
                                <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                  NIP: {pegawai.nip}
                                </div>
                              )}
                              {pegawai.nuptk && (
                                <div className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                                  NUPTK: {pegawai.nuptk}
                                </div>
                              )}
                              {!pegawai.nip && !pegawai.nuptk && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pegawai.jabatan ? (
                              <Badge className={getJabatanColor(pegawai.jabatan)}>
                                {pegawai.jabatan}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pegawai.unitKerja ? (
                              <div className="text-sm">
                                <div className="font-medium">{pegawai.unitKerja.nama}</div>
                                <div className="text-gray-500">{pegawai.unitKerja.jenjang}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pegawai.pendidikan ? (
                              <Badge variant="outline">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                {pegawai.pendidikan}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(pegawai.status)}>
                              {pegawai.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {pegawai.phone && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <span>{pegawai.phone}</span>
                                </div>
                              )}
                              {pegawai.email && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Mail className="h-3 w-3 text-gray-400" />
                                  <span className="truncate max-w-[120px]">{pegawai.email}</span>
                                </div>
                              )}
                              {!pegawai.phone && !pegawai.email && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPegawai(pegawai)
                                setShowDetailDialog(true)
                              }}
                            >
                              <User className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Pegawai Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Pegawai Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    placeholder="Nama lengkap pegawai"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input
                    id="phone"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nip">NIP</Label>
                  <Input
                    id="nip"
                    placeholder="Nomor Induk Pegawai"
                    value={formData.nip}
                    onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nuptk">NUPTK</Label>
                  <Input
                    id="nuptk"
                    placeholder="Nomor Unik Pendidik dan Tenaga Kependidikan"
                    value={formData.nuptk}
                    onChange={(e) => setFormData({...formData, nuptk: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                  <Select value={formData.jenisKelamin} onValueChange={(value) => setFormData({...formData, jenisKelamin: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                  <Input
                    id="tanggalLahir"
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({...formData, tanggalLahir: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="agama">Agama</Label>
                  <Select value={formData.agama} onValueChange={(value) => setFormData({...formData, agama: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih agama" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Kristen">Kristen</SelectItem>
                      <SelectItem value="Katolik">Katolik</SelectItem>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Buddha">Buddha</SelectItem>
                      <SelectItem value="Konghucu">Konghucu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pendidikan">Pendidikan Terakhir</Label>
                  <Select value={formData.pendidikan} onValueChange={(value) => setFormData({...formData, pendidikan: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pendidikan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S3">S3</SelectItem>
                      <SelectItem value="S2">S2</SelectItem>
                      <SelectItem value="S1">S1</SelectItem>
                      <SelectItem value="D4">D4</SelectItem>
                      <SelectItem value="D3">D3</SelectItem>
                      <SelectItem value="D2">D2</SelectItem>
                      <SelectItem value="D1">D1</SelectItem>
                      <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Select value={formData.jabatan} onValueChange={(value) => setFormData({...formData, jabatan: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kepala Sekolah">Kepala Sekolah</SelectItem>
                      <SelectItem value="Wakil Kepala Sekolah">Wakil Kepala Sekolah</SelectItem>
                      <SelectItem value="Guru Kelas">Guru Kelas</SelectItem>
                      <SelectItem value="Guru Mata Pelajaran">Guru Mata Pelajaran</SelectItem>
                      <SelectItem value="Staf TU">Staf TU</SelectItem>
                      <SelectItem value="Tenaga Kependidikan">Tenaga Kependidikan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unitKerjaId">Unit Kerja</Label>
                  <Select value={formData.unitKerjaId} onValueChange={(value) => setFormData({...formData, unitKerjaId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitKerjaOptions.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nama} ({unit.jenjang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                      <SelectItem value="PENSIUN">Pensiun</SelectItem>
                      <SelectItem value="MUTASI">Mutasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input
                    id="alamat"
                    placeholder="Alamat lengkap"
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="kecamatan">Kecamatan</Label>
                  <Input
                    id="kecamatan"
                    placeholder="Nama kecamatan"
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({...formData, kecamatan: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Import Data Pegawai</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <Label htmlFor="importFile">File Excel (.xlsx)</Label>
                <Input
                  id="importFile"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: Nama, Email, NIP, NUPTK, Phone, Jabatan, Unit Kerja, dll.
                </p>
              </div>
              {importing && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600">
                    Mengimpor... {importProgress}%
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowImportDialog(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={importing || !importFile}>
                  {importing ? 'Mengimpor...' : 'Import'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detail Pegawai Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Pegawai</DialogTitle>
            </DialogHeader>
            {selectedPegawai && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Nama Lengkap</Label>
                    <p className="font-bold text-lg">{selectedPegawai.nama}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedPegawai.email}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">No. Telepon</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedPegawai.phone || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">NIP</Label>
                    <p className="font-mono">{selectedPegawai.nip || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">NUPTK</Label>
                    <p className="font-mono">{selectedPegawai.nuptk || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Jenis Kelamin</Label>
                    <p>{selectedPegawai.jenisKelamin === 'L' ? 'Laki-laki' : selectedPegawai.jenisKelamin === 'P' ? 'Perempuan' : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tanggal Lahir</Label>
                    <p>{selectedPegawai.tanggalLahir ? new Date(selectedPegawai.tanggalLahir).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Agama</Label>
                    <p>{selectedPegawai.agama || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Pendidikan Terakhir</Label>
                    {selectedPegawai.pendidikan ? (
                      <Badge variant="outline">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {selectedPegawai.pendidikan}
                      </Badge>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Jabatan</Label>
                    {selectedPegawai.jabatan ? (
                      <Badge className={getJabatanColor(selectedPegawai.jabatan)}>
                        {selectedPegawai.jabatan}
                      </Badge>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={getStatusBadgeColor(selectedPegawai.status)}>
                      {selectedPegawai.status}
                    </Badge>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Unit Kerja</Label>
                    {selectedPegawai.unitKerja ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{selectedPegawai.unitKerja.nama}</p>
                          <p className="text-sm text-gray-500">{selectedPegawai.unitKerja.jenjang}</p>
                        </div>
                      </div>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Alamat</Label>
                    <p>{selectedPegawai.alamat || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Kecamatan</Label>
                    <p>{selectedPegawai.kecamatan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Wilayah</Label>
                    <p>{selectedPegawai.wilayahRelasi?.nama || selectedPegawai.wilayah || '-'}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Informasi Waktu
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Dibuat</Label>
                      <p>{new Date(selectedPegawai.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Diperbarui</Label>
                      <p>{new Date(selectedPegawai.updatedAt).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                    Tutup
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
