"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Eye, CheckCircle, XCircle, Info, Mail, Loader2, Search, Filter, RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export default function InboxUsulanPage() {
  const { toast } = useToast()
  const [inbox, setInbox] = useState<Usulan[]>([])
  const [selected, setSelected] = useState<Usulan | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catatan, setCatatan] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchUsulan()
    // Set up periodic refresh every 2 minutes
    const intervalId = setInterval(() => {
      fetchUsulan()
    }, 120000) // 2 minutes in milliseconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsulan = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/usulan")
      
      if (!response.ok) {
        throw new Error("Failed to fetch proposals")
      }
      
      const data = await response.json()
      
      // Sort usulan by createdAt date (newest first)
      const sortedInbox = data.data.sort((a: Usulan, b: Usulan) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      setInbox(sortedInbox)
    } catch (error) {
      console.error("Error fetching proposals:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data usulan. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLihat = (item: Usulan) => {
    setSelected(item)
    setCatatan("")
    setOpenDialog(true)
  }

  const handleSetujui = async () => {
    if (selected) {
      try {
        const response = await fetch(`/api/admin/usulan/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "DISETUJUI_ADMIN",
            catatan: catatan || "Usulan disetujui oleh admin",
          }),
        })
        
        if (!response.ok) {
          throw new Error("Failed to update proposal status")
        }
        
        // Update local state
        setInbox(inbox.map((item) =>
          item.id === selected.id ? { ...item, status: "DISETUJUI_ADMIN" } : item
        ))
        
        toast({
          title: "Berhasil",
          description: "Status usulan berhasil diperbarui menjadi Disetujui.",
        })
        
        setOpenDialog(false)
      } catch (error) {
        console.error("Error updating proposal:", error)
        toast({
          title: "Error",
          description: "Gagal memperbarui status usulan. Silakan coba lagi.",
          variant: "destructive"
        })
      }
    }
  }

  const handleTolak = async () => {
    if (selected) {
      if (!catatan) {
        toast({
          title: "Perhatian",
          description: "Harap isi catatan penolakan untuk pegawai.",
          variant: "destructive"
        })
        return
      }
      
      try {
        const response = await fetch(`/api/admin/usulan/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "DITOLAK",
            catatan: catatan,
          }),
        })
        
        if (!response.ok) {
          throw new Error("Failed to update proposal status")
        }
        
        // Update local state
        setInbox(inbox.map((item) =>
          item.id === selected.id ? { ...item, status: "DITOLAK" } : item
        ))
        
        toast({
          title: "Berhasil",
          description: "Status usulan berhasil diperbarui menjadi Ditolak.",
        })
        
        setOpenDialog(false)
      } catch (error) {
        console.error("Error updating proposal:", error)
        toast({
          title: "Error",
          description: "Gagal memperbarui status usulan. Silakan coba lagi.",
          variant: "destructive"
        })
      }
    }
  }

  // Filter usulan based on search query and status
  const filteredInbox = inbox.filter((usulan) => {
    const matchesSearch = 
      usulan.pegawai.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (usulan.pegawai.nip && usulan.pegawai.nip.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (usulan.pegawai.jabatan && usulan.pegawai.jabatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (usulan.pegawai.unitKerja?.name && 
        usulan.pegawai.unitKerja.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !statusFilter || usulan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
  };
  
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

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Mail className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Inbox Usulan</h1>
                <p className="text-sky-100">Total {inbox.length} usulan</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk mengelola usulan kenaikan pangkat. Anda dapat menyetujui atau menolak usulan yang telah disetujui oleh operator.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Search and filter options */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-auto max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama, NIP, jabatan..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter ? getStatusText(statusFilter) : "Filter Status"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  Semua Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("DIAJUKAN")}>
                  Diajukan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("DIPROSES_OPERATOR")}>
                  Diproses Operator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("DISETUJUI_OPERATOR")}>
                  Disetujui Operator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("DIPROSES_ADMIN")}>
                  Diproses Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("DITOLAK")}>
                  Ditolak
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("DISETUJUI_ADMIN")}>
                  Disetujui Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("SELESAI")}>
                  Selesai
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(searchQuery || statusFilter) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10">
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Reset
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchUsulan} 
              className="h-10" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Memuat data usulan...</span>
          </div>
        ) : inbox.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Tidak ada usulan yang perlu diproses saat ini.</p>
            </CardContent>
          </Card>
        ) : filteredInbox.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Tidak ada usulan yang sesuai dengan filter yang dipilih.</p>
              <Button variant="outline" onClick={resetFilters} className="mt-4">
                Reset Filter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInbox.map((item) => (
              <Card key={item.id} className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{item.pegawai.name}</p>
                    <p className="text-sm text-muted-foreground">NIP: {item.pegawai.nip || "-"}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.pegawai.jabatan || "-"} • {
                        item.pegawai.unitKerja 
                          ? item.pegawai.unitKerja.name 
                          : "-"
                      }
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dikirim: {new Date(item.createdAt).toLocaleDateString("id-ID", { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusBadgeClass(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleLihat(item)}>
                        <Eye className="w-4 h-4 mr-1" /> Lihat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Detail */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle>Detail Usulan</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <p><strong>Nama:</strong> {selected.pegawai.name}</p>
                  <p><strong>NIP:</strong> {selected.pegawai.nip || "-"}</p>
                  <p><strong>Jabatan:</strong> {selected.pegawai.jabatan || "-"}</p>
                  <p><strong>Unit Kerja:</strong> {
                    selected.pegawai.unitKerja 
                      ? selected.pegawai.unitKerja.name 
                      : "-"
                  }</p>
                  <p><strong>Golongan Saat Ini:</strong> {selected.pegawai.currentRank || selected.pegawai.golongan || "-"}</p>
                  <p><strong>Golongan Tujuan:</strong> {selected.pegawai.targetRank || "-"}</p>
                  <p><strong>Tanggal Pengajuan:</strong> {new Date(selected.createdAt).toLocaleDateString("id-ID", { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  <p><strong>Terakhir Diperbarui:</strong> {new Date(selected.updatedAt).toLocaleDateString("id-ID", { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p><strong>Status:</strong> <Badge className={getStatusBadgeClass(selected.status)}>{getStatusText(selected.status)}</Badge></p>
                  
                  {selected.documents && selected.documents.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold">Dokumen:</p>
                      <ul className="list-disc pl-5 mt-2">
                        {selected.documents.map((doc, index) => (
                          <li key={index} className="text-sm">
                            <a 
                              href={doc.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {doc.name || doc.fileName || `Dokumen ${index + 1}`}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Textarea 
                    placeholder="Catatan verifikasi..." 
                    className="mt-4" 
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                  />
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="bg-green-600 hover:bg-green-700 flex-1" 
                      onClick={handleSetujui}
                      disabled={selected.status !== "DISETUJUI_OPERATOR" && selected.status !== "DIPROSES_ADMIN"}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Setujui
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleTolak}
                      disabled={selected.status !== "DISETUJUI_OPERATOR" && selected.status !== "DIPROSES_ADMIN"}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Tolak
                    </Button>
                  </div>
                  
                  {(selected.status === "DISETUJUI_ADMIN" || selected.status === "DITOLAK") && (
                    <div className="mt-4 bg-gray-50 p-3 rounded-md dark:bg-gray-800">
                      <p className="text-sm text-muted-foreground mb-1">
                        Usulan ini telah {selected.status === "DISETUJUI_ADMIN" ? "disetujui" : "ditolak"} dan tidak dapat diubah lagi.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
