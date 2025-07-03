"use client"

import { useState, useEffect } from "react"
import { 
  Eye, Search, Info, Mail, CheckCircle, X, FileText, Download, 
  MessageCircle, AlertTriangle, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Filter, Inbox, Clock, FileCheck,
  FileX, User, PlusCircle, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { formatWilayahForDisplay } from "@/lib/wilayah-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface DocumentItem {
  id: string
  filename: string
  originalName: string
  status: string
  catatan: string | null
  uploadedAt: string
  verifiedAt: string | null
  requirement: {
    id: string
    name: string
    description: string | null
    isRequired: boolean
    category: string | null
    format: string | null
    maxSize: number | null
  }
}

interface Proposal {
  id: string
  periode: string
  status: string
  currentGolongan?: string
  targetGolongan?: string
  notes?: string | null
  createdAt: string
  updatedAt: string
  pegawai: {
    id: string
    name: string
    nip: string
    unitKerja: string
    jabatan: string
    golongan: string
    wilayah: string
  }
  documents: DocumentItem[]
  documentProgress: {
    total: number
    completed: number
    pending: number
    rejected: number
    percentage: number
  }
}

interface InboxData {
  proposals: Proposal[]
  stats: {
    total: number
    menunggu: number
    diproses: number
    disetujui: number
    dikembalikan: number
  }
  filterOptions: {
    unitKerja: string[]
    status: { value: string; label: string }[]
  }
  pagination?: {
    totalCount: number
    totalPages: number
    currentPage: number
    perPage: number
  }
}

