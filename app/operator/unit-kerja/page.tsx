"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Users, MapPin, School, Download, FileText, Filter, Eye, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, PlusCircle,
  FileUp, Loader2, CheckCircle, AlertTriangle, Building, RefreshCw, UserPlus, 
  CheckCircle2, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ExportButton } from "@/components/export-button"
import { ExportColumn, formatDate } from "@/lib/export-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardLayout } from "@/components/dashboard-layout"
import { motion } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { UnitKerjaDetail } from "./unit-kerja-detail"
import { formatRelativeTime } from "@/lib/date-utils"
import { syncSchoolData } from "@/lib/school-utils"
import { ProgressModal, type ProgressStatus } from "@/components/progress-modal"

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
  kabupaten: string | null
  provinsi: string | null
  latitude: number | null
  longitude: number | null
  bentukSekolah: string | null
  statusSekolah: string | null
  lastSyncedAt: string | null
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

// Enhanced Interfaces with WilayahMaster
interface WilayahMaster {
  id: string
  kode: string
  nama: string
  namaLengkap: string
  ibukota: string
}

interface OperatorInfo {
  id: string
  name: string
  role: string
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
}

// Operator Account Interfaces
interface OperatorAccount {
  id: string
  nip: string
  name: string
  email: string | null
  phone: string | null
  mustChangePassword: boolean
  createdAt: string
}

interface UnitKerjaOperatorStatus {
  unitKerjaId: string
  unitKerjaNama: string
  unitKerjaNpsn: string | null
  hasOperator: boolean
  hasValidData: boolean
  operator: OperatorAccount | null
}

interface CreateOperatorResult {
  created: Array<{
    unitKerjaId: string
    unitKerjaNama: string
    operatorId: string
    nip: string
    name: string
    defaultPassword: string
  }>
  skipped: Array<{
    unitKerjaId: string
    unitKerjaNama: string
    existingNip: string
    reason: string
  }>
  errors: Array<{
    unitKerjaId: string
    unitKerjaNama: string
    error: string
  }>
}

