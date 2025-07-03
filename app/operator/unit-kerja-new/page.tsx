"use client"

import { useState, useEffect, useCallback } from "react"
import { Building2, Search, Plus, Users, MapPin, Clock, Phone, Mail, Globe, Calendar } from "lucide-react"
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
  npsn: string | null
  jenjang: string
  alamat: string | null
  kecamatan: string | null
  status: string
  kepalaSekolah: string | null
  phone: string | null
  email: string | null
  website: string | null
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
  wilayahNama: string
  jumlahPegawai: number
  createdAt: string
  updatedAt: string
}

interface OperatorInfo {
  role: string
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
}

interface UnitKerjaSummary {
  total: number
  byJenjang: Record<string, number>
  byStatus: Record<string, number>
}

// Main Component
export default function OperatorUnitKerjaPage() {
  // Core Data State
  const [data, setData] = useState<UnitKerja[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<UnitKerjaSummary>({
    total: 0,
    byJenjang: {},
    byStatus: {}
  })

  // Operator & Wilayah Info
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [jenjangFilter, setJenjangFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('AKTIF')

  // UI & Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<UnitKerja | null>(null)
  
  // Add Form State
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nama: '', npsn: '', jenjang: 'SD/MI', alamat: '', kecamatan: '',
    kepalaSekolah: '', phone: '', email: '', website: '', status: 'AKTIF'
  })

  // Auto-refresh interval
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Context & Hooks
  const { toast } = useToast()

  // Data Fetching with Real-time Support
  const fetchUnitKerjaData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        jenjang: jenjangFilter,
        status: statusFilter,
      })
      
      const response = await fetch(`/api/unit-kerja?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) throw new Error('Gagal memuat data unit kerja')
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data || [])
        setSummary(result.summary || {
          total: 0,
          byJenjang: {},
          byStatus: {}
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
      console.error('Error fetching unit kerja:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }, [search, jenjangFilter, statusFilter, toast])

  // Auto-refresh data every 30 seconds
  const startAutoRefresh = useCallback(() => {
    const interval = setInterval(() => {
      fetchUnitKerjaData()
    }, 30000) // 30 seconds
    setRefreshInterval(interval)
  }, [fetchUnitKerjaData])

  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [refreshInterval])

  // Effects for data loading and auto-refresh
  useEffect(() => {
    fetchUnitKerjaData()
  }, [fetchUnitKerjaData])

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
      nama: '', npsn: '', jenjang: 'SD/MI', alamat: '', kecamatan: '',
      kepalaSekolah: '', phone: '', email: '', website: '', status: 'AKTIF'
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Enhanced validation
      if (!formData.nama || !formData.jenjang) {
        throw new Error('Nama dan Jenjang wajib diisi')
      }

      const response = await fetch('/api/unit-kerja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menambahkan unit kerja')
      }
      
      toast({ 
        title: "Berhasil", 
        description: "Data unit kerja berhasil ditambahkan." 
      })
      
      setShowAddDialog(false)
      resetAddForm()
      fetchUnitKerjaData() // Refresh data
      
    } catch (error) {
      console.error('Error adding unit kerja:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "destructive" 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'AKTIF': return 'bg-green-100 text-green-800'
      case 'TIDAK_AKTIF': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getJenjangColor = (jenjang: string) => {
    switch (jenjang) {
      case 'TK': return 'bg-pink-100 text-pink-800'
      case 'SD/MI': return 'bg-blue-100 text-blue-800'
      case 'SMP/MTs': return 'bg-green-100 text-green-800'
      case 'SMA/MA': return 'bg-purple-100 text-purple-800'
      case 'SMK': return 'bg-orange-100 text-orange-800'
      case 'SLB': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Render Dashboard with Real-time Data
  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Enhanced Header with Wilayah Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-3xl font-bold">Manajemen Unit Kerja</CardTitle>
                    {operatorInfo?.wilayahRelasi && (
                      <div className="text-blue-100 mt-1 flex items-center gap-2">
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
                    onClick={() => setShowAddDialog(true)} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Tambah Unit Kerja
                  </Button>
                  <Button 
                    onClick={fetchUnitKerjaData} 
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Unit Kerja</p>
                  <p className="text-2xl font-bold text-blue-800">{summary.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {Object.entries(summary.byJenjang).map(([jenjang, count]) => (
            <Card key={jenjang} className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium">{jenjang}</p>
                  <p className="text-xl font-bold text-gray-800">{count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Filter & Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-medium">Cari Unit Kerja</Label>
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan nama atau NPSN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="jenjang" className="text-sm font-medium">Jenjang</Label>
                  <Select value={jenjangFilter} onValueChange={setJenjangFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenjang</SelectItem>
                      <SelectItem value="TK">TK</SelectItem>
                      <SelectItem value="SD/MI">SD/MI</SelectItem>
                      <SelectItem value="SMP/MTs">SMP/MTs</SelectItem>
                      <SelectItem value="SMA/MA">SMA/MA</SelectItem>
                      <SelectItem value="SMK">SMK</SelectItem>
                      <SelectItem value="SLB">SLB</SelectItem>
                    </SelectContent>
                  </Select>
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
                <CardTitle className="text-lg font-semibold">Data Unit Kerja</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Data diperbarui otomatis setiap 30 detik</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Memuat data...</span>
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada data unit kerja yang ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead>NPSN</TableHead>
                        <TableHead>Jenjang</TableHead>
                        <TableHead>Kepala Sekolah</TableHead>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>Wilayah</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((unit) => (
                        <TableRow key={unit.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{unit.nama}</div>
                              {unit.alamat && (
                                <div className="text-sm text-gray-500">{unit.alamat}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{unit.npsn || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getJenjangColor(unit.jenjang)}>
                              {unit.jenjang}
                            </Badge>
                          </TableCell>
                          <TableCell>{unit.kepalaSekolah || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{unit.jumlahPegawai}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {unit.wilayahRelasi ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {unit.wilayahRelasi.nama}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                  {unit.wilayah || '-'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(unit.status)}>
                              {unit.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUnitKerja(unit)
                                setShowDetailDialog(true)
                              }}
                            >
                              <Building2 className="h-4 w-4 mr-1" />
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

        {/* Add Unit Kerja Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Unit Kerja Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nama">Nama Unit Kerja *</Label>
                  <Input
                    id="nama"
                    placeholder="Nama lengkap unit kerja"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="npsn">NPSN</Label>
                  <Input
                    id="npsn"
                    placeholder="Nomor Pokok Sekolah Nasional"
                    value={formData.npsn}
                    onChange={(e) => setFormData({...formData, npsn: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="jenjang">Jenjang *</Label>
                  <Select value={formData.jenjang} onValueChange={(value) => setFormData({...formData, jenjang: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TK">TK</SelectItem>
                      <SelectItem value="SD/MI">SD/MI</SelectItem>
                      <SelectItem value="SMP/MTs">SMP/MTs</SelectItem>
                      <SelectItem value="SMA/MA">SMA/MA</SelectItem>
                      <SelectItem value="SMK">SMK</SelectItem>
                      <SelectItem value="SLB">SLB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input
                    id="alamat"
                    placeholder="Alamat lengkap unit kerja"
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
                <div>
                  <Label htmlFor="kepalaSekolah">Kepala Sekolah</Label>
                  <Input
                    id="kepalaSekolah"
                    placeholder="Nama kepala sekolah"
                    value={formData.kepalaSekolah}
                    onChange={(e) => setFormData({...formData, kepalaSekolah: e.target.value})}
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://website.com"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                  />
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
                    </SelectContent>
                  </Select>
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

        {/* Detail Unit Kerja Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Unit Kerja</DialogTitle>
            </DialogHeader>
            {selectedUnitKerja && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Nama Unit Kerja</Label>
                    <p className="font-bold text-lg">{selectedUnitKerja.nama}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">NPSN</Label>
                    <p className="font-mono">{selectedUnitKerja.npsn || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Jenjang</Label>
                    <Badge className={getJenjangColor(selectedUnitKerja.jenjang)}>
                      {selectedUnitKerja.jenjang}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={getStatusBadgeColor(selectedUnitKerja.status)}>
                      {selectedUnitKerja.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Jumlah Pegawai</Label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedUnitKerja.jumlahPegawai} pegawai</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Alamat</Label>
                    <p>{selectedUnitKerja.alamat || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Kecamatan</Label>
                    <p>{selectedUnitKerja.kecamatan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Wilayah</Label>
                    <p>{selectedUnitKerja.wilayahRelasi?.nama || selectedUnitKerja.wilayah || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Kepala Sekolah</Label>
                    <p>{selectedUnitKerja.kepalaSekolah || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">No. Telepon</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedUnitKerja.phone || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedUnitKerja.email || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Website</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      {selectedUnitKerja.website ? (
                        <a 
                          href={selectedUnitKerja.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedUnitKerja.website}
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
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
                      <p>{new Date(selectedUnitKerja.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Diperbarui</Label>
                      <p>{new Date(selectedUnitKerja.updatedAt).toLocaleString('id-ID')}</p>
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