export default function InboxClientEnhanced() {
  const [data, setData] = useState<InboxData | null>(null)
  const [search, setSearch] = useState("")
  const [unitKerjaFilter, setUnitKerjaFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodeFilter, setPeriodeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | "process" | null>(null)
  const [actionNote, setActionNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("semua")

  useEffect(() => {
    fetchInboxData()
  }, [currentPage, itemsPerPage])

  const fetchInboxData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      if (unitKerjaFilter !== "all") params.set("unitKerja", unitKerjaFilter)
      if (periodeFilter !== "all") params.set("periode", periodeFilter)
      
      // Pagination parameters
      params.set("page", currentPage.toString())
      params.set("limit", itemsPerPage.toString())

      const response = await fetch(`/api/operator/inbox?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        // Instead of throwing an error, handle 404 (Not Found) specially
        if (response.status === 404) {
          // Set empty data structure with default values
          setData({
            proposals: [],
            stats: {
              total: 0,
              menunggu: 0,
              diproses: 0,
              disetujui: 0,
              dikembalikan: 0
            },
            filterOptions: {
              unitKerja: [],
              status: []
            },
            pagination: {
              totalCount: 0,
              totalPages: 1,
              currentPage: 1,
              perPage: itemsPerPage
            }
          })
          setTotalItems(0)
          setTotalPages(1)
          return
        }
        
        throw new Error(`Gagal memuat data: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Ensure data has the correct structure, especially proposals array
        const safeData = {
          ...result.data,
          proposals: Array.isArray(result.data.proposals) ? result.data.proposals : []
        }
        
        setData(safeData)
        
        // Set pagination data
        if (safeData.pagination) {
          setTotalItems(safeData.pagination.totalCount || 0)
          setTotalPages(safeData.pagination.totalPages || Math.ceil((safeData.pagination.totalCount || 0) / itemsPerPage))
        } else {
          setTotalItems(safeData.proposals.length)
          setTotalPages(Math.ceil(safeData.proposals.length / itemsPerPage))
        }
      } else {
        // For non-success responses, set empty data instead of throwing error
        setData({
          proposals: [],
          stats: {
            total: 0,
            menunggu: 0,
            diproses: 0,
            disetujui: 0,
            dikembalikan: 0
          },
          filterOptions: {
            unitKerja: [],
            status: []
          }
        })
        setTotalItems(0)
        setTotalPages(1)
        
        console.warn("API returned non-success response:", result.message)
      }
    } catch (error) {
      console.error("Error fetching inbox data:", error)
      
      // Set default empty data structure instead of showing error toast
      setData({
        proposals: [],
        stats: {
          total: 0,
          menunggu: 0,
          diproses: 0,
          disetujui: 0,
          dikembalikan: 0
        },
        filterOptions: {
          unitKerja: [],
          status: []
        }
      })
      setTotalItems(0)
      setTotalPages(1)
      
      // Log error but don't show disruptive toast message
      console.warn("Using fallback empty data due to error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when filters change
      fetchInboxData()
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [search, unitKerjaFilter, statusFilter, periodeFilter, activeTab])

  const handleShowDetail = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setShowDetailModal(true)
  }

  const handleAction = (proposal: Proposal, type: "approve" | "reject" | "process") => {
    setSelectedProposal(proposal)
    setActionType(type)
    setActionNote("")
    setShowActionModal(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const submitAction = async () => {
    if (!selectedProposal || !actionType) return

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/operator/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: selectedProposal.id,
          action: actionType,
          catatan: actionNote,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setShowActionModal(false)
        setSelectedProposal(null)
        setActionType(null)
        setActionNote("")
        
        toast({
          title: "Berhasil",
          description: actionType === "approve" 
            ? "Usulan berhasil disetujui" 
            : actionType === "reject"
            ? "Usulan berhasil dikembalikan"
            : "Usulan sedang diproses",
          variant: "default"
        })
        
        await fetchInboxData() // Refresh data
      } else {
        throw new Error(result.message || "Gagal mengubah status usulan")
      }
    } catch (error) {
      console.error("Error submitting action:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      DIAJUKAN: { label: "Perlu Verifikasi", variant: "outline" },
      DIPROSES_OPERATOR: { label: "Sedang Diproses", variant: "secondary" },
      DISETUJUI_OPERATOR: { label: "Disetujui", variant: "default" },
      DIKEMBALIKAN_OPERATOR: { label: "Dikembalikan", variant: "destructive" },
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getDocumentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      MENUNGGU_VERIFIKASI: { label: "Menunggu", variant: "outline" },
      DISETUJUI: { label: "Disetujui", variant: "default" },
      DITOLAK: { label: "Ditolak", variant: "destructive" },
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Baru saja"
    if (diffInHours < 24) return `${diffInHours} jam lalu`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} hari lalu`
  }

  // Format date to Indonesian format (DD/MM/YYYY)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
  }

  // Filter proposals based on active tab
  const getFilteredProposals = () => {
    if (!data?.proposals) return []
    
    switch (activeTab) {
      case "verifikasi":
        return data.proposals.filter(p => p.status === "DIAJUKAN")
      case "diproses":
        return data.proposals.filter(p => p.status === "DIPROSES_OPERATOR")
      case "disetujui":
        return data.proposals.filter(p => p.status === "DISETUJUI_OPERATOR")
      case "dikembalikan":
        return data.proposals.filter(p => p.status === "DIKEMBALIKAN_OPERATOR")
      default:
        return data.proposals
    }
  }

  if (isLoading && !data) {
    return (
      <DashboardLayout userType="operator">
        <div className="space-y-6">
          {/* Skeleton Header */}
          <div className="rounded-2xl p-6 bg-gradient-to-r from-green-500 to-emerald-500">
            <div className="flex items-center mb-6">
              <Skeleton className="h-8 w-8 rounded-full mr-3" />
              <div>
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>

          {/* Skeleton Filter */}
          <Skeleton className="h-36 w-full rounded-xl" />

          {/* Skeleton Table */}
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-2xl shadow-lg border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Mail className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-3xl font-bold text-white">Inbox Usulan</CardTitle>
                    <p className="text-green-100 mt-1">Kelola dan verifikasi usulan kenaikan pangkat pegawai</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-white/20 rounded-lg p-4 text-center flex flex-col items-center">
                    <Inbox className="h-6 w-6 mb-1 text-white/80" />
                    <div className="text-2xl font-bold">{data.stats.total}</div>
                    <div className="text-sm text-green-100">Total Usulan</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center flex flex-col items-center">
                    <Clock className="h-6 w-6 mb-1 text-white/80" />
                    <div className="text-2xl font-bold">{data.stats.menunggu}</div>
                    <div className="text-sm text-green-100">Perlu Verifikasi</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center flex flex-col items-center">
                    <FileCheck className="h-6 w-6 mb-1 text-white/80" />
                    <div className="text-2xl font-bold">{data.stats.disetujui}</div>
                    <div className="text-sm text-green-100">Disetujui</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center flex flex-col items-center">
                    <FileX className="h-6 w-6 mb-1 text-white/80" />
                    <div className="text-2xl font-bold">{data.stats.dikembalikan}</div>
                    <div className="text-sm text-green-100">Dikembalikan</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 md:w-auto">
              <TabsTrigger value="semua" className="text-xs md:text-sm">Semua</TabsTrigger>
              <TabsTrigger value="verifikasi" className="text-xs md:text-sm">
                Perlu Verifikasi
                {data && data.stats.menunggu > 0 && (
                  <Badge className="ml-2 bg-green-500 hover:bg-green-600">{data.stats.menunggu}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="diproses" className="text-xs md:text-sm">Diproses</TabsTrigger>
              <TabsTrigger value="disetujui" className="text-xs md:text-sm">Disetujui</TabsTrigger>
              <TabsTrigger value="dikembalikan" className="text-xs md:text-sm">Dikembalikan</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter Section */}
          <Card className="shadow-md rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                <CardTitle>Filter & Pencarian</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Input
                  placeholder="Cari nama/NIP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>

              <Select onValueChange={setUnitKerjaFilter} defaultValue="all">
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit Kerja</SelectItem>
                  {data?.filterOptions.unitKerja.map((unitKerja) => (
                    <SelectItem key={unitKerja} value={unitKerja}>
                      {unitKerja}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setStatusFilter} defaultValue="all">
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Status Usulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {data?.filterOptions.status.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setPeriodeFilter} defaultValue="all">
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  <SelectItem value="2025-1">Periode I 2025</SelectItem>
                  <SelectItem value="2025-2">Periode II 2025</SelectItem>
                  <SelectItem value="2024-1">Periode I 2024</SelectItem>
                  <SelectItem value="2024-2">Periode II 2024</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Proposals Table */}
          <Card className="shadow-md rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-900 dark:text-gray-100">Daftar Usulan</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tampilkan:</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[80px] h-8 text-xs">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
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
                    <TableHead className="text-gray-700 dark:text-gray-300">Pegawai</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Unit Kerja</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Jabatan/Golongan</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Periode</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Progress Dokumen</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Tanggal</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Skeleton loading
                    Array(itemsPerPage).fill(0).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell colSpan={9}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : getFilteredProposals().length > 0 ? (
                    getFilteredProposals().map((proposal, index) => (
                      <TableRow key={proposal.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{proposal.pegawai.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{proposal.pegawai.nip}</div>
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {proposal.pegawai.unitKerja}
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-700 dark:text-gray-300">{proposal.pegawai.jabatan}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{proposal.pegawai.golongan}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {proposal.periode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-medium">
                              {proposal.documentProgress.completed}/{proposal.documentProgress.total}
                            </div>
                            <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(proposal.documentProgress.percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          {proposal.documentProgress.pending > 0 && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              {proposal.documentProgress.pending} menunggu verifikasi
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(proposal.status)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {formatRelativeTime(proposal.updatedAt)}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatDate(proposal.updatedAt)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-100 dark:hover:bg-gray-600"
                              onClick={() => handleShowDetail(proposal)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {proposal.status === "DIAJUKAN" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-green-100 dark:hover:bg-green-800 text-green-600 dark:text-green-400"
                                  onClick={() => handleAction(proposal, "approve")}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
                                  onClick={() => handleAction(proposal, "reject")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-600 dark:text-gray-400 py-10">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium mb-1">Tidak ada usulan saat ini</p>
                        <p className="text-sm max-w-md mx-auto">
                          Belum ada usulan kenaikan pangkat yang diajukan atau yang sesuai dengan filter yang dipilih.
                        </p>
                      </TableCell>
                    </TableRow>
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
        </div>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Detail Usulan Pegawai</DialogTitle>
            </DialogHeader>
            
            {selectedProposal && (
              <div className="space-y-6">
                {/* Pegawai Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="col-span-1 md:col-span-3 flex items-center gap-4 mb-2">
                    <User className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full p-2" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedProposal.pegawai.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">NIP: {selectedProposal.pegawai.nip}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Unit Kerja</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProposal.pegawai.unitKerja}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Jabatan</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProposal.pegawai.jabatan}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Golongan</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProposal.pegawai.golongan}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Wilayah</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatWilayahForDisplay(selectedProposal.pegawai.wilayah)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Periode Usulan</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProposal.periode}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <div>{getStatusBadge(selectedProposal.status)}</div>
                  </div>
                </div>

                {/* Document Progress */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Kenaikan Pangkat
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-400">Golongan Saat Ini</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedProposal.currentGolongan || selectedProposal.pegawai.golongan}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-400">Target Golongan</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedProposal.targetGolongan || '-'}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Progress Dokumen
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{selectedProposal.documentProgress.total}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-green-200 dark:border-green-800">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedProposal.documentProgress.completed}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Disetujui</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{selectedProposal.documentProgress.pending}</div>
                      <div className="text-sm text-orange-600 dark:text-orange-400">Menunggu</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-red-200 dark:border-red-800">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{selectedProposal.documentProgress.rejected}</div>
                      <div className="text-sm text-red-600 dark:text-red-400">Ditolak</div>
                    </div>
                  </div>
                </div>

                {/* Documents List */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Daftar Dokumen ({selectedProposal.documents.length})
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedProposal.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {doc.requirement.name}
                              </span>
                              {getDocumentStatusBadge(doc.status)}
                              {doc.requirement.isRequired && (
                                <Badge variant="outline" className="text-xs">Wajib</Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <p className="mb-1">
                                <span className="font-medium">File:</span> {doc.originalName}
                              </p>
                              {doc.requirement.description && (
                                <p className="mb-1">
                                  <span className="font-medium">Deskripsi:</span> {doc.requirement.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                <span>
                                  <Calendar className="h-3 w-3 inline mr-1" /> 
                                  Upload: {formatDate(doc.uploadedAt)}
                                </span>
                                {doc.verifiedAt && (
                                  <span>
                                    <CheckCircle className="h-3 w-3 inline mr-1" /> 
                                    Verifikasi: {formatDate(doc.verifiedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {doc.catatan && (
                              <div className="text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">
                                <span className="font-medium text-orange-700 dark:text-orange-400">Catatan:</span> {doc.catatan}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Lihat
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setShowDetailModal(false)} variant="outline">
                Tutup
              </Button>
              {selectedProposal && selectedProposal.status === "DIAJUKAN" && (
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setShowDetailModal(false)
                      handleAction(selectedProposal, "approve")
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setShowDetailModal(false)
                      handleAction(selectedProposal, "reject")
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Tolak
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {actionType === "approve" ? "Setujui Usulan" : 
                 actionType === "reject" ? "Tolak Usulan" : "Proses Usulan"}
              </DialogTitle>
            </DialogHeader>
            
            {selectedProposal && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Pegawai:</span> {selectedProposal.pegawai.name}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">NIP:</span> {selectedProposal.pegawai.nip}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Unit Kerja:</span> {selectedProposal.pegawai.unitKerja}
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Periode:</span> {selectedProposal.periode}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Catatan {actionType === "reject" ? "(Wajib)" : "(Opsional)"}
                  </label>
                  <Textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder={
                      actionType === "approve" ? "Tambahkan catatan persetujuan..." :
                      actionType === "reject" ? "Jelaskan alasan penolakan..." :
                      "Tambahkan catatan pemrosesan..."
                    }
                    rows={4}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {actionType === "reject" && !actionNote.trim() && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Catatan wajib diisi untuk penolakan</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowActionModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={submitAction}
                disabled={isSubmitting || (actionType === "reject" && !actionNote.trim())}
                className={
                  actionType === "approve" ? "bg-green-600 hover:bg-green-700" :
                  actionType === "reject" ? "bg-red-600 hover:bg-red-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {actionType === "approve" ? <CheckCircle className="h-4 w-4 mr-2" /> :
                     actionType === "reject" ? <X className="h-4 w-4 mr-2" /> :
                     <MessageCircle className="h-4 w-4 mr-2" />}
                    <span>
                      {actionType === "approve" ? "Setujui" :
                       actionType === "reject" ? "Tolak" : "Proses"}
                    </span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
