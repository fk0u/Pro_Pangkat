"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { 
  Eye, Search, Users, UserPlus, FileUp, Send, AlertTriangle, 
  CheckCircle, Download, MapPin, Loader2, Inbox as InboxIcon,
  ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, 
  Pencil as PencilIcon, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight
} from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
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
  latestProposal: unknown
  proposals?: {
    id: string
    status: string
    currentGolongan: string
    targetGolongan: string
    notes: string | null
    createdAt: string
  }[]
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
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [summary, setSummary] = useState<PegawaiSummary>({
    totalPegawai: 0,
    pegawaiDenganUsulan: 0,
    totalUsulan: 0,
    usulanAktif: 0
  })

  // Operator & Wilayah Info
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null)
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<UnitKerja[]>([])

  // Filters State
  const [search, setSearch] = useState('')
  const [unitKerjaFilter, setUnitKerjaFilter] = useState('all')
  const [jabatanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // UI & Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  
  // Add Form State
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nip: '', name: '', email: '', golongan: '', jabatan: '', jenisJabatan: '',
    tmtJabatan: '', unitKerjaId: '', phone: '', address: ''
  })

  // Import State
  const [importStep, setImportStep] = useState<'method' | 'manual' | 'upload' | 'preview' | 'result'>('method')
  const [importMethod, setImportMethod] = useState<'manual' | 'upload'>('upload')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [manualRows, setManualRows] = useState<Array<{
    nip: string
    nama: string
    golongan: string
    tmtJabatan: string
    jabatan: string
    unitKerja: string
  }>>([
    { nip: '', nama: '', golongan: '', tmtJabatan: '', jabatan: '', unitKerja: '' }
  ])

  // Auto-refresh interval
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Context & Hooks
  const { toast } = useToast()

  // Data Fetching with Real-time Support
  const fetchPegawaiData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search,
        unitKerja: unitKerjaFilter,
        jabatan: jabatanFilter,
        status: statusFilter,
        sortField: sortField,
        sortDirection: sortDirection
      })
      
      const response = await fetch(`/api/operator/pegawai?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Gagal memuat data pegawai (${response.status})`);
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data || [])
        setTotalItems(result.pagination?.totalCount || result.totalCount || 0)
        setTotalPages(result.pagination?.totalPages || Math.ceil((result.pagination?.totalCount || result.totalCount || 0) / itemsPerPage))
        setSummary(result.summary || {
          totalPegawai: 0,
          pegawaiDenganUsulan: 0,
          totalUsulan: 0,
          usulanAktif: 0
        })
      } else {
        throw new Error(result.message || 'Gagal memuat data')
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
  }

  const fetchUnitKerjaOptions = async () => {
    try {
      const response = await fetch('/api/operator/unit-kerja', {
        headers: {
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Gagal memuat unit kerja (${response.status})`);
      }
      
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
      } else {
        throw new Error(result.message || 'Gagal memuat data unit kerja')
      }
    } catch (error) {
      console.error('Error fetching unit kerja:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Gagal memuat opsi unit kerja", 
        variant: "destructive" 
      })
    }
  }

  // Auto-refresh data every 30 seconds
  const startAutoRefresh = () => {
    const interval = setInterval(() => {
      fetchPegawaiData()
    }, 30000) // 30 seconds
    setRefreshInterval(interval)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
    // Reset to page 1 when sorting changes
    setCurrentPage(1)
  }

  // View detail pegawai
  const handleViewDetail = async (pegawai: Pegawai) => {
    setSelectedPegawai(pegawai)
    
    try {
      // Fetch detailed information including proposal history
      const response = await fetch(`/api/operator/pegawai/${pegawai.id}/detail`, {
        headers: {
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Gagal memuat detail pegawai (${response.status})`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setSelectedPegawai({
          ...pegawai,
          proposals: result.data.proposals || []
        })
      } else {
        throw new Error(result.message || 'Gagal memuat detail')
      }
    } catch (error) {
      console.error('Error fetching pegawai detail:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memuat detail", 
        variant: "destructive" 
      })
    } finally {
      setShowDetailDialog(true)
    }
  }

  // Pagination controls
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to page 1 when changing items per page
  }

  // Effects for data loading and auto-refresh
  useEffect(() => {
    fetchPegawaiData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, search, unitKerjaFilter, jabatanFilter, statusFilter, sortField, sortDirection])

  useEffect(() => {
    fetchUnitKerjaOptions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Start auto-refresh when component mounts
    startAutoRefresh()
    
    // Cleanup on unmount
    return () => {
      stopAutoRefresh()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      // Enhanced validation - hanya NIP dan Nama yang wajib
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
      setImportFile(file)
      setImportResult(null)
    }
  }

  const handlePreviewImport = async () => {
    if (!importFile) {
      toast({ title: "Error", description: "Tidak ada file yang dipilih", variant: "destructive" })
      return
    }
    
    setIsImporting(true)
    try {
      // Validasi tipe file
      const fileType = importFile.name.split('.').pop()?.toLowerCase()
      if (!['xlsx', 'xls', 'csv'].includes(fileType || '')) {
        throw new Error('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls) atau CSV.')
      }
      
      // Validasi ukuran file
      if (importFile.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Ukuran file terlalu besar (maksimal 10MB)')
      }
      
      const data = await importFile.arrayBuffer()
      const workbook = XLSX.read(data)
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki sheet')
      }
      
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet)
      
      if (!json || json.length === 0) {
        throw new Error('Tidak ada data yang ditemukan dalam file')
      }
      
      // Validasi format kolom
      const firstRow = json[0] as Record<string, unknown>
      const requiredColumns = ['NIP', 'NAMA']
      const missingColumns = requiredColumns.filter(col => !Object.keys(firstRow).includes(col))
      
      if (missingColumns.length > 0) {
        throw new Error(`Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}. Pastikan format file sesuai template.`)
      }
      
      setImportPreview(json as Record<string, unknown>[])
      setImportStep('preview')
    } catch (error) {
      console.error('Preview import error:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Gagal membaca file. Pastikan formatnya benar.", 
        variant: "destructive" 
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!importFile) {
      toast({ title: "Error", description: "Tidak ada file yang dipilih", variant: "destructive" })
      return
    }
    
    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', importFile)
    formData.append('action', 'import')

    try {
      // Periksa ukuran file
      if (importFile.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Ukuran file terlalu besar (maksimal 10MB)')
      }

      // Periksa tipe file
      const fileType = importFile.name.split('.').pop()?.toLowerCase()
      if (!['xlsx', 'xls'].includes(fileType || '')) {
        throw new Error('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)')
      }

      const response = await fetch('/api/operator/pegawai', {
        method: 'POST',
        body: formData,
      })
      
      // Tangani respons network error
      if (!response) {
        throw new Error('Koneksi terputus. Periksa koneksi internet Anda')
      }
      
      const result = await response.json().catch(() => {
        throw new Error('Gagal memproses respons server')
      })
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengimpor data')
      }
      
      setImportResult(result.results)
      setImportStep('result')
      fetchPegawaiData()
    } catch (error) {
      console.error('Import error:', error)
      toast({ 
        title: "Error Import Data", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengimpor data", 
        variant: "destructive" 
      })
    } finally {
      setIsImporting(false)
    }
  }

  const resetImport = () => {
    setImportFile(null)
    setImportPreview([])
    setImportResult(null)
    setImportStep('method')
    setImportMethod('upload')
    setManualRows([
      { nip: '', nama: '', golongan: '', tmtJabatan: '', jabatan: '', unitKerja: '' }
    ])
  }

  // Manual import functions
  const addManualRow = () => {
    setManualRows([...manualRows, 
      { nip: '', nama: '', golongan: '', tmtJabatan: '', jabatan: '', unitKerja: '' }
    ])
  }

  const removeManualRow = (index: number) => {
    if (manualRows.length > 1) {
      setManualRows(manualRows.filter((_, i) => i !== index))
    }
  }

  const updateManualRow = (index: number, field: string, value: string) => {
    const newRows = [...manualRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setManualRows(newRows)
  }

  const handleManualImport = async () => {
    setIsImporting(true)
    try {
      // Validate manual rows
      const validRows = manualRows.filter(row => row.nip && row.nama)
      
      if (validRows.length === 0) {
        throw new Error('Minimal harus ada satu data dengan NIP dan Nama yang diisi')
      }

      // Convert manual data to import format
      const importData = validRows.map(row => ({
        NIP: row.nip,
        NAMA: row.nama,
        GOLONGAN: row.golongan,
        'TMT JABATAN': row.tmtJabatan,
        JABATAN: row.jabatan,
        'UNIT KERJA': row.unitKerja
      }))

      // Create a temporary file-like object for the import
      const worksheet = XLSX.utils.json_to_sheet(importData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      
      // Convert to blob and create FormData
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const file = new File([blob], 'manual_import.xlsx')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('action', 'import')

      const response = await fetch('/api/operator/pegawai', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.message || 'Gagal mengimpor data')
      
      setImportResult(result.results)
      setImportStep('result')
      fetchPegawaiData()
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "destructive" 
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    try {
      const headers = [['NIP', 'NAMA', 'GOLONGAN', 'TMT JABATAN', 'JABATAN', 'UNIT KERJA']]
      const sampleData = [
        ['198012251234567890', 'Ahmad Sutanto', 'III/c', '2023-01-15', 'Guru Kelas', 'SD Negeri 1 Balikpapan'],
        ['198112251234567891', 'Siti Nurjanah', 'III/d', '2023-02-01', 'Guru Matematika', 'SMP Negeri 2 Balikpapan'],
        ['198212251234567892', 'Budi Prasetyo', 'IV/a', '2023-03-10', 'Kepala Sekolah', 'SMA Negeri 1 Balikpapan']
      ]
      
      const allData = [headers[0], ...sampleData]
      const ws = XLSX.utils.aoa_to_sheet(allData)
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // NIP
        { wch: 25 }, // NAMA
        { wch: 15 }, // GOLONGAN
        { wch: 15 }, // TMT JABATAN
        { wch: 20 }, // JABATAN
        { wch: 30 }  // UNIT KERJA
      ]
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Template Pegawai')
      XLSX.writeFile(wb, 'template_impor_pegawai.xlsx')
      
      toast({
        title: "Template Berhasil Diunduh",
        description: "File template_impor_pegawai.xlsx telah diunduh. Silakan isi data sesuai format: NIP, NAMA, GOLONGAN, TMT JABATAN, JABATAN, UNIT KERJA.",
        variant: "default"
      })
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({ 
        title: "Error", 
        description: "Gagal mengunduh template. Silakan coba lagi.", 
        variant: "destructive" 
      })
    }
  }

  const previewHeaders = useMemo(() => {
    if (!importPreview.length) return []
    return Object.keys(importPreview[0])
  }, [importPreview])

  // Render Dashboard with Real-time Data
  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Enhanced Header with Wilayah Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-2xl shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-3xl font-bold text-white">Manajemen Pegawai</CardTitle>
                    {operatorInfo?.wilayahRelasi && (
                      <div className="text-green-100 dark:text-green-200 mt-1 flex items-center gap-2">
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
                    className="bg-white/20 hover:bg-white/30 border-white/30 text-white hover:text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Tambah Pegawai
                  </Button>
                  <Button 
                    onClick={() => { 
                      try {
                        // Reset dialog state
                        setImportStep('method');
                        setImportMethod('upload');
                        setImportFile(null);
                        setImportPreview([]);
                        setImportResult(null);
                        setManualRows([{ nip: '', nama: '', golongan: '', tmtJabatan: '', jabatan: '', unitKerja: '' }]);
                        setIsImporting(false);
                        // Open dialog
                        setShowImportDialog(true);
                        console.log("Import dialog opened");
                      } catch (error) {
                        console.error("Error opening import dialog:", error);
                        toast({ 
                          title: "Error", 
                          description: "Gagal membuka dialog import", 
                          variant: "destructive" 
                        });
                      }
                    }} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30 text-white hover:text-white"
                  >
                    <FileUp className="h-4 w-4 mr-2" /> Import Data
                  </Button>
                  <Button 
                    onClick={fetchPegawaiData} 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 border-white/30 text-white hover:text-white"
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
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Pegawai</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{summary.totalPegawai}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">Dengan Usulan</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">{summary.pegawaiDenganUsulan}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Total Usulan</p>
                  <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{summary.totalUsulan}</p>
                </div>
                <Send className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Usulan Aktif</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{summary.usulanAktif}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <Card className="shadow-md rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              placeholder="Cari NIP atau Nama..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
              className="md:col-span-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
            />
            <Select onValueChange={(v) => { setUnitKerjaFilter(v); setCurrentPage(1); }} defaultValue="all">
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Filter Unit Kerja" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {unitKerjaOptions.map(opt => <SelectItem key={opt.id} value={opt.nama}>{opt.nama}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }} defaultValue="all">
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Filter Status Usulan" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="ada_usulan">Ada Usulan</SelectItem>
                <SelectItem value="tidak_ada_usulan">Belum Ada Usulan</SelectItem>
                <SelectItem value="aktif">Usulan Aktif</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="shadow-md rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-gray-100">Daftar Pegawai</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tampilkan:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[80px] h-8 text-xs">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-700 dark:text-gray-300">No</TableHead>
                  <TableHead 
                    className={`text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${sortField === 'name' ? 'font-bold' : ''}`}
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Nama / NIP
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? 
                          <ArrowUpIcon className="h-4 w-4" /> : 
                          <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${sortField === 'unitKerja' ? 'font-bold' : ''}`}
                    onClick={() => handleSort('unitKerja')}
                  >
                    <div className="flex items-center gap-1">
                      Unit Kerja
                      {sortField === 'unitKerja' && (
                        sortDirection === 'asc' ? 
                          <ArrowUpIcon className="h-4 w-4" /> : 
                          <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${sortField === 'jabatan' ? 'font-bold' : ''}`}
                    onClick={() => handleSort('jabatan')}
                  >
                    <div className="flex items-center gap-1">
                      Jabatan
                      {sortField === 'jabatan' && (
                        sortDirection === 'asc' ? 
                          <ArrowUpIcon className="h-4 w-4" /> : 
                          <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${sortField === 'golongan' ? 'font-bold' : ''}`}
                    onClick={() => handleSort('golongan')}
                  >
                    <div className="flex items-center gap-1">
                      Golongan
                      {sortField === 'golongan' && (
                        sortDirection === 'asc' ? 
                          <ArrowUpIcon className="h-4 w-4" /> : 
                          <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status Usulan</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(itemsPerPage).fill(0).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.length > 0 ? (
                  data.map((pegawai, index) => (
                    <TableRow key={pegawai.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <TableCell className="text-gray-900 dark:text-gray-100">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{pegawai.nama}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{pegawai.nip}</div>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{pegawai.unitKerja || '-'}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{pegawai.jabatan || '-'}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{pegawai.golongan || '-'}</TableCell>
                      <TableCell><Badge variant={pegawai.proposalStatus === 'Belum Ada Usulan' ? 'secondary' : 'default'}>{pegawai.proposalStatus}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleViewDetail(pegawai)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-600">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center text-gray-600 dark:text-gray-400">Data tidak ditemukan.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Menampilkan {totalItems > 0 ? `${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - ${Math.min(currentPage * itemsPerPage, totalItems)} dari ${totalItems}` : '0'} data
              </div>
              <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: Math.min(5, Math.max(1, totalPages)) }, (_, i) => {
                    // Calculate page numbers to show (always show 5 if available)
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={`page-${pageNum}`}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Add Pegawai Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Tambah Pegawai Baru</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span className="text-red-500">*</span> Field wajib diisi. Field lainnya opsional.
              </p>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nip" className="text-gray-700 dark:text-gray-300">NIP (18 digit) <span className="text-red-500">*</span></Label>
                  <Input 
                    id="nip" 
                    value={formData.nip} 
                    onChange={(e) => setFormData({...formData, nip: e.target.value})} 
                    required 
                    maxLength={18} 
                    placeholder="198012251234567890" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                    placeholder="Nama lengkap pegawai" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email (Opsional)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="email@example.com (akan dibuatkan otomatis jika kosong)" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="golongan" className="text-gray-700 dark:text-gray-300">Golongan (Opsional)</Label>
                  <Input 
                    id="golongan" 
                    value={formData.golongan} 
                    onChange={(e) => setFormData({...formData, golongan: e.target.value})} 
                    placeholder="III/c" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="jabatan" className="text-gray-700 dark:text-gray-300">Jabatan (Opsional)</Label>
                  <Input 
                    id="jabatan" 
                    value={formData.jabatan} 
                    onChange={(e) => setFormData({...formData, jabatan: e.target.value})} 
                    placeholder="Guru/Kepala Sekolah" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="tmtJabatan" className="text-gray-700 dark:text-gray-300">TMT Jabatan (Opsional)</Label>
                  <Input 
                    id="tmtJabatan" 
                    type="date" 
                    value={formData.tmtJabatan} 
                    onChange={(e) => setFormData({...formData, tmtJabatan: e.target.value})} 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="unitKerjaId" className="text-gray-700 dark:text-gray-300">Unit Kerja (Opsional)</Label>
                  <Select value={formData.unitKerjaId} onValueChange={(value) => setFormData({ ...formData, unitKerjaId: value })}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Pilih sekolah (opsional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      {unitKerjaOptions.map((unit) => (<SelectItem key={unit.id} value={unit.id}>{unit.nama}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">No. Telepon (Opsional)</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="081234567890" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Alamat (Opsional)</Label>
                  <Input 
                    id="address" 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    placeholder="Alamat lengkap" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); resetAddForm(); }}>Batal</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog 
          open={showImportDialog} 
          onOpenChange={(open) => {
            if (!open) {
              // Reset all import state when closing the dialog
              resetImport();
            }
            setShowImportDialog(open);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Import Data Pegawai</DialogTitle>
            </DialogHeader>
            
            {/* Method Selection */}
            {importStep === 'method' && (
              <div className="space-y-4 p-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Pilih Metode Import</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all border-2 ${importMethod === 'manual' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'} bg-white dark:bg-gray-700`}
                    onClick={() => setImportMethod('manual')}
                  >
                    <CardContent className="p-6 text-center">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Input Manual</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Isi data pegawai langsung di formulir</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-all border-2 ${importMethod === 'upload' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'} bg-white dark:bg-gray-700`}
                    onClick={() => setImportMethod('upload')}
                  >
                    <CardContent className="p-6 text-center">
                      <FileUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Upload File</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Upload file Excel/CSV</p>
                    </CardContent>
                  </Card>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>Batal</Button>
                  <Button onClick={() => setImportStep(importMethod)}>
                    Lanjutkan ke {importMethod === 'manual' ? 'Input Manual' : 'Upload File'}
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* Manual Input */}
            {importStep === 'manual' && (
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Input Data Manual</h3>
                  <Button variant="outline" size="sm" onClick={addManualRow}>
                    <UserPlus className="h-4 w-4 mr-2" /> Tambah Baris
                  </Button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Format Data:</h4>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded border text-sm font-mono text-gray-900 dark:text-gray-100">
                    NIP | NAMA | GOLONGAN | TMT JABATAN | JABATAN | UNIT KERJA
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    • NIP dan NAMA wajib diisi<br/>
                    • TMT JABATAN: Format tanggal YYYY-MM-DD<br/>
                    • UNIT KERJA: Bisa ketik manual atau pilih dari dropdown
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        <TableHead className="w-[150px] text-gray-700 dark:text-gray-300">NIP *</TableHead>
                        <TableHead className="w-[200px] text-gray-700 dark:text-gray-300">NAMA *</TableHead>
                        <TableHead className="w-[100px] text-gray-700 dark:text-gray-300">GOLONGAN</TableHead>
                        <TableHead className="w-[120px] text-gray-700 dark:text-gray-300">TMT JABATAN</TableHead>
                        <TableHead className="w-[150px] text-gray-700 dark:text-gray-300">JABATAN</TableHead>
                        <TableHead className="w-[200px] text-gray-700 dark:text-gray-300">UNIT KERJA</TableHead>
                        <TableHead className="w-[80px] text-gray-700 dark:text-gray-300">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualRows.map((row, index) => (
                        <TableRow key={index} className="border-gray-200 dark:border-gray-600">
                          <TableCell>
                            <Input
                              value={row.nip}
                              onChange={(e) => updateManualRow(index, 'nip', e.target.value)}
                              placeholder="18 digit"
                              maxLength={18}
                              className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.nama}
                              onChange={(e) => updateManualRow(index, 'nama', e.target.value)}
                              placeholder="Nama lengkap"
                              className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.golongan}
                              onChange={(e) => updateManualRow(index, 'golongan', e.target.value)}
                              placeholder="III/c"
                              className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={row.tmtJabatan}
                              onChange={(e) => updateManualRow(index, 'tmtJabatan', e.target.value)}
                              className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.jabatan}
                              onChange={(e) => updateManualRow(index, 'jabatan', e.target.value)}
                              placeholder="Guru/Kepala Sekolah"
                              className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={row.unitKerja} 
                              onValueChange={(value) => updateManualRow(index, 'unitKerja', value)}
                            >
                              <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder="Pilih atau ketik unit kerja" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                {unitKerjaOptions.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.nama}>
                                    {unit.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={row.unitKerja}
                              onChange={(e) => updateManualRow(index, 'unitKerja', e.target.value)}
                              placeholder="Atau ketik manual"
                              className="w-full mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeManualRow(index)}
                              disabled={manualRows.length === 1}
                              className="hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                            >
                              ✕
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setImportStep('method')}>Kembali</Button>
                  <Button onClick={handleManualImport} disabled={isImporting}>
                    {isImporting ? 'Mengimpor...' : `Import ${manualRows.filter(r => r.nip && r.nama).length} Data`}
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* File Upload */}
            {importStep === 'upload' && (
              <div className="space-y-4 p-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Format File Excel/CSV:</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                    File harus mengandung kolom berikut (urutan harus sesuai):
                  </p>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded border text-sm font-mono text-gray-900 dark:text-gray-100">
                    NIP | NAMA | GOLONGAN | TMT JABATAN | JABATAN | UNIT KERJA
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    • NIP: 18 digit angka<br/>
                    • TMT JABATAN: Format tanggal YYYY-MM-DD<br/>
                    • UNIT KERJA: Nama sekolah yang sudah ada di sistem
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate} 
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download Template & Contoh
                  </Button>
                </div>
                <div className="border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 rounded-md p-4">
                  <Input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleFileSelect}
                    className="border-none focus:ring-0 bg-transparent text-gray-900 dark:text-gray-100"
                  />
                </div>
                {importFile && (
                  <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 dark:border-green-800">
                    ✓ File dipilih: {importFile.name}
                  </div>
                )}
                <DialogFooter>
                  <Button 
                    variant="ghost" 
                    onClick={() => setImportStep('method')}
                    type="button"
                  >
                    Kembali
                  </Button>
                  <Button 
                    onClick={handlePreviewImport} 
                    disabled={!importFile || isImporting}
                    type="button"
                    className={!importFile ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {isImporting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                    ) : (
                      <>Lanjutkan ke Pratinjau</>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* Preview */}
            {importStep === 'preview' && (
              <div className="space-y-4 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pratinjau Data ({importPreview.length} baris)</h3>
                <div className="max-h-64 overflow-auto border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        {previewHeaders.map(h => <TableHead key={h} className="text-gray-700 dark:text-gray-300">{h}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.slice(0, 10).map((row, i) => (
                        <TableRow key={i} className="border-gray-200 dark:border-gray-600">
                          {previewHeaders.map(h => <TableCell key={h} className="text-gray-900 dark:text-gray-100">{String(row[h] ?? '')}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DialogFooter>
                  <Button 
                    variant="ghost" 
                    onClick={() => setImportStep('upload')}
                    type="button"
                  >
                    Kembali
                  </Button>
                  <Button 
                    onClick={handleConfirmImport} 
                    disabled={isImporting}
                    type="button"
                    className={isImporting ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {isImporting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengimpor...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Konfirmasi & Import {importPreview.length} Data</>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* Result */}
            {importStep === 'result' && importResult && (
              <div className="space-y-4 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Hasil Import</h3>
                <div className="flex items-center gap-4 p-4 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-gray-900 dark:text-gray-100">{importResult.success} data berhasil diimpor.</p>
                </div>
                {importResult.failed > 0 && (
                  <div className="p-4 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
                      <p className="text-gray-900 dark:text-gray-100">{importResult.failed} data gagal diimpor.</p>
                    </div>
                    <ul className="list-disc list-inside mt-2 text-sm max-h-40 overflow-auto text-gray-700 dark:text-gray-300">
                      {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setShowImportDialog(false)}>Selesai</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Detail Pegawai Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Detail Pegawai
              </DialogTitle>
            </DialogHeader>
            
            {selectedPegawai && (
              <div className="space-y-6">
                {/* Header with Photo */}
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    <Image 
                      src="/placeholder-user.jpg" 
                      alt={selectedPegawai.nama || ''} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedPegawai.nama}</h2>
                    <div className="flex flex-col md:flex-row gap-2 md:items-center mt-2">
                      <Badge variant="outline" className="text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200">
                        NIP: {selectedPegawai.nip}
                      </Badge>
                      {selectedPegawai.golongan && (
                        <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-950 border-green-200">
                          Golongan: {selectedPegawai.golongan}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-purple-600 bg-purple-50 dark:bg-purple-950 border-purple-200">
                        Status: {selectedPegawai.proposalStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Detail Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Informasi Utama</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit Kerja</div>
                        <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{selectedPegawai.unitKerja || '-'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Jabatan</div>
                        <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{selectedPegawai.jabatan || '-'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Jenis Jabatan</div>
                        <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{selectedPegawai.jenisJabatan || '-'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</div>
                        <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{selectedPegawai.email || '-'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Telepon</div>
                        <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{selectedPegawai.phone || '-'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Alamat</div>
                        <div className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{selectedPegawai.address || '-'}</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Riwayat Usulan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPegawai.proposals && selectedPegawai.proposals.length > 0 ? (
                        <div className="space-y-3">
                          {selectedPegawai.proposals.map((proposal, index) => (
                            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              <div className="flex justify-between">
                                <Badge>{proposal.status}</Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(proposal.createdAt).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Dari: </span> 
                                {proposal.currentGolongan || '-'}
                                <span className="mx-2">→</span>
                                <span className="font-medium">Ke: </span>
                                {proposal.targetGolongan || '-'}
                              </div>
                              {proposal.notes && (
                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                  <span className="font-medium">Catatan: </span> 
                                  {proposal.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                          <InboxIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
                          <p>Belum ada usulan kenaikan pangkat</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
                  <Button>Edit Data</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