export default function OperatorUnitKerjaPage() {
  const { toast } = useToast()
  const [filteredData, setFilteredData] = useState<UnitKerja[]>([])
  const [search, setSearch] = useState("")
  const [jenjangFilter, setJenjangFilter] = useState("all")
  const [kecamatanFilter, setKecamatanFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState({
    totalUnitKerja: 0,
    totalPegawai: 0,
    totalUsulan: 0,
    unitAktif: 0
  })
  
  // Operator info state
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Filter options
  const [jenjangOptions, setJenjangOptions] = useState<string[]>([])
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<UnitKerja | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Operator Accounts Dialog states
  const [showOperatorAccountsDialog, setShowOperatorAccountsDialog] = useState(false)
  const [operatorAccountsStatus, setOperatorAccountsStatus] = useState<UnitKerjaOperatorStatus[]>([])
  const [operatorAccountsSummary, setOperatorAccountsSummary] = useState({
    totalUnitKerja: 0,
    withOperator: 0,
    withoutOperator: 0,
    invalidData: 0
  })
  const [selectedUnitKerjaIds, setSelectedUnitKerjaIds] = useState<string[]>([])
  const [isCreatingOperators, setIsCreatingOperators] = useState(false)
  const [createOperatorResult, setCreateOperatorResult] = useState<CreateOperatorResult | null>(null)
  const [showCreateResultDialog, setShowCreateResultDialog] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    nama: '', 
    npsn: '', 
    jenjang: 'SD', 
    alamat: '', 
    kecamatan: '', 
    status: 'Aktif',
    kepalaSekolah: '',
    phone: '',
    email: '',
    website: ''
  })
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  // Auto sync state
  const [isAutoSyncing, setIsAutoSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncTotal, setSyncTotal] = useState(0)
  
  // Progress Modal state
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressModalProps, setProgressModalProps] = useState({
    title: "",
    description: "",
    progress: 0,
    current: 0,
    total: 0,
    status: 'loading' as ProgressStatus,
    statusMessage: ""
  })
  
  // Export columns
  const exportColumns: ExportColumn[] = [
    { header: 'Nama Sekolah', accessor: 'nama', width: 30 },
    { header: 'NPSN', accessor: 'npsn', width: 15 },
    { header: 'Jenjang', accessor: 'jenjang', width: 10 },
    { header: 'Alamat', accessor: 'alamat', width: 30 },
    { header: 'Kecamatan', accessor: 'kecamatan', width: 20 },
    { header: 'Status', accessor: 'status', width: 15 },
    { header: 'Kepala Sekolah', accessor: 'kepalaSekolah', width: 25 },
    { header: 'Email', accessor: 'email', width: 25 },
    { header: 'Telepon', accessor: 'phone', width: 20 },
    { header: 'Website', accessor: 'website', width: 25 },
    { header: 'Jumlah Pegawai', accessor: 'jumlahPegawai', width: 15 }
  ]

  const fetchUnitKerjaData = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true)
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })
      
      if (search) params.append('search', search)
      if (jenjangFilter !== 'all') params.append('jenjang', jenjangFilter)
      if (kecamatanFilter !== 'all') params.append('kecamatan', kecamatanFilter)
      
      const response = await fetch(`/api/operator/unit-kerja?${params.toString()}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Periksa struktur data dan atur format dengan aman
        let formattedData = [];
        
        // Struktur respons API dapat bervariasi, kita perlu menangani semua kemungkinan
        if (data.data && Array.isArray(data.data)) {
          // Jika data.data sendiri adalah array
          formattedData = data.data.map((uk: UnitKerja) => formatUnitKerjaData(uk));
        } else if (data.data && data.data.length > 0) {
          // Jika data.data adalah array
          formattedData = data.data.map((uk: UnitKerja) => formatUnitKerjaData(uk));
        } else if (data.data && Array.isArray(data.data.unitKerja)) {
          // Jika data.data.unitKerja adalah array
          formattedData = data.data.unitKerja.map((uk: UnitKerja) => formatUnitKerjaData(uk));
        } else if (data.data) {
          // Jika data.data adalah objek tunggal, buat array
          formattedData = [formatUnitKerjaData(data.data as unknown as UnitKerja)];
        }
        
        // Set operator info from response
        if (data.userInfo) {
          setOperatorInfo({
            id: data.userInfo.id || '',
            name: data.userInfo.name || '',
            role: data.userInfo.role || '',
            wilayah: data.userInfo.wilayah,
            wilayahRelasi: data.userInfo.wilayahRelasi
          })
        }
        
        setFilteredData(formattedData)
        
        // Simpan opsi filter dari API
        if (data.filterOptions) {
          if (Array.isArray(data.filterOptions.jenjang)) {
            setJenjangOptions(data.filterOptions.jenjang);
          }
          
          if (Array.isArray(data.filterOptions.kecamatan)) {
            setKecamatanOptions(data.filterOptions.kecamatan);
          }
        }
        
        // Pastikan pagination ada sebelum mengakses propertinya
        if (data.pagination) {
          setTotalItems(data.pagination.totalCount || 0)
          setTotalPages(data.pagination.totalPages || 1)
        } else {
          // Fallback jika pagination ada di dalam data
          const totalCount = data.data?.pagination?.totalCount || 0;
          const totalPages = data.data?.pagination?.totalPages || 1;
          
          setTotalItems(totalCount)
          setTotalPages(totalPages)
        }
        
        // Set summary dengan aman
        if (data.summary) {
          setSummary({
            totalUnitKerja: data.summary.totalUnitKerja || 0,
            totalPegawai: data.summary.totalPegawai || 0,
            totalUsulan: data.summary.totalUsulan || 0,
            unitAktif: data.summary.unitAktif || 0
          })
        } else {
          // Fallback jika summary ada di dalam data
          setSummary({
            totalUnitKerja: data.data?.summary?.totalUnitKerja || 0,
            totalPegawai: data.data?.summary?.totalPegawai || 0,
            totalUsulan: data.data?.summary?.totalUsulan || 0,
            unitAktif: data.data?.summary?.unitAktif || 0
          })
        }
      } else {
        throw new Error(data.message || 'Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching unit kerja data:', error)
      
      // Jika halaman error pada refresh, kembali ke halaman 1
      if (refreshing && currentPage > 1) {
        setCurrentPage(1)
      } else {
        setFilteredData([]) // Reset data jika terjadi error
      }
      
      // Tampilkan pesan error yang lebih spesifik
      let errorMessage = 'Gagal mengambil data'
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentPage, itemsPerPage, search, jenjangFilter, kecamatanFilter, refreshing, toast])
  
  // Fungsi bantuan untuk memformat data unit kerja
  function formatUnitKerjaData(uk: UnitKerja) {
    if (!uk) return null;
    
    // Validasi tanggal sebelum konversi
    let createdAtFormatted = uk.createdAt;
    let updatedAtFormatted = uk.updatedAt;
    
    try {
      // Hanya konversi jika tanggal valid
      if (uk.createdAt) {
        const createdDate = new Date(uk.createdAt);
        if (!isNaN(createdDate.getTime())) {
          createdAtFormatted = createdDate.toISOString();
        }
      }
      
      if (uk.updatedAt) {
        const updatedDate = new Date(uk.updatedAt);
        if (!isNaN(updatedDate.getTime())) {
          updatedAtFormatted = updatedDate.toISOString();
        }
      }
    } catch (e) {
      console.warn("Error memformat tanggal:", e);
    }
    
    return {
      ...uk,
      wilayahNama: uk.wilayahRelasi?.nama || 'Tidak diketahui',
      createdAt: createdAtFormatted,
      updatedAt: updatedAtFormatted
    };
  }

  useEffect(() => {
    fetchUnitKerjaData()
  }, [fetchUnitKerjaData])

  // Handle search with case-insensitive matching
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    // Reset to page 1 when searching
    setCurrentPage(1)
  }

  // Handler untuk refresh data
  const handleRefresh = () => {
    setRefreshing(true)
    fetchUnitKerjaData()
  }
  
  // Auto-sync data dari API eksternal
  const handleAutoSync = async () => {
    if (isAutoSyncing) return;
    
    try {
      // Cari sekolah yang belum pernah disinkronkan
      const unSyncedSchools = filteredData.filter(unit => !unit.lastSyncedAt);
      
      if (unSyncedSchools.length === 0) {
        toast({
          title: "Tidak ada data untuk disinkronkan",
          description: "Semua unit kerja telah memiliki data sinkronisasi",
        });
        return;
      }
      
      setIsAutoSyncing(true);
      setSyncTotal(unSyncedSchools.length);
      
      // Show progress modal
      setShowProgressModal(true);
      setProgressModalProps({
        title: "Sinkronisasi Unit Kerja",
        description: `Memulai sinkronisasi ${unSyncedSchools.length} unit kerja...`,
        progress: 0,
        current: 0,
        total: unSyncedSchools.length,
        status: 'loading',
        statusMessage: "Mempersiapkan sinkronisasi data..."
      });
      
      let successCount = 0;
      let failCount = 0;
      let lastErrorMessage = "";
      
      // Membatasi jumlah sekolah yang diproses bersamaan untuk menghindari timeout
      const batchSize = 5; // Proses 5 sekolah sekaligus
      const totalBatches = Math.ceil(unSyncedSchools.length / batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, unSyncedSchools.length);
        const currentBatch = unSyncedSchools.slice(startIndex, endIndex);
        
        // Update progress modal for each batch
        setProgressModalProps(prev => ({
          ...prev,
          description: `Menyinkronkan batch ${batchIndex + 1} dari ${totalBatches}...`,
          statusMessage: `Memproses unit kerja ${startIndex + 1}-${endIndex} dari ${unSyncedSchools.length}`
        }));
        
        // Membuat array promises untuk batch saat ini
        const batchPromises = currentBatch.map(async (school, index) => {
          const currentProgress = startIndex + index + 1;
          const progressPercent = (currentProgress / unSyncedSchools.length) * 100;
          
          setSyncProgress(currentProgress);
          
          // Update progress modal for each school
          setProgressModalProps(prev => ({
            ...prev,
            progress: progressPercent,
            current: currentProgress,
            statusMessage: `Sinkronisasi ${school.nama}...`
          }));
          
          try {
            // Tambahkan jeda antar permintaan untuk menghindari rate limit
            await new Promise(resolve => setTimeout(resolve, index * 300));
            
            // Lakukan sinkronisasi
            const result = await syncSchoolData(school.id, school.nama);
            
            if (result.success) {
              return { success: true, school: school.nama };
            } else {
              console.warn(`Gagal sinkronisasi ${school.nama}: ${result.message}`);
              lastErrorMessage = result.message;
              return { success: false, school: school.nama, error: result.message };
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error sinkronisasi ${school.nama}:`, errorMessage);
            lastErrorMessage = errorMessage;
            return { success: false, school: school.nama, error: errorMessage };
          }
        });
        
        // Tunggu semua promises dalam batch selesai
        const batchResults = await Promise.all(batchPromises);
        
        // Hitung jumlah sukses dan gagal
        const batchSuccessCount = batchResults.filter(result => result.success).length;
        const batchFailCount = batchResults.filter(result => !result.success).length;
        
        successCount += batchSuccessCount;
        failCount += batchFailCount;
        
        // Update progress modal with batch results
        setProgressModalProps(prev => ({
          ...prev,
          statusMessage: `Batch ${batchIndex + 1}: ${batchSuccessCount} berhasil, ${batchFailCount} gagal`
        }));
        
        // Berikan jeda antar batch untuk menghindari rate limit API
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Refresh data setelah selesai
      await fetchUnitKerjaData();
      
      // Update final state of progress modal
      if (successCount > 0) {
        setProgressModalProps({
          title: "Sinkronisasi Selesai",
          description: `Proses sinkronisasi ${unSyncedSchools.length} unit kerja telah selesai`,
          progress: 100,
          current: unSyncedSchools.length,
          total: unSyncedSchools.length,
          status: failCount > 0 ? 'warning' : 'success',
          statusMessage: `Berhasil: ${successCount}, Gagal: ${failCount} dari total ${unSyncedSchools.length} unit kerja`
        });
        
        toast({
          title: "Sinkronisasi Selesai",
          description: `Berhasil: ${successCount}, Gagal: ${failCount} dari total ${unSyncedSchools.length} unit kerja`,
          variant: "default",
        });
      } else {
        setProgressModalProps({
          title: "Sinkronisasi Gagal",
          description: `Tidak ada unit kerja yang berhasil disinkronkan`,
          progress: 100,
          current: 0,
          total: unSyncedSchools.length,
          status: 'error',
          statusMessage: `Semua ${unSyncedSchools.length} unit kerja gagal disinkronkan. Error: ${lastErrorMessage}`
        });
        
        toast({
          title: "Sinkronisasi Gagal",
          description: `Semua ${unSyncedSchools.length} unit kerja gagal disinkronkan. Error: ${lastErrorMessage}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error during auto-sync:", errorMessage);
      
      // Update progress modal to error state
      setProgressModalProps({
        title: "Error Sinkronisasi",
        description: "Terjadi kesalahan saat proses sinkronisasi",
        progress: 100,
        current: 0,
        total: syncTotal,
        status: 'error',
        statusMessage: errorMessage
      });
      
      toast({
        title: "Error Sinkronisasi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAutoSyncing(false);
      setSyncProgress(0);
      // Progress modal will auto-close on success after 3s (as configured in the component)
    }
  }

  const handleExport = async () => {
    console.log("Exporting unit kerja data...")
    toast({
      title: "Mengekspor data",
      description: "Mempersiapkan data unit kerja...",
      duration: 3000,
    })
    
    try {
      // Mengambil semua data tanpa paginasi
      const response = await fetch(`/api/operator/unit-kerja/export`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch export data')
      }
      
      // Proses data untuk export
      // TODO: Implement Excel export
      toast({
        title: "Berhasil",
        description: "Data berhasil diekspor",
        duration: 3000,
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengekspor data",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  // Fetch operator accounts status
  const fetchOperatorAccountsStatus = async () => {
    try {
      const response = await fetch('/api/operator/unit-kerja/create-operator-accounts', {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch operator accounts status')
      }
      
      setOperatorAccountsStatus(data.data)
      setOperatorAccountsSummary(data.summary)
      
    } catch (error) {
      console.error('Error fetching operator accounts status:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil status akun operator",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  // Handle open operator accounts dialog
  const handleOpenOperatorAccountsDialog = async () => {
    setShowOperatorAccountsDialog(true)
    await fetchOperatorAccountsStatus()
  }

  // Handle create operator accounts
  const handleCreateOperatorAccounts = async () => {
    if (selectedUnitKerjaIds.length === 0) {
      toast({
        title: "Peringatan",
        description: "Pilih minimal satu unit kerja untuk dibuatkan akun operator",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    setIsCreatingOperators(true)
    
    try {
      const response = await fetch('/api/operator/unit-kerja/create-operator-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitKerjaIds: selectedUnitKerjaIds
        })
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create operator accounts')
      }
      
      setCreateOperatorResult(data.data)
      setShowCreateResultDialog(true)
      setShowOperatorAccountsDialog(false)
      setSelectedUnitKerjaIds([])
      
      // Refresh operator accounts status
      await fetchOperatorAccountsStatus()
      
      toast({
        title: "Berhasil",
        description: data.message,
        duration: 5000,
      })
      
    } catch (error) {
      console.error('Error creating operator accounts:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal membuat akun operator",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsCreatingOperators(false)
    }
  }

  // Toggle unit kerja selection
  const toggleUnitKerjaSelection = (unitKerjaId: string) => {
    setSelectedUnitKerjaIds(prev => 
      prev.includes(unitKerjaId)
        ? prev.filter(id => id !== unitKerjaId)
        : [...prev, unitKerjaId]
    )
  }

  // Select all unit kerja without operators
  const selectAllWithoutOperators = () => {
    const unitsWithoutOperators = operatorAccountsStatus
      .filter(unit => !unit.hasOperator && unit.hasValidData)
      .map(unit => unit.unitKerjaId)
    setSelectedUnitKerjaIds(unitsWithoutOperators)
  }
  
  // Add debounce for search
  useEffect(() => {
    // Debounce the search to prevent too many API calls
    const handler = setTimeout(() => {
      fetchUnitKerjaData();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search, fetchUnitKerjaData]);
  
  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }
  
  // View unit kerja details
  const handleViewDetail = (unitKerja: UnitKerja) => {
    setSelectedUnitKerja(unitKerja)
    setShowDetailDialog(true)
  }
  
  // Handle add unit kerja form submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Validate required fields
      if (!formData.nama || !formData.jenjang) {
        throw new Error('Nama dan jenjang wajib diisi')
      }
      
      // Create the API request
      const response = await fetch('/api/operator/unit-kerja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gagal menambahkan unit kerja (${response.status}): ${errorText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Unit kerja berhasil ditambahkan",
          variant: "default",
        })
        
        // Reset form and close dialog
        resetAddForm()
        setShowAddDialog(false)
        
        // Refresh data
        fetchUnitKerjaData()
      } else {
        throw new Error(result.message || 'Gagal menambahkan unit kerja')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  // Handle file selection for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0])
    }
  }
  
  // Handle import submission
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Pilih file terlebih dahulu",
        variant: "destructive",
      })
      return
    }
    
    setIsImporting(true)
    setShowProgressModal(true)
    setProgressModalProps({
      title: "Mengimpor Data Unit Kerja",
      description: `Mengimpor data dari file ${importFile.name}...`,
      progress: 0,
      current: 0,
      total: 100,
      status: 'loading',
      statusMessage: "Memproses file dan memvalidasi data..."
    })
    
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('action', 'import')
      
      // Simulate detailed progress for better UX
      const progressStages = [
        { progress: 10, message: "Menganalisis format file..." },
        { progress: 20, message: "Memvalidasi struktur data..." },
        { progress: 30, message: "Memeriksa duplikasi data..." },
        { progress: 40, message: "Menyiapkan data untuk diimpor..." },
        { progress: 50, message: "Membuka koneksi database..." },
        { progress: 60, message: "Mengimpor data ke database..." },
        { progress: 75, message: "Memeriksa integritas data..." },
        { progress: 85, message: "Menyelesaikan proses import..." },
        { progress: 95, message: "Menyimpan perubahan..." }
      ];
      
      let stageIndex = 0;
      const progressInterval = setInterval(() => {
        if (stageIndex < progressStages.length) {
          const stage = progressStages[stageIndex];
          setProgressModalProps(prev => ({
            ...prev,
            progress: stage.progress,
            current: stage.progress,
            statusMessage: stage.message
          }));
          stageIndex++;
        }
      }, 800);
      
      const response = await fetch('/api/operator/unit-kerja/import', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      clearInterval(progressInterval)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gagal mengimpor data (${response.status}): ${errorText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Update progress modal to success state
        setProgressModalProps({
          title: "Import Berhasil",
          description: `Data unit kerja berhasil diimpor`,
          progress: 100,
          current: 100,
          total: 100,
          status: 'success',
          statusMessage: `${result.imported || 0} data unit kerja berhasil diimpor dan siap digunakan`
        })
        
        // Reset import
        setImportFile(null)
        
        // Close import dialog but keep progress modal open
        setShowImportDialog(false)
        
        // Refresh data after a short delay
        setTimeout(() => {
          fetchUnitKerjaData()
          // Progress modal will auto-close on success after 3s
        }, 1000)
      } else {
        throw new Error(result.message || 'Gagal mengimpor data')
      }
    } catch (error) {
      // Update progress modal to error state
      setProgressModalProps({
        title: "Import Gagal",
        description: "Terjadi kesalahan saat mengimpor data",
        progress: 100,
        current: 0,
        total: 100,
        status: 'error',
        statusMessage: error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui"
      })
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }
  
  // Reset add form
  const resetAddForm = () => {
    setFormData({
      nama: '', 
      npsn: '', 
      jenjang: 'SD', 
      alamat: '', 
      kecamatan: '', 
      status: 'Aktif',
      kepalaSekolah: '',
      phone: '',
      email: '',
      website: ''
    })
  }
  
  // Download template for import
  const downloadTemplate = () => {
    toast({
      title: "Template",
      description: "Mengunduh template import unit kerja...",
      duration: 3000,
    })
    // In a real app, this would download an Excel template
  }

  if (loading && !refreshing) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data unit kerja...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <School className="h-8 w-8 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold">Manajemen Unit Kerja</h1>
                  {operatorInfo?.wilayahRelasi ? (
                    <div className="text-green-100 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {operatorInfo.wilayahRelasi.nama} ({operatorInfo.wilayahRelasi.namaLengkap})
                      </span>
                    </div>
                  ) : (
                    <p className="text-green-100">Data wilayah belum tersedia</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  disabled={refreshing || isAutoSyncing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Memperbarui...' : 'Refresh Data'}
                </Button>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tambah Unit Kerja
                </Button>
                <Button
                  onClick={() => setShowImportDialog(true)}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={handleOpenOperatorAccountsDialog}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Buat Akun Operator Sekolah
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Unit Kerja</p>
                  <p className="text-2xl font-bold">{summary.totalUnitKerja}</p>
                </div>
                <School className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pegawai</p>
                  <p className="text-2xl font-bold">{summary.totalPegawai}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usulan</p>
                  <p className="text-2xl font-bold">{summary.totalUsulan}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unit Aktif</p>
                  <p className="text-2xl font-bold">{summary.unitAktif}</p>
                </div>
                <MapPin className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter & Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Cari nama sekolah atau NPSN..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>

                <Select value={jenjangFilter} onValueChange={setJenjangFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenjang</SelectItem>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                    <SelectItem value="SMK">SMK</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={kecamatanFilter} onValueChange={setKecamatanFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kecamatan</SelectItem>
                    <SelectItem value="Balikpapan Tengah">Balikpapan Tengah</SelectItem>
                    <SelectItem value="Balikpapan Utara">Balikpapan Utara</SelectItem>
                    <SelectItem value="Balikpapan Kota">Balikpapan Kota</SelectItem>
                    <SelectItem value="Balikpapan Timur">Balikpapan Timur</SelectItem>
                    <SelectItem value="Balikpapan Selatan">Balikpapan Selatan</SelectItem>
                    <SelectItem value="Balikpapan Barat">Balikpapan Barat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <School className="h-5 w-5 mr-2" />
                  Data Unit Kerja (Sekolah)
                </CardTitle>
                <div className="flex items-center gap-4">
                  {/* Export button */}
                  <ExportButton
                    data={filteredData}
                    columns={exportColumns}
                    filename="Data_Unit_Kerja"
                    title="Data Unit Kerja (Sekolah)"
                    disabled={loading || filteredData.length === 0}
                  />
                
                  {/* Auto-sync button for schools without data */}
                  {filteredData.some(unit => !unit.lastSyncedAt) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleAutoSync}
                      disabled={isAutoSyncing}
                      className="text-xs border-yellow-500 hover:bg-yellow-50 text-yellow-600"
                    >
                      {isAutoSyncing ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Sinkronisasi {syncProgress}/{syncTotal}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Sinkronisasi Otomatis
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Badge variant="secondary">{totalItems} unit kerja</Badge>
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
              </div>
              <CardDescription>
                Daftar unit kerja (sekolah) berdasarkan wilayah operator
                {refreshing && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400 animate-pulse">
                    <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />
                    Memperbarui data...
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>NPSN</TableHead>
                      <TableHead>Nama Sekolah</TableHead>
                      <TableHead>Jenjang</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Kecamatan</TableHead>
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Usulan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data API</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((unit, index) => (
                        <TableRow key={unit.id} className={refreshing ? 'opacity-70' : ''}>
                          <TableCell>{index + 1 + (currentPage - 1) * itemsPerPage}</TableCell>
                          <TableCell className="font-mono text-sm">{unit.npsn || '-'}</TableCell>
                          <TableCell className="font-medium">{unit.nama}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{unit.jenjang}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{unit.alamat || 'Belum diisi'}</TableCell>
                          <TableCell>{unit.kecamatan || 'Belum diisi'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-gray-500" />
                              {unit.jumlahPegawai || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-gray-500" />
                              0
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={unit.status === "Aktif" ? "default" : "destructive"}>{unit.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {unit.lastSyncedAt ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Tersedia
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Belum Sinkron
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewDetail(unit)}
                              disabled={refreshing}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                          {refreshing ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Memperbarui data unit kerja...
                            </div>
                          ) : (
                            'Tidak ada data unit kerja yang ditemukan'
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || refreshing}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || refreshing}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                        disabled={refreshing}
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
                    disabled={currentPage === totalPages || refreshing}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || refreshing}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Add Unit Kerja Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Tambah Unit Kerja Baru</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span className="text-red-500">*</span> Field wajib diisi. Field lainnya opsional.
              </p>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nama" className="text-gray-700 dark:text-gray-300">Nama Sekolah <span className="text-red-500">*</span></Label>
                  <Input 
                    id="nama" 
                    value={formData.nama} 
                    onChange={(e) => setFormData({...formData, nama: e.target.value})} 
                    required 
                    placeholder="Nama lengkap sekolah/unit kerja" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="npsn" className="text-gray-700 dark:text-gray-300">NPSN</Label>
                  <Input 
                    id="npsn" 
                    value={formData.npsn} 
                    onChange={(e) => setFormData({...formData, npsn: e.target.value})} 
                    placeholder="Nomor Pokok Sekolah Nasional" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="jenjang" className="text-gray-700 dark:text-gray-300">Jenjang <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.jenjang} 
                    onValueChange={(value) => setFormData({...formData, jenjang: value})}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Pilih Jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SD">SD</SelectItem>
                      <SelectItem value="SMP">SMP</SelectItem>
                      <SelectItem value="SMA">SMA</SelectItem>
                      <SelectItem value="SMK">SMK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="alamat" className="text-gray-700 dark:text-gray-300">Alamat</Label>
                  <Input 
                    id="alamat" 
                    value={formData.alamat} 
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})} 
                    placeholder="Alamat lengkap" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="kecamatan" className="text-gray-700 dark:text-gray-300">Kecamatan</Label>
                  <Select 
                    value={formData.kecamatan} 
                    onValueChange={(value) => setFormData({...formData, kecamatan: value})}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Pilih Kecamatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Balikpapan Tengah">Balikpapan Tengah</SelectItem>
                      <SelectItem value="Balikpapan Utara">Balikpapan Utara</SelectItem>
                      <SelectItem value="Balikpapan Kota">Balikpapan Kota</SelectItem>
                      <SelectItem value="Balikpapan Timur">Balikpapan Timur</SelectItem>
                      <SelectItem value="Balikpapan Selatan">Balikpapan Selatan</SelectItem>
                      <SelectItem value="Balikpapan Barat">Balikpapan Barat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kepalaSekolah" className="text-gray-700 dark:text-gray-300">Kepala Sekolah</Label>
                  <Input 
                    id="kepalaSekolah" 
                    value={formData.kepalaSekolah} 
                    onChange={(e) => setFormData({...formData, kepalaSekolah: e.target.value})} 
                    placeholder="Nama kepala sekolah" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Nomor Telepon</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Nomor telepon sekolah" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="Email sekolah" 
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-gray-700 dark:text-gray-300">Website</Label>
                  <Input 
                    id="website" 
                    value={formData.website} 
                    onChange={(e) => setFormData({...formData, website: e.target.value})} 
                    placeholder="URL website sekolah" 
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
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Import Data Unit Kerja</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Upload file Excel (.xlsx) atau CSV untuk mengimpor data unit kerja secara massal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Format Data:</h4>
                <div className="bg-white dark:bg-gray-700 p-2 rounded border text-sm font-mono text-gray-900 dark:text-gray-100">
                  NAMA | NPSN | JENJANG | ALAMAT | KECAMATAN | STATUS
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  • Kolom NAMA dan JENJANG wajib diisi<br/>
                  • JENJANG: SD, SMP, SMA, atau SMK<br/>
                  • STATUS: Aktif atau Tidak Aktif
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate} 
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" /> Download Template
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
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => { setShowImportDialog(false); setImportFile(null); }}
              >
                Batal
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!importFile || isImporting}
              >
                {isImporting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengimpor...</>
                ) : (
                  <>Import Data</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <UnitKerjaDetail 
          open={showDetailDialog} 
          onOpenChange={setShowDetailDialog} 
          unitKerja={selectedUnitKerja}
          onRefresh={fetchUnitKerjaData}
        />

        {/* Operator Accounts Dialog */}
        <Dialog open={showOperatorAccountsDialog} onOpenChange={setShowOperatorAccountsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Buat Akun Operator Sekolah
              </DialogTitle>
              <DialogDescription>
                Kelola akun operator sekolah untuk unit kerja di wilayah Anda. 
                Akun akan dibuat dengan NIP random dan password default sama dengan NIP.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Unit Kerja</p>
                        <p className="text-xl font-bold">{operatorAccountsSummary.totalUnitKerja}</p>
                      </div>
                      <School className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sudah Ada Operator</p>
                        <p className="text-xl font-bold text-green-600">{operatorAccountsSummary.withOperator}</p>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Belum Ada Operator</p>
                        <p className="text-xl font-bold text-orange-600">{operatorAccountsSummary.withoutOperator}</p>
                      </div>
                      <Clock className="h-6 w-6 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Data Tidak Valid</p>
                        <p className="text-xl font-bold text-red-600">{operatorAccountsSummary.invalidData}</p>
                      </div>
                      <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={selectAllWithoutOperators}
                  variant="outline"
                  size="sm"
                >
                  Pilih Semua yang Belum Ada Operator
                </Button>
                <Button
                  onClick={() => setSelectedUnitKerjaIds([])}
                  variant="outline"
                  size="sm"
                >
                  Hapus Pilihan
                </Button>
                <div className="flex-1" />
                <span className="text-sm text-gray-600 py-2">
                  {selectedUnitKerjaIds.length} unit kerja dipilih
                </span>
              </div>

              {/* Unit Kerja List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daftar Unit Kerja</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-60 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedUnitKerjaIds.length === operatorAccountsStatus.filter(u => !u.hasOperator && u.hasValidData).length && selectedUnitKerjaIds.length > 0}
                              onCheckedChange={selectAllWithoutOperators}
                            />
                          </TableHead>
                          <TableHead>Nama Unit Kerja</TableHead>
                          <TableHead>NPSN</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Operator</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operatorAccountsStatus.map((unit) => (
                          <TableRow key={unit.unitKerjaId}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUnitKerjaIds.includes(unit.unitKerjaId)}
                                onCheckedChange={() => toggleUnitKerjaSelection(unit.unitKerjaId)}
                                disabled={unit.hasOperator || !unit.hasValidData}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{unit.unitKerjaNama}</TableCell>
                            <TableCell>{unit.unitKerjaNpsn || '-'}</TableCell>
                            <TableCell>
                              {!unit.hasValidData ? (
                                <Badge variant="destructive">Data Tidak Valid</Badge>
                              ) : unit.hasOperator ? (
                                <Badge variant="default">Sudah Ada Operator</Badge>
                              ) : (
                                <Badge variant="secondary">Belum Ada Operator</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {unit.operator ? (
                                <div className="text-sm">
                                  <div className="font-medium">{unit.operator.name}</div>
                                  <div className="text-gray-500">NIP: {unit.operator.nip}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowOperatorAccountsDialog(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleCreateOperatorAccounts}
                disabled={selectedUnitKerjaIds.length === 0 || isCreatingOperators}
              >
                {isCreatingOperators ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Membuat Akun...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Buat Akun Operator ({selectedUnitKerjaIds.length})
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Operator Result Dialog */}
        <Dialog open={showCreateResultDialog} onOpenChange={setShowCreateResultDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Hasil Pembuatan Akun Operator
              </DialogTitle>
              <DialogDescription>
                Berikut adalah hasil pembuatan akun operator sekolah
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto space-y-4">
              {createOperatorResult && (
                <>
                  {/* Success Results */}
                  {createOperatorResult.created.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-green-600 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Berhasil Dibuat ({createOperatorResult.created.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {createOperatorResult.created.map((result, index) => (
                            <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <div className="font-medium">{result.unitKerjaNama}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                <strong>Nama:</strong> {result.name}<br/>
                                <strong>NIP:</strong> {result.nip}<br/>
                                <strong>Password Default:</strong> <code className="bg-gray-100 px-1 rounded">{result.defaultPassword}</code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Skipped Results */}
                  {createOperatorResult.skipped.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-600 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Dilewati ({createOperatorResult.skipped.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {createOperatorResult.skipped.map((result, index) => (
                            <div key={index} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <div className="font-medium">{result.unitKerjaNama}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                <strong>Alasan:</strong> {result.reason}<br/>
                                <strong>NIP yang Ada:</strong> {result.existingNip}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Error Results */}
                  {createOperatorResult.errors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                          <XCircle className="h-5 w-5" />
                          Error ({createOperatorResult.errors.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {createOperatorResult.errors.map((result, index) => (
                            <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <div className="font-medium">{result.unitKerjaNama}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                <strong>Error:</strong> {result.error}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowCreateResultDialog(false)
                  setCreateOperatorResult(null)
                }}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
