"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Search, Filter, RefreshCw, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface UsulanItem {
  id: string
  periode: string
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  pegawai: {
    name: string
    nip: string
    golongan: string
    jabatan: string
    unitKerja: string
  }
  documentStats: {
    total: number
    approved: number
    pending: number
    needsRevision: number
    rejected: number
  }
}

export default function PegawaiInboxPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [usulanList, setUsulanList] = useState<UsulanItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodeFilter, setPeriodeFilter] = useState("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsulanData()
  }, [currentPage, itemsPerPage, statusFilter, periodeFilter, search])

  const fetchUsulanData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      if (periodeFilter !== "all") params.set("periode", periodeFilter)
      
      // Pagination parameters
      params.set("page", currentPage.toString())
      params.set("limit", itemsPerPage.toString())

      const response = await fetch(`/api/pegawai/proposals?${params}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform data if needed
      const transformedData = data.proposals.map((proposal: any) => {
        // Handle unitKerja if it's an object
        if (proposal.pegawai && proposal.pegawai.unitKerja && typeof proposal.pegawai.unitKerja === 'object') {
          proposal.pegawai.unitKerja = proposal.pegawai.unitKerja.nama || 
            proposal.pegawai.unitKerja.name || 
            "Unit Kerja Tidak Tersedia";
        }
        return proposal
      })
      
      setUsulanList(transformedData)
      setTotalItems(data.pagination?.totalCount || transformedData.length)
      setTotalPages(data.pagination?.totalPages || Math.ceil(transformedData.length / itemsPerPage))
    } catch (error) {
      console.error("Error fetching usulan data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data usulan. Silakan coba lagi nanti.",
        variant: "destructive"
      })
      
      // Set empty data on error
      setUsulanList([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
      case "DISETUJUI_ADMIN":
        return <Badge className="bg-green-100 text-green-800">Disetujui</Badge>
      case "PERLU_PERBAIKAN_DARI_DINAS":
      case "PERLU_PERBAIKAN_DARI_SEKOLAH":
        return <Badge variant="destructive">Perlu Perbaikan</Badge>
      case "DITOLAK":
      case "DITOLAK_ADMIN":
      case "DITOLAK_OPERATOR":
        return <Badge variant="destructive">Ditolak</Badge>
      case "DITARIK":
        return <Badge className="bg-gray-100 text-gray-800">Ditarik</Badge>
      case "DIPROSES_ADMIN":
        return <Badge className="bg-yellow-100 text-yellow-800">Diproses Admin</Badge>
      case "DISETUJUI_OPERATOR":
        return <Badge className="bg-blue-100 text-blue-800">Disetujui Operator</Badge>
      case "DIPROSES_OPERATOR":
        return <Badge className="bg-yellow-100 text-yellow-800">Diproses Operator</Badge>
      case "MENUNGGU_VERIFIKASI":
      case "DIAJUKAN":
        return <Badge className="bg-blue-100 text-blue-800">Menunggu Verifikasi</Badge>
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>
      default:
        return <Badge variant="secondary">{status.replace(/_/g, " ")}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <DashboardLayout userType="pegawai">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inbox Usulan</h1>
            <p className="text-muted-foreground">Pantau status usulan kenaikan pangkat Anda</p>
          </div>
          <Button onClick={() => router.push("/pegawai/input-usulan")} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            Buat Usulan Baru
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Cari usulan..." 
                  className="pl-10" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status Usulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                  <SelectItem value="DIPROSES_OPERATOR">Diproses Operator</SelectItem>
                  <SelectItem value="DISETUJUI_OPERATOR">Disetujui Operator</SelectItem>
                  <SelectItem value="DIPROSES_ADMIN">Diproses Admin</SelectItem>
                  <SelectItem value="DISETUJUI_ADMIN">Disetujui Admin</SelectItem>
                  <SelectItem value="DITOLAK">Ditolak</SelectItem>
                  <SelectItem value="SELESAI">Selesai</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
                <SelectTrigger>
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
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Daftar Usulan</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tampilkan:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[80px] h-8 text-xs">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchUsulanData} className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(null).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : usulanList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Inbox className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">Tidak ada usulan</h3>
                <p className="text-muted-foreground mt-1">
                  Anda belum memiliki usulan atau tidak ada usulan yang sesuai dengan filter.
                </p>
                <Button 
                  onClick={() => router.push("/pegawai/input-usulan")} 
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Buat Usulan Baru
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead>Terakhir Update</TableHead>
                        <TableHead>Dokumen</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usulanList.map((usulan) => (
                        <TableRow key={usulan.id} className="group hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-xs">{usulan.id.substring(0, 8)}...</TableCell>
                          <TableCell>{usulan.periode}</TableCell>
                          <TableCell>{getStatusBadge(usulan.status)}</TableCell>
                          <TableCell>{formatDate(usulan.createdAt)}</TableCell>
                          <TableCell>{formatDate(usulan.updatedAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-xs">
                                {usulan.documentStats?.approved || 0}/{usulan.documentStats?.total || 0}
                              </div>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${usulan.documentStats?.total ? Math.min((usulan.documentStats?.approved / usulan.documentStats?.total) * 100, 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            {(usulan.documentStats?.needsRevision > 0 || usulan.documentStats?.rejected > 0) && (
                              <div className="flex items-center mt-1 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {usulan.documentStats?.needsRevision || 0} perlu perbaikan
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/pegawai/usulan/${usulan.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                          className="h-8 w-8"
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
                      className="h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
