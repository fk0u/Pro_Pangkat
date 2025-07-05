"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Eye, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  XCircle, 
  DownloadCloud,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface Usulan {
  id: string;
  pegawaiId: string;
  pegawai: {
    id: string;
    name: string;
    nip?: string;
    jabatan?: string;
    golongan?: string;
    currentRank?: string;
    targetRank?: string;
    unitKerja?: { 
      id: string;
      name: string;
      type: string;
      code: string;
      wilayah?: {
        id: string;
        name: string;
        type: string;
      }
    } | null;
  };
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  submissionDate?: string;
  documents?: {
    id: string;
    name: string;
    fileName?: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    status?: string;
    notes?: string;
    uploadedAt?: string;
  }[];
  timeline?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    description?: string;
  };
}

export default function KelolaPengajuanPage() {
  const { toast } = useToast()
  const [usulanList, setUsulanList] = useState<Usulan[]>([])
  const [filteredList, setFilteredList] = useState<Usulan[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedUsulan, setSelectedUsulan] = useState<Usulan | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catatan, setCatatan] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Fetch usulan data
  const fetchUsulan = async (page = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/usulan?page=${page}&limit=${itemsPerPage}${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }
      
      const data = await response.json()
      setUsulanList(data.data || [])
      setFilteredList(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalItems(data.pagination?.total || 0)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching usulan:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data usulan. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Initialize and refresh data
  useEffect(() => {
    fetchUsulan()
    // Set up refresh interval
    const intervalId = setInterval(() => {
      fetchUsulan(currentPage)
    }, 300000) // Refresh every 5 minutes
    
    return () => clearInterval(intervalId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters when they change
  useEffect(() => {
    fetchUsulan(1) // Reset to first page when filters change
  }, [statusFilter, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter(null)
  }

  // View detail handler
  const handleViewDetail = (usulan: Usulan) => {
    setSelectedUsulan(usulan)
    setCatatan("")
    setDetailOpen(true)
  }

  // Approve proposal
  const handleApprove = async () => {
    if (!selectedUsulan) return

    try {
      const response = await fetch(`/api/admin/usulan/${selectedUsulan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "DISETUJUI_ADMIN",
          catatan: catatan || "Usulan disetujui oleh admin"
        })
      })

      if (!response.ok) {
        throw new Error("Failed to approve usulan")
      }

      toast({
        title: "Berhasil",
        description: "Usulan berhasil disetujui"
      })

      // Update local state
      setUsulanList(prev => 
        prev.map(item => 
          item.id === selectedUsulan.id 
            ? { ...item, status: "DISETUJUI_ADMIN" } 
            : item
        )
      )
      setFilteredList(prev => 
        prev.map(item => 
          item.id === selectedUsulan.id 
            ? { ...item, status: "DISETUJUI_ADMIN" } 
            : item
        )
      )
      setDetailOpen(false)
      fetchUsulan(currentPage) // Refresh data
    } catch (error) {
      console.error("Error approving usulan:", error)
      toast({
        title: "Error",
        description: "Gagal menyetujui usulan. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }

  // Reject proposal
  const handleReject = async () => {
    if (!selectedUsulan) return

    if (!catatan) {
      toast({
        title: "Perhatian",
        description: "Catatan penolakan harus diisi",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/usulan/${selectedUsulan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "DITOLAK",
          catatan
        })
      })

      if (!response.ok) {
        throw new Error("Failed to reject usulan")
      }

      toast({
        title: "Berhasil",
        description: "Usulan berhasil ditolak"
      })

      // Update local state
      setUsulanList(prev => 
        prev.map(item => 
          item.id === selectedUsulan.id 
            ? { ...item, status: "DITOLAK" } 
            : item
        )
      )
      setFilteredList(prev => 
        prev.map(item => 
          item.id === selectedUsulan.id 
            ? { ...item, status: "DITOLAK" } 
            : item
        )
      )
      setDetailOpen(false)
      fetchUsulan(currentPage) // Refresh data
    } catch (error) {
      console.error("Error rejecting usulan:", error)
      toast({
        title: "Error",
        description: "Gagal menolak usulan. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }

  // Helper function to map status to readable text
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      "DRAFT": "Draft",
      "DIAJUKAN": "Diajukan",
      "DIPROSES_OPERATOR": "Diproses Operator",
      "DITOLAK_OPERATOR": "Ditolak Operator",
      "DISETUJUI_OPERATOR": "Disetujui Operator",
      "DIPROSES_ADMIN": "Diproses Admin",
      "DITOLAK": "Ditolak",
      "DISETUJUI_ADMIN": "Disetujui Admin",
      "SELESAI": "Selesai"
    }
    return statusMap[status] || status
  }

  // Helper function to get the appropriate badge color based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "DIAJUKAN":
      case "DIPROSES_OPERATOR":
      case "DIPROSES_ADMIN":
        return "bg-yellow-100 text-yellow-800";
      case "DISETUJUI_OPERATOR":
      case "DISETUJUI_ADMIN":
      case "SELESAI":
        return "bg-green-100 text-green-700";
      case "DITOLAK":
      case "DITOLAK_OPERATOR":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Format file size
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return 'n/a';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-slate-50 dark:bg-slate-800">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Kelola Usulan Kenaikan Pangkat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search and Filter Tools */}
            <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
              <div className="flex gap-2 items-center w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, NIP..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Status</SelectItem>
                    <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                    <SelectItem value="DIPROSES_OPERATOR">Diproses Operator</SelectItem>
                    <SelectItem value="DISETUJUI_OPERATOR">Disetujui Operator</SelectItem>
                    <SelectItem value="DITOLAK_OPERATOR">Ditolak Operator</SelectItem>
                    <SelectItem value="DIPROSES_ADMIN">Diproses Admin</SelectItem>
                    <SelectItem value="DISETUJUI_ADMIN">Disetujui Admin</SelectItem>
                    <SelectItem value="DITOLAK">Ditolak</SelectItem>
                    <SelectItem value="SELESAI">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto justify-end">
                {(searchQuery || statusFilter) && (
                  <Button variant="outline" onClick={resetFilters} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filter
                  </Button>
                )}
                <Button onClick={() => fetchUsulan(currentPage)} variant="outline" size="sm" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
            </div>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <p className="text-blue-600 dark:text-blue-400 font-medium">Total Usulan</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4">
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium">Menunggu Tindakan</p>
                  <p className="text-2xl font-bold">
                    {usulanList.filter(u => u.status === "DISETUJUI_OPERATOR" || u.status === "DIPROSES_ADMIN").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <p className="text-green-600 dark:text-green-400 font-medium">Disetujui</p>
                  <p className="text-2xl font-bold">
                    {usulanList.filter(u => u.status === "DISETUJUI_ADMIN" || u.status === "SELESAI").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <p className="text-red-600 dark:text-red-400 font-medium">Ditolak</p>
                  <p className="text-2xl font-bold">
                    {usulanList.filter(u => u.status === "DITOLAK").length}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Table View */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat data...</span>
              </div>
            ) : usulanList.length === 0 ? (
              <div className="text-center py-12 border rounded-md bg-muted/20">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                <p className="text-muted-foreground">Tidak ada usulan yang ditemukan</p>
                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                  Reset Filter
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Pegawai</TableHead>
                        <TableHead>NIP</TableHead>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead>Tanggal Pengajuan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usulanList.map((usulan) => (
                        <TableRow key={usulan.id}>
                          <TableCell className="font-medium">{usulan.pegawai.name}</TableCell>
                          <TableCell>{usulan.pegawai.nip || "-"}</TableCell>
                          <TableCell>{usulan.pegawai.unitKerja?.name || "-"}</TableCell>
                          <TableCell>
                            {new Date(usulan.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(usulan.status)}>
                              {getStatusText(usulan.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(usulan)}>
                              <Eye className="h-4 w-4 mr-1" /> Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} usulan
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchUsulan(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        {currentPage} / {totalPages}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchUsulan(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl">
            {selectedUsulan && (
              <>
                <DialogHeader>
                  <DialogTitle>Detail Usulan Kenaikan Pangkat</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="info">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informasi Umum</TabsTrigger>
                    <TabsTrigger value="documents">Dokumen ({selectedUsulan.documents?.length || 0})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-medium text-muted-foreground">Informasi Pegawai</h3>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="font-medium">Nama</div>
                          <div className="col-span-2">{selectedUsulan.pegawai.name}</div>
                          
                          <div className="font-medium">NIP</div>
                          <div className="col-span-2">{selectedUsulan.pegawai.nip || "-"}</div>
                          
                          <div className="font-medium">Jabatan</div>
                          <div className="col-span-2">{selectedUsulan.pegawai.jabatan || "-"}</div>
                          
                          <div className="font-medium">Unit Kerja</div>
                          <div className="col-span-2">{selectedUsulan.pegawai.unitKerja?.name || "-"}</div>
                          
                          <div className="font-medium">Wilayah</div>
                          <div className="col-span-2">{selectedUsulan.pegawai.unitKerja?.wilayah?.name || "-"}</div>
                          
                          <div className="font-medium">Golongan Saat Ini</div>
                          <div className="col-span-2">{selectedUsulan.pegawai.currentRank || selectedUsulan.pegawai.golongan || "-"}</div>
                          
                          <div className="font-medium">Golongan Tujuan</div>
                          <div className="col-span-2">{selectedUsulan.pegawai.targetRank || "-"}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium text-muted-foreground">Informasi Usulan</h3>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="font-medium">ID Usulan</div>
                          <div className="col-span-2">{selectedUsulan.id}</div>
                          
                          <div className="font-medium">Tanggal Pengajuan</div>
                          <div className="col-span-2">
                            {new Date(selectedUsulan.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </div>
                          
                          <div className="font-medium">Terakhir Diperbarui</div>
                          <div className="col-span-2">
                            {new Date(selectedUsulan.updatedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                          
                          <div className="font-medium">Status</div>
                          <div className="col-span-2">
                            <Badge className={getStatusBadgeClass(selectedUsulan.status)}>
                              {getStatusText(selectedUsulan.status)}
                            </Badge>
                          </div>
                          
                          <div className="font-medium">Periode</div>
                          <div className="col-span-2">{selectedUsulan.timeline?.title || "-"}</div>
                          
                          <div className="font-medium">Timeline</div>
                          <div className="col-span-2">
                            {selectedUsulan.timeline ? 
                              `${new Date(selectedUsulan.timeline.startDate).toLocaleDateString("id-ID")} - ${new Date(selectedUsulan.timeline.endDate).toLocaleDateString("id-ID")}` 
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Catatan */}
                    <div className="pt-4">
                      <h3 className="font-medium text-muted-foreground mb-2">Catatan</h3>
                      <div className="bg-muted/30 p-3 rounded-md whitespace-pre-line">
                        {selectedUsulan.notes || "Tidak ada catatan"}
                      </div>
                    </div>
                    
                    {/* Tindakan Admin */}
                    {(selectedUsulan.status === "DISETUJUI_OPERATOR" || selectedUsulan.status === "DIPROSES_ADMIN") && (
                      <div className="pt-4 space-y-4">
                        <h3 className="font-medium text-muted-foreground">Tindakan Admin</h3>
                        <Textarea 
                          placeholder="Tambahkan catatan (wajib untuk penolakan)..." 
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button 
                            className="bg-green-600 hover:bg-green-700 flex-1" 
                            onClick={handleApprove}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Setujui Usulan
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            onClick={handleReject}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Tolak Usulan
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4">
                    {selectedUsulan.documents && selectedUsulan.documents.length > 0 ? (
                      <div className="border rounded-md divide-y">
                        {selectedUsulan.documents.map((doc, index) => (
                          <div key={index} className="p-4 flex items-center justify-between">
                            <div>
                              <div className="font-medium">{doc.name || doc.fileName || `Dokumen ${index + 1}`}</div>
                              <div className="text-sm text-muted-foreground flex gap-2">
                                {doc.fileType && <span>{doc.fileType}</span>}
                                {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                                {doc.uploadedAt && (
                                  <span>
                                    Diunggah: {new Date(doc.uploadedAt).toLocaleDateString("id-ID")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <a 
                              href={doc.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                            >
                              <Button variant="outline" size="sm">
                                <DownloadCloud className="w-4 h-4 mr-2" /> Lihat
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border rounded-md bg-muted/20">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                        <p className="text-muted-foreground">Tidak ada dokumen yang tersedia</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
