"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { 
  ClipboardList, 
  Info, 
  Loader2, 
  RefreshCw, 
  Search, 
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Clock,
  Download,
  FileDown
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import { addDays, format, subDays } from "date-fns"
import { id } from "date-fns/locale"

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function ActivityLogPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const itemsPerPage = 20

  useEffect(() => {
    fetchLogs()
    
    // Set up interval for auto-refresh (every 60 seconds)
    let intervalId: NodeJS.Timeout | null = null
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchLogs(false) // Pass false to avoid showing loading indicator
        setLastRefresh(new Date())
      }, 60000) // 60 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters when they change
  useEffect(() => {
    fetchLogs(true, 1) // Reset to first page when filters change
  }, [actionFilter, userFilter, dateFilter, searchQuery, dateRange, roleFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLogs = async (showLoadingIndicator = true, page = currentPage) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true)
      }
      
      // Build query string with all filters
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', itemsPerPage.toString())
      
      if (searchQuery) queryParams.append('search', searchQuery)
      if (actionFilter) queryParams.append('action', actionFilter)
      if (userFilter) queryParams.append('userId', userFilter)
      if (dateFilter) queryParams.append('date', dateFilter)
      if (roleFilter) queryParams.append('role', roleFilter)
      
      // Handle custom date range
      if (dateRange?.from) {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd')
        queryParams.append('startDate', fromDate)
        
        if (dateRange.to) {
          const toDate = format(dateRange.to, 'yyyy-MM-dd')
          queryParams.append('endDate', toDate)
        } else {
          queryParams.append('endDate', fromDate)
        }
      }
      
      const response = await fetch(`/api/admin/activity-logs?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch activity logs")
      }
      
      const data = await response.json()
      setLogs(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalItems(data.pagination?.total || 0)
      setCurrentPage(page)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error fetching activity logs:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data log aktivitas. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      if (showLoadingIndicator) {
        setLoading(false)
      }
    }
  }

  const exportLogs = async (format: 'excel' | 'csv') => {
    try {
      setExportLoading(true)
      
      // Build query string with all filters but without pagination
      const queryParams = new URLSearchParams()
      queryParams.append('export', format)
      queryParams.append('limit', '1000') // Get more data for export
      
      if (searchQuery) queryParams.append('search', searchQuery)
      if (actionFilter) queryParams.append('action', actionFilter)
      if (userFilter) queryParams.append('userId', userFilter)
      if (dateFilter) queryParams.append('date', dateFilter)
      if (roleFilter) queryParams.append('role', roleFilter)
      
      // Handle custom date range
      if (dateRange?.from) {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd')
        queryParams.append('startDate', fromDate)
        
        if (dateRange.to) {
          const toDate = format(dateRange.to, 'yyyy-MM-dd')
          queryParams.append('endDate', toDate)
        } else {
          queryParams.append('endDate', fromDate)
        }
      }
      
      // Use fetch with blob response type
      const response = await fetch(`/api/admin/activity-logs/export?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to export activity logs")
      }
      
      // Get the blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'activity-logs'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      } else {
        // Fallback filename with date
        const date = new Date().toISOString().split('T')[0]
        filename = `activity-logs-${date}.${format === 'excel' ? 'xlsx' : 'csv'}`
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Export Berhasil",
        description: `Log aktivitas berhasil diexport ke ${format === 'excel' ? 'Excel' : 'CSV'}.`,
        variant: "default"
      })
    } catch (error) {
      console.error("Error exporting activity logs:", error)
      toast({
        title: "Error",
        description: "Gagal mengexport data log aktivitas. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setExportLoading(false)
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setActionFilter(null)
    setUserFilter(null)
    setDateFilter(null)
    setDateRange(undefined)
    setRoleFilter(null)
  }

  // Date range quick selection handlers
  const setToday = () => {
    const today = new Date()
    setDateRange({ from: today, to: today })
    setDateFilter(null)
  }

  const setYesterday = () => {
    const yesterday = subDays(new Date(), 1)
    setDateRange({ from: yesterday, to: yesterday })
    setDateFilter(null)
  }

  const setLast7Days = () => {
    const today = new Date()
    const last7Days = subDays(today, 6)
    setDateRange({ from: last7Days, to: today })
    setDateFilter(null)
  }

  const setLast30Days = () => {
    const today = new Date()
    const last30Days = subDays(today, 29)
    setDateRange({ from: last30Days, to: today })
    setDateFilter(null)
  }

  // Helper function to format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Helper function to get action name and badge color
  const getActionInfo = (action: string) => {
    const actionMap: Record<string, { label: string, color: string }> = {
      "LOGIN": { label: "Login", color: "bg-blue-100 text-blue-700" },
      "LOGOUT": { label: "Logout", color: "bg-gray-100 text-gray-700" },
      "CREATE_PROPOSAL": { label: "Buat Usulan", color: "bg-green-100 text-green-700" },
      "UPDATE_PROPOSAL": { label: "Perbarui Usulan", color: "bg-yellow-100 text-yellow-700" },
      "DELETE_PROPOSAL": { label: "Hapus Usulan", color: "bg-red-100 text-red-700" },
      "APPROVE_PROPOSAL": { label: "Setujui Usulan", color: "bg-green-100 text-green-700" },
      "REJECT_PROPOSAL": { label: "Tolak Usulan", color: "bg-red-100 text-red-700" },
      "UPLOAD_DOCUMENT": { label: "Unggah Dokumen", color: "bg-purple-100 text-purple-700" },
      "VIEW_DOCUMENT": { label: "Lihat Dokumen", color: "bg-blue-100 text-blue-700" },
      "DELETE_DOCUMENT": { label: "Hapus Dokumen", color: "bg-orange-100 text-orange-700" },
      "CREATE_TIMELINE": { label: "Buat Timeline", color: "bg-indigo-100 text-indigo-700" },
      "UPDATE_TIMELINE": { label: "Perbarui Timeline", color: "bg-teal-100 text-teal-700" },
      "DELETE_TIMELINE": { label: "Hapus Timeline", color: "bg-rose-100 text-rose-700" },
      "CHANGE_PASSWORD": { label: "Ubah Password", color: "bg-amber-100 text-amber-700" },
    }
    
    return actionMap[action] || { label: action, color: "bg-gray-100 text-gray-700" }
  }

  // Helper function to get user role name
  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      "ADMIN": "Admin",
      "OPERATOR": "Operator",
      "PEGAWAI": "Pegawai",
      "OPERATOR_SEKOLAH": "Operator Sekolah",
      "UNIT_KERJA": "Unit Kerja"
    }
    
    return roleMap[role] || role
  }

  // Helper function to render details content based on action type
  const renderActionDetails = (log: ActivityLog) => {
    const { action, details } = log
    
    switch (action) {
      case "LOGIN":
      case "LOGOUT":
        return (
          <span>
            {details?.browser || ""} 
            {details?.device ? ` - ${details.device}` : ""}
            {details?.ip ? ` dari IP ${details.ip}` : ""}
          </span>
        )
        
      case "APPROVE_PROPOSAL":
      case "REJECT_PROPOSAL":
        return (
          <span>
            Usulan {details?.pegawaiName || ""} 
            {details?.fromStatus && details?.toStatus ? 
              ` (${details.fromStatus} → ${details.toStatus})` : ""}
            {details?.notes ? `: "${details.notes}"` : ""}
          </span>
        )
        
      case "UPLOAD_DOCUMENT":
      case "DELETE_DOCUMENT":
      case "VIEW_DOCUMENT":
        return (
          <span>
            {details?.documentName || "Dokumen"} 
            {details?.fileName ? ` (${details.fileName})` : ""}
            {details?.pegawaiName ? ` milik ${details.pegawaiName}` : ""}
          </span>
        )
        
      case "CREATE_PROPOSAL":
      case "UPDATE_PROPOSAL":
      case "DELETE_PROPOSAL":
        return (
          <span>
            {details?.title || "Usulan"} 
            {details?.proposalId ? ` (ID: ${details.proposalId})` : ""}
            {details?.pegawaiName ? ` oleh ${details.pegawaiName}` : ""}
          </span>
        )
        
      case "CREATE_TIMELINE":
      case "UPDATE_TIMELINE":
      case "DELETE_TIMELINE":
        return (
          <span>
            {details?.title || "Timeline"} 
            {details?.period ? ` - ${details.period}` : ""}
            {details?.jabatanType ? ` (${details.jabatanType})` : ""}
          </span>
        )
        
      default:
        // For unknown action types, just stringify the details
        if (typeof details === 'object' && details !== null) {
          try {
            // Try to display a nice summary
            const detailKeys = Object.keys(details)
            if (detailKeys.includes('name')) return <span>{details.name}</span>
            if (detailKeys.includes('title')) return <span>{details.title}</span>
            if (detailKeys.includes('message')) return <span>{details.message}</span>
            
            // Fallback to stringified JSON
            return <span>{JSON.stringify(details)}</span>
          } catch (e) {
            return <span>Detail tidak tersedia</span>
          }
        }
        return <span>Detail tidak tersedia</span>
    }
  }
  
  // Format time since
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSecs < 60) {
      return `${diffSecs} detik yang lalu`
    } else if (diffMins < 60) {
      return `${diffMins} menit yang lalu`
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`
    } else if (diffDays === 1) {
      return "kemarin"
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`
    } else {
      return date.toLocaleDateString("id-ID", { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ClipboardList className="h-8 w-8 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold">Log Aktivitas</h1>
                  <p className="text-sky-100">Riwayat Aktivitas Sistem</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" disabled={exportLoading}>
                    {exportLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exporting...</>
                    ) : (
                      <><FileDown className="h-4 w-4 mr-2" /> Export</>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportLogs('excel')}>
                    <FileText className="h-4 w-4 mr-2" /> Export ke Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportLogs('csv')}>
                    <FileText className="h-4 w-4 mr-2" /> Export ke CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk melihat riwayat aktivitas dalam sistem. Anda dapat memfilter dan mencari aktivitas spesifik.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and filter tools */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Riwayat Aktivitas Sistem</CardTitle>
              <p className="text-sm text-muted-foreground">Total {totalItems} aktivitas tercatat</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center mr-2">
                <Switch 
                  id="autoRefresh" 
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  className="mr-2"
                />
                <Label htmlFor="autoRefresh" className="text-sm">Auto Refresh</Label>
              </div>
              {lastRefresh && (
                <p className="text-xs text-muted-foreground mr-2">
                  Diperbarui: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchLogs()} 
                className="mr-2"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari aktivitas..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={actionFilter || ""} onValueChange={(value) => setActionFilter(value || null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Aksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Aksi</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="CREATE_PROPOSAL">Buat Usulan</SelectItem>
                    <SelectItem value="UPDATE_PROPOSAL">Update Usulan</SelectItem>
                    <SelectItem value="DELETE_PROPOSAL">Hapus Usulan</SelectItem>
                    <SelectItem value="APPROVE_PROPOSAL">Setujui Usulan</SelectItem>
                    <SelectItem value="REJECT_PROPOSAL">Tolak Usulan</SelectItem>
                    <SelectItem value="UPLOAD_DOCUMENT">Upload Dokumen</SelectItem>
                    <SelectItem value="VIEW_DOCUMENT">Lihat Dokumen</SelectItem>
                    <SelectItem value="DELETE_DOCUMENT">Hapus Dokumen</SelectItem>
                    <SelectItem value="CREATE_TIMELINE">Buat Timeline</SelectItem>
                    <SelectItem value="UPDATE_TIMELINE">Update Timeline</SelectItem>
                    <SelectItem value="DELETE_TIMELINE">Hapus Timeline</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter || ""} onValueChange={(value) => setRoleFilter(value || null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Role</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="OPERATOR">Operator</SelectItem>
                    <SelectItem value="PEGAWAI">Pegawai</SelectItem>
                    <SelectItem value="OPERATOR_SEKOLAH">Operator Sekolah</SelectItem>
                    <SelectItem value="UNIT_KERJA">Unit Kerja</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM yyyy", { locale: id })} -{" "}
                            {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy", { locale: id })
                        )
                      ) : (
                        <span>Filter Tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 border-b">
                      <div className="flex gap-2 mb-2">
                        <Button size="sm" variant="outline" onClick={setToday}>
                          Hari ini
                        </Button>
                        <Button size="sm" variant="outline" onClick={setYesterday}>
                          Kemarin
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={setLast7Days}>
                          7 Hari
                        </Button>
                        <Button size="sm" variant="outline" onClick={setLast30Days}>
                          30 Hari
                        </Button>
                      </div>
                    </div>
                    <DateRangePicker
                      locale={id}
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto justify-end">
                {(searchQuery || actionFilter || userFilter || dateFilter || dateRange || roleFilter) && (
                  <Button variant="outline" onClick={resetFilters} size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filter
                  </Button>
                )}
              </div>
            </div>

            {/* Activity log table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat data log aktivitas...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 border rounded-md bg-muted/20">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                <p className="text-muted-foreground">Tidak ada aktivitas yang ditemukan</p>
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
                        <TableHead className="w-[180px]">Waktu</TableHead>
                        <TableHead className="w-[140px]">Aksi</TableHead>
                        <TableHead className="w-[140px]">Pengguna</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => {
                        const actionInfo = getActionInfo(log.action)
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono whitespace-nowrap">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(log.createdAt)}
                                  </div>
                                  <div className="text-xs font-medium">
                                    {getTimeSince(log.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={actionInfo.color}>
                                {actionInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">
                                    {log.user?.name || 'Unknown User'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {log.user?.role ? getRoleName(log.user.role) : 'Unknown Role'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{renderActionDetails(log)}</div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} aktivitas
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchLogs(true, currentPage - 1)}
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
                        onClick={() => fetchLogs(true, currentPage + 1)}
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
      </div>
    </DashboardLayout>
  )
}
