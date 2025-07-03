"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Eye, Search, Users, UserPlus, FileUp, Send, AlertTriangle, CheckCircle, Download, MapPin, Building2, Clock } from "lucide-react"
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
import * as XLSX from 'xlsx'

// Enhanced Interfaces with WilayahMaster
interface WilayahMaster {
  id: string
  kode: string
  nama: string
  namaLengkap: string
  ibukota: string
}

interface Pegawai {
  id: string
  nama: string
  nip: string
  email: string
  jabatan: string | null
  jenisJabatan: string | null
  golongan: string | null
  unitKerja: string | null
  wilayah: string | null
  phone: string | null
  address: string | null
  totalProposals: number
  activeProposals: number
  proposalStatus: string
  latestProposal: any
  createdAt: string
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
  id: string
  name: string
  role: string
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
}

interface PegawaiSummary {
  totalPegawai: number
  pegawaiDenganUsulan: number
  totalUsulan: number
  usulanAktif: number
}

interface FilterOptions {
  unitKerja: string[]
  jabatan: string[]
  status: Array<{ value: string; label: string }>
}

type ImportResult = {
  total: number
  success: number
  failed: number
  errors: string[]
  preview?: Record<string, unknown>[]
}

// Main Component
export default function OperatorPegawaiPage() {
  // Core Data State  
  const [data, setData] = useState<Pegawai[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<PegawaiSummary>({
    totalPegawai: 0,
    pegawaiDenganUsulan: 0,
    totalUsulan: 0,
    usulanAktif: 0
  })
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    unitKerja: [],
    jabatan: [],
    status: []
  })

  // Operator & Wilayah Info
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null)
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<UnitKerja[]>([])

  // Filters State
  const [search, setSearch] = useState('')
  const [unitKerjaFilter, setUnitKerjaFilter] = useState('all')
  const [jabatanFilter, setJabatanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // UI & Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null)
  
  // Add Form State
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nip: '', name: '', email: '', golongan: '', jabatan: '', jenisJabatan: '',
    tmtJabatan: '', unitKerjaId: '', phone: '', address: ''
  })

  // Import State
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Auto-refresh interval
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Context & Hooks
  const { toast } = useToast()

  // Data Fetching with Real-time Support
  const fetchPegawaiData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search,
        unitKerja: unitKerjaFilter,
        jabatan: jabatanFilter,
        status: statusFilter,
      })
      
      const response = await fetch(`/api/operator/pegawai?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) throw new Error('Gagal memuat data pegawai')
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
        setSummary(result.summary || {
          totalPegawai: 0,
          pegawaiDenganUsulan: 0,
          totalUsulan: 0,
          usulanAktif: 0
        })
        setFilterOptions(result.filterOptions || {
          unitKerja: [],
          jabatan: [],
          status: []
        })
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
  }, [currentPage, search, unitKerjaFilter, jabatanFilter, statusFilter, toast])

  const fetchUnitKerjaOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/unit-kerja', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) throw new Error('Gagal memuat unit kerja')
      
      const result = await response.json()
      
      if (result.success) {
        setUnitKerjaOptions(result.data || [])
        // Set operator info from response
        if (result.userInfo) {
          setOperatorInfo({
            id: result.userInfo.id || '',
            name: result.userInfo.name || '',
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
        description: error instanceof Error ? error.message : "Gagal memuat opsi unit kerja", 
        variant: "destructive" 
      })
    }
  }, [toast])

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
  }, [fetchPegawaiData])

  useEffect(() => {
    fetchUnitKerjaOptions()
  }, [fetchUnitKerjaOptions])

  useEffect(() => {
    // Start auto-refresh when component mounts
    startAutoRefresh()
    
    // Cleanup on unmount
    return () => {
      stopAutoRefresh()
    }
  }, [startAutoRefresh, stopAutoRefresh])

  // Form Handling with Enhanced Validation
  const resetAddForm = () => {
    setFormData({ 
      nip: '', name: '', email: '', golongan: '', jabatan: '', jenisJabatan: '',
      tmtJabatan: '', unitKerjaId: '', phone: '', address: '' 
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Enhanced validation
      if (!formData.nip || !formData.name) {
        throw new Error('NIP dan Nama wajib diisi')
      }
      
      if (!/^\d{18}$/.test(formData.nip)) {
        throw new Error('NIP harus berupa 18 digit angka')
      }

      const formDataToSend = new FormData()
      formDataToSend.append('action', 'create')
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value)
      })

      const response = await fetch('/api/operator/pegawai', {
        method: 'POST',
        body: formDataToSend,
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
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
      if (!validTypes.includes(file.type)) {
        toast({ title: "Error", description: "File harus berformat Excel (.xls, .xlsx) atau CSV", variant: "destructive" })
        return
      }
      
      setImportFile(file)
      previewFile(file)
    }
  }

  const previewFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const worksheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[worksheetName]
      const data = XLSX.utils.sheet_to_json(worksheet)
      
      setImportPreview(data.slice(0, 5)) // Preview first 5 rows
      setImportStep('preview')
    } catch (error) {
      toast({ title: "Error", description: "Gagal membaca file", variant: "destructive" })
    }
  }

  const handleImportSubmit = async () => {
    if (!importFile) return
    
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('action', 'import')
      formData.append('file', importFile)
      
      const response = await fetch('/api/operator/pegawai', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      setImportResult(result.results)
      setImportStep('result')
      
      if (result.results?.success > 0) {
        fetchPegawaiData() // Refresh data after successful import
      }
      
    } catch (error) {
      toast({ title: "Error", description: "Gagal import data", variant: "destructive" })
    } finally {
      setIsImporting(false)
    }
  }

  const resetImport = () => {
    setImportFile(null)
    setImportPreview([])
    setImportResult(null)
    setImportStep('upload')
    setShowImportDialog(false)
  }

  const downloadTemplate = () => {
    const headers = [['NIP (18 digit)', 'Nama Lengkap', 'Email', 'Golongan', 'Jabatan', 'Jenis Jabatan', 'TMT Jabatan (YYYY-MM-DD)', 'Unit Kerja', 'No. Telepon', 'Alamat', 'Cabang Dinas']]
    const exampleData = [['196501011986031001', 'John Doe', 'john@example.com', 'III/c', 'Guru Kelas', 'Fungsional', '2020-01-01', 'SDN 001 Balikpapan', '081234567890', 'Jl. Contoh No. 123', 'CABANG DINAS PENDIDIKAN WILAYAH I']]
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...exampleData])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'template_pegawai.xlsx')
  }

  const previewHeaders = useMemo(() => {
    if (!importPreview.length) return []
    return Object.keys(importPreview[0])
  }, [importPreview])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Selesai': return 'bg-green-100 text-green-800'
      case 'Perlu Verifikasi': return 'bg-yellow-100 text-yellow-800'
      case 'Proses Verifikasi': return 'bg-blue-100 text-blue-800'
      case 'Perlu Perbaikan': return 'bg-orange-100 text-orange-800'
      case 'Ditolak': return 'bg-red-100 text-red-800'
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
                  <Users className="h-8 w-8" />
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
                    onClick={() => setShowAddDialog(true)} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Tambah Pegawai
                  </Button>
                  <Button 
                    onClick={() => { setShowImportDialog(true); resetImport(); }} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    <FileUp className="h-4 w-4 mr-2" /> Import Data
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
                  <p className="text-2xl font-bold text-blue-800">{summary.totalPegawai}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Dengan Usulan</p>
                  <p className="text-2xl font-bold text-green-800">{summary.pegawaiDenganUsulan}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Total Usulan</p>
                  <p className="text-2xl font-bold text-yellow-800">{summary.totalUsulan}</p>
                </div>
                <Send className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Usulan Aktif</p>
                  <p className="text-2xl font-bold text-purple-800">{summary.usulanAktif}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-purple-500" />
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
              <CardTitle className="text-lg font-semibold">Filter & Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-medium">Cari Pegawai</Label>
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan nama atau NIP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="unitKerja" className="text-sm font-medium">Unit Kerja</Label>
                  <Select value={unitKerjaFilter} onValueChange={setUnitKerjaFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Unit Kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit Kerja</SelectItem>
                      {filterOptions.unitKerja.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
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
                      {filterOptions.jabatan.map((jabatan) => (
                        <SelectItem key={jabatan} value={jabatan}>{jabatan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium">Status Usulan</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.status.map((status) => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
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
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada data pegawai yang ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>NIP</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead>Usulan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((pegawai) => (
                        <TableRow key={pegawai.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{pegawai.nama}</div>
                              {pegawai.email && (
                                <div className="text-sm text-gray-500">{pegawai.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{pegawai.nip}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{pegawai.jabatan || '-'}</div>
                              {pegawai.golongan && (
                                <div className="text-sm text-gray-500">{pegawai.golongan}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{pegawai.unitKerja || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Total: {pegawai.totalProposals}</div>
                              {pegawai.activeProposals > 0 && (
                                <div className="text-blue-600">Aktif: {pegawai.activeProposals}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(pegawai.proposalStatus)}>
                              {pegawai.proposalStatus}
                            </Badge>
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
                              <Eye className="h-4 w-4 mr-1" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center gap-2"
          >
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </motion.div>
        )}

        {/* Add Pegawai Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Pegawai Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nip">NIP (18 digit) *</Label>
                  <Input
                    id="nip"
                    placeholder="196501011986031001"
                    value={formData.nip}
                    onChange={(e) => setFormData({...formData, nip: e.target.value})}
                    maxLength={18}
                    pattern="\d{18}"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    placeholder="Nama lengkap pegawai"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
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
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input
                    id="phone"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="golongan">Golongan</Label>
                  <Input
                    id="golongan"
                    placeholder="III/c"
                    value={formData.golongan}
                    onChange={(e) => setFormData({...formData, golongan: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Input
                    id="jabatan"
                    placeholder="Guru Kelas"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="jenisJabatan">Jenis Jabatan</Label>
                  <Select value={formData.jenisJabatan} onValueChange={(value) => setFormData({...formData, jenisJabatan: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Struktural">Struktural</SelectItem>
                      <SelectItem value="Fungsional">Fungsional</SelectItem>
                      <SelectItem value="Pelaksana">Pelaksana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tmtJabatan">TMT Jabatan</Label>
                  <Input
                    id="tmtJabatan"
                    type="date"
                    value={formData.tmtJabatan}
                    onChange={(e) => setFormData({...formData, tmtJabatan: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="unitKerjaId">Unit Kerja</Label>
                  <Select value={formData.unitKerjaId} onValueChange={(value) => setFormData({...formData, unitKerjaId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada unit kerja</SelectItem>
                      {unitKerjaOptions.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nama} ({unit.jenjang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    placeholder="Alamat lengkap"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
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
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Data Pegawai</DialogTitle>
            </DialogHeader>
            
            {importStep === 'upload' && (
              <div className="space-y-4">
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Upload File Excel atau CSV</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Format yang didukung: .xlsx, .xls, .csv
                  </p>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="max-w-xs mx-auto"
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button variant="outline" onClick={resetImport}>
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {importStep === 'preview' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Preview Data ({importPreview.length} dari {importFile?.name})</h3>
                  <div className="overflow-x-auto max-h-60 border rounded">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {previewHeaders.map((header) => (
                            <th key={header} className="px-3 py-2 text-left font-medium text-gray-900">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, index) => (
                          <tr key={index} className="border-t">
                            {previewHeaders.map((header) => (
                              <td key={header} className="px-3 py-2 text-gray-700">
                                {String(row[header] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportStep('upload')}>
                    Kembali
                  </Button>
                  <Button onClick={handleImportSubmit} disabled={isImporting}>
                    {isImporting ? 'Mengimpor...' : 'Konfirmasi Import'}
                  </Button>
                </DialogFooter>
              </div>
            )}

            {importStep === 'result' && importResult && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-lg font-medium mb-4">Hasil Import</div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                      <div className="text-sm text-blue-600">Total Data</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                      <div className="text-sm text-green-600">Berhasil</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                      <div className="text-sm text-red-600">Gagal</div>
                    </div>
                  </div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                    <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded text-sm">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-red-700">{error}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button onClick={resetImport}>
                    Selesai
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Detail Pegawai Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Pegawai</DialogTitle>
            </DialogHeader>
            {selectedPegawai && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nama Lengkap</Label>
                    <p className="font-medium">{selectedPegawai.nama}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">NIP</Label>
                    <p className="font-mono">{selectedPegawai.nip}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p>{selectedPegawai.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">No. Telepon</Label>
                    <p>{selectedPegawai.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Jabatan</Label>
                    <p>{selectedPegawai.jabatan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Golongan</Label>
                    <p>{selectedPegawai.golongan || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Unit Kerja</Label>
                    <p>{selectedPegawai.unitKerja || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Alamat</Label>
                    <p>{selectedPegawai.address || '-'}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Statistik Usulan</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-lg font-bold text-blue-600">{selectedPegawai.totalProposals}</div>
                      <div className="text-sm text-blue-600">Total Usulan</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-lg font-bold text-yellow-600">{selectedPegawai.activeProposals}</div>
                      <div className="text-sm text-yellow-600">Usulan Aktif</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <Badge className={getStatusBadgeColor(selectedPegawai.proposalStatus)}>
                        {selectedPegawai.proposalStatus}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">Status Terakhir</div>
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
