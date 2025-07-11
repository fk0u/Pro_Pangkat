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
    nama: string;
    nip?: string;
    jabatan?: string;
    golongan?: string;
    targetGolongan?: string;
    unitKerja?: string;
    wilayah?: {
      id: string;
      name: string;
    } | null;
    tmtGolongan?: Date;
  };
  status: string;
  statusText?: string;
  notes?: string;
  periode?: string;
  createdAt: string;
  updatedAt: string;
  submissionDate?: string;
  timeline?: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    description?: string;
  };
  dokumen?: {
    id: string;
    name: string;
    fileName?: string;
    fileUrl?: string;
    fileId?: string;
    fileType?: string;
    fileSize?: number;
    status?: string;
    notes?: string;
    uploadedAt?: string;
    documentType?: string;
  }[];
}

export default function KelolaPengajuanPage() {
  const { toast } = useToast()
  const [usulanList, setUsulanList] = useState<Usulan[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedUsulan, setSelectedUsulan] = useState<Usulan | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catatan, setCatatan] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [activeTab, setActiveTab] = useState("inbox") // inbox or documents
  const itemsPerPage = 10

  // Fetch usulan data
  const fetchUsulan = async (page = 1) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (statusFilter) {
        queryParams.append('status', statusFilter);
      }
      
      if (searchQuery && searchQuery.trim() !== "") {
        queryParams.append('search', searchQuery);
      }
      
      // If in inbox mode, add inbox parameter
      if (activeTab === "inbox") {
        queryParams.append('inbox', 'true');
      }
      
      console.log("Fetching data with params:", queryParams.toString());
      const response = await fetch(`/api/admin/usulan?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`Failed to fetch data: ${response.status} ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      
      // More robust response handling to support different API response formats
      if (!data || data.status === "error") {
        console.error("API returned error:", data);
        throw new Error(data?.message || "API mengembalikan status error");
      }
      
      // Handle different response formats more gracefully
      let usulanData = [];
      let pagination = { total: 0, totalPages: 1 };
      
      if (data.status === "success") {
        if (Array.isArray(data.data)) {
          usulanData = data.data;
        } else if (data.data && Array.isArray(data.data.data)) {
          usulanData = data.data.data;
        } else if (data.data && data.data.data === undefined) {
          usulanData = data.data;
        } else {
          usulanData = [];
        }
        
        pagination = data.pagination || pagination;
      } else if (Array.isArray(data)) {
        // Direct array response
        usulanData = data;
      } else {
        console.warn("Unexpected response format:", data);
        usulanData = [];
      }
      
      console.log("Processed usulan data:", { 
        count: usulanData.length, 
        pagination,
        sample: usulanData[0] 
      });
      
      setUsulanList(usulanData);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || usulanData.length);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching usulan:", error);
      
      // Provide more specific error messages
      let errorMessage = "Terjadi kesalahan tidak dikenal";
      
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Gagal menghubungi server. Periksa koneksi internet Anda.";
        } else if (error.message.includes("API mengembalikan status error")) {
          errorMessage = "Server mengembalikan error. Silakan coba beberapa saat lagi.";
        } else if (error.message.includes("Invalid data format")) {
          errorMessage = "Format data tidak valid. Silakan refresh halaman.";
        } else {
          errorMessage = `Gagal memuat data usulan: ${error.message}`;
        }
      }
      
      toast({
        title: "Gagal Memuat Data",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
  }, [statusFilter, searchQuery, activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pengelolaan Usulan Kenaikan Pangkat</h1>
        </div>
        
        <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox">Inbox Usulan</TabsTrigger>
            <TabsTrigger value="documents">Kelola Dokumen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox" className="space-y-4 mt-4">
            <div className="flex flex-col md:flex-row gap-4 flex-wrap">
              <Card className="flex-1 min-w-[200px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Perlu Diproses</p>
                      <p className="text-2xl font-bold">{
                        usulanList.filter(u => u.status === "DISETUJUI_OPERATOR").length
                      }</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="flex-1 min-w-[200px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sedang Diproses</p>
                      <p className="text-2xl font-bold">{
                        usulanList.filter(u => u.status === "DIPROSES_ADMIN").length
                      }</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="flex-1 min-w-[200px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Disetujui</p>
                      <p className="text-2xl font-bold">{
                        usulanList.filter(u => u.status === "SELESAI" || u.status === "DISETUJUI_ADMIN").length
                      }</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader className="bg-slate-50 dark:bg-slate-800">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pengelolaan Dokumen Usulan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">
                  Pada halaman ini Anda dapat memeriksa dan memverifikasi dokumen-dokumen yang diajukan.
                </p>
                
                {/* Document Management Section */}
                <div className="space-y-4">
                  {/* Search and Filter for Documents */}
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari dokumen berdasarkan nama pegawai atau jenis dokumen..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => fetchUsulan(currentPage)} variant="outline" size="sm" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="ml-2">Refresh</span>
                    </Button>
                  </div>
                  
                  {/* Document Table */}
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Memuat dokumen...</span>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Pegawai</TableHead>
                            <TableHead>NIP</TableHead>
                            <TableHead>Jenis Dokumen</TableHead>
                            <TableHead>Status Dokumen</TableHead>
                            <TableHead>Tanggal Upload</TableHead>
                            <TableHead>Ukuran File</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usulanList.length === 0 || !usulanList.some(u => u.dokumen && u.dokumen.length > 0) ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-10">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                  <FileText className="h-10 w-10 mb-2 opacity-25" />
                                  <p>Tidak ada dokumen yang ditemukan</p>
                                  <p className="text-sm">Belum ada dokumen yang diupload untuk usulan yang ada</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            usulanList.flatMap((usulan) => 
                              usulan.dokumen && usulan.dokumen.length > 0
                                ? usulan.dokumen.map((doc, index) => (
                                    <TableRow key={`${usulan.id}-${index}`}>
                                      <TableCell className="font-medium">{usulan.pegawai.nama || usulan.pegawai.name}</TableCell>
                                      <TableCell>{usulan.pegawai.nip || "-"}</TableCell>
                                      <TableCell>{doc.name || doc.documentType || "-"}</TableCell>
                                      <TableCell>
                                        <Badge className={doc.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                          {doc.status || "Pending"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {usulan.createdAt ? new Date(usulan.createdAt).toLocaleDateString("id-ID") : "-"}
                                      </TableCell>
                                      <TableCell>{doc.fileSize ? formatFileSize(doc.fileSize) : "-"}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => window.open(doc.fileId || doc.fileUrl, '_blank')}
                                          >
                                            <Eye className="h-4 w-4 mr-1" /> Lihat
                                          </Button>
                                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(usulan)}>
                                            <FileText className="h-4 w-4 mr-1" /> Detail
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                : []
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader className="bg-slate-50 dark:bg-slate-800">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {activeTab === "inbox" ? "Inbox Usulan Kenaikan Pangkat" : "Kelola Dokumen Usulan"}
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
                <Select value={statusFilter || "ALL"} onValueChange={(value) => setStatusFilter(value !== "ALL" ? value : null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
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
                        <TableHead>Wilayah</TableHead>
                        <TableHead>Golongan</TableHead>
                        <TableHead>Tanggal Pengajuan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usulanList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <FileText className="h-10 w-10 mb-2 opacity-25" />
                              <p>Tidak ada usulan yang ditemukan</p>
                              <p className="text-sm">Mungkin belum ada usulan atau coba ubah filter pencarian</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        usulanList.map((usulan) => (
                          <TableRow key={usulan.id}>
                            <TableCell className="font-medium">{usulan.pegawai.nama || usulan.pegawai.name}</TableCell>
                            <TableCell>{usulan.pegawai.nip || "-"}</TableCell>
                            <TableCell>{usulan.pegawai.unitKerja || "-"}</TableCell>
                            <TableCell>{usulan.pegawai.wilayah?.name || "-"}</TableCell>
                            <TableCell>
                              <div className="font-medium text-blue-600">
                                {usulan.pegawai.golongan} → {usulan.pegawai.targetGolongan}
                              </div>
                            </TableCell>
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
                        ))
                      )}
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
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            {selectedUsulan && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl">Detail Usulan Kenaikan Pangkat</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="mb-4 w-full grid grid-cols-2">
                    <TabsTrigger value="info" className="text-xs md:text-sm">Informasi Umum</TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs md:text-sm">Dokumen ({selectedUsulan.dokumen?.length || 0})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="font-medium text-muted-foreground text-sm md:text-base">Informasi Pegawai</h3>
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Nama</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.pegawai.nama || selectedUsulan.pegawai.name}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">NIP</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.pegawai.nip || "-"}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Jabatan</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.pegawai.jabatan || "-"}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Unit Kerja</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.pegawai.unitKerja || "-"}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Wilayah</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.pegawai.wilayah?.name || "-"}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Golongan Saat Ini</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.pegawai.golongan || "-"}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Golongan Tujuan</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.pegawai.targetGolongan || "-"}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="font-medium text-muted-foreground text-sm md:text-base">Informasi Usulan</h3>
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">ID Usulan</div>
                            <div className="sm:col-span-2 text-sm break-all">{selectedUsulan.id}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Tanggal Pengajuan</div>
                            <div className="sm:col-span-2 text-sm">
                              {new Date(selectedUsulan.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Terakhir Diperbarui</div>
                            <div className="sm:col-span-2 text-sm">
                              {new Date(selectedUsulan.updatedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Status</div>
                            <div className="sm:col-span-2">
                              <Badge className={getStatusBadgeClass(selectedUsulan.status)}>
                                {getStatusText(selectedUsulan.status)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Periode</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.periode || "-"}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Timeline</div>
                            <div className="sm:col-span-2 text-sm">
                              {selectedUsulan.timeline ? 
                                `${new Date(selectedUsulan.timeline.startDate).toLocaleDateString("id-ID")} - ${new Date(selectedUsulan.timeline.endDate).toLocaleDateString("id-ID")}` 
                                : "-"}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="font-medium text-sm">Deskripsi Timeline</div>
                            <div className="sm:col-span-2 text-sm break-words">{selectedUsulan.timeline?.description || "-"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Catatan */}
                    <div className="pt-4">
                      <h3 className="font-medium text-muted-foreground mb-2 text-sm md:text-base">Catatan</h3>
                      <div className="bg-muted/30 p-3 rounded-md whitespace-pre-line text-sm">
                        {selectedUsulan.notes || "Tidak ada catatan"}
                      </div>
                    </div>
                    
                    {/* Tindakan Admin */}
                    {(selectedUsulan.status === "DISETUJUI_OPERATOR" || selectedUsulan.status === "DIPROSES_ADMIN") && (
                      <div className="pt-4 space-y-4">
                        <h3 className="font-medium text-muted-foreground text-sm md:text-base">Tindakan Admin</h3>
                        <Textarea 
                          placeholder="Tambahkan catatan (wajib untuk penolakan)..." 
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            className="bg-green-600 hover:bg-green-700 flex-1 text-sm" 
                            onClick={handleApprove}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Setujui Usulan
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1 text-sm"
                            onClick={handleReject}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Tolak Usulan
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4">
                    {selectedUsulan.dokumen && selectedUsulan.dokumen.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUsulan.dokumen.map((doc, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm md:text-base break-words">
                                  {doc.name || doc.fileName || `Dokumen ${index + 1}`}
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
                                  {doc.fileType && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{doc.fileType}</span>}
                                  {doc.fileSize && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{formatFileSize(doc.fileSize)}</span>}
                                  {doc.uploadedAt && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                      Diunggah: {new Date(doc.uploadedAt).toLocaleDateString("id-ID")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs md:text-sm"
                                  onClick={() => window.open(doc.fileUrl || doc.fileId, '_blank')}
                                >
                                  <DownloadCloud className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Lihat
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border rounded-md bg-muted/20">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                        <p className="text-muted-foreground text-sm md:text-base">Tidak ada dokumen yang tersedia</p>
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
