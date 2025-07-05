"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar, CalendarDays, Clock, Pencil, Info, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface TimelineData {
  id: string;
  title: string;
  description: string | null;
  jabatanType: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  wilayahId: string | null;
  wilayahRelasi?: {
    nama: string;
    namaLengkap: string;
  } | null;
}

export default function TimelinePage() {
  const { toast } = useToast()
  const [timelines, setTimelines] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [modalType, setModalType] = useState<"add" | "edit">("add")
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineData | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    jabatanType: "all",
    startDate: "",
    endDate: "",
    isActive: true,
    priority: 1,
    wilayahId: null as string | null
  })
  const [wilayahOptions, setWilayahOptions] = useState<{id: string, name: string}[]>([])

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      await fetchTimelines();
      fetchWilayahOptions();
      setLastRefresh(new Date());
    };
    
    fetchData();
    
    // Set up interval for auto-refresh (every 30 seconds)
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchTimelines(false); // Pass false to avoid showing loading indicator
        setLastRefresh(new Date());
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const fetchTimelines = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true)
      }
      const response = await fetch("/api/admin/timeline")
      
      if (!response.ok) {
        throw new Error("Failed to fetch timelines")
      }
      
      const data = await response.json()
      setTimelines(data.data)
    } catch (error) {
      console.error("Error fetching timelines:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data timeline. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      if (showLoadingIndicator) {
        setLoading(false)
      }
    }
  }
  
  const fetchWilayahOptions = async () => {
    try {
      const response = await fetch("/api/admin/wilayah")
      
      if (!response.ok) {
        throw new Error("Failed to fetch wilayah options")
      }
      
      const data = await response.json()
      setWilayahOptions(data.data)
    } catch (error) {
      console.error("Error fetching wilayah options:", error)
    }
  }

  const openAddDialog = () => {
    setModalType("add")
    setForm({
      title: "",
      description: "",
      jabatanType: "all",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      isActive: true,
      priority: 1,
      wilayahId: null
    })
    setShowDialog(true)
  }

  const openEditDialog = (timeline: TimelineData) => {
    setModalType("edit")
    setSelectedTimeline(timeline)
    setForm({
      title: timeline.title,
      description: timeline.description || "",
      jabatanType: timeline.jabatanType,
      startDate: new Date(timeline.startDate).toISOString().slice(0, 10),
      endDate: new Date(timeline.endDate).toISOString().slice(0, 10),
      isActive: timeline.isActive,
      priority: timeline.priority,
      wilayahId: timeline.wilayahId
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      if (!form.title || !form.startDate || !form.endDate) {
        toast({
          title: "Error",
          description: "Harap isi judul, tanggal mulai, dan tanggal selesai.",
          variant: "destructive"
        })
        return
      }
      
      const requestBody = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      }
      
      if (modalType === "add") {
        const response = await fetch("/api/admin/timeline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
        
        if (!response.ok) {
          throw new Error("Failed to create timeline")
        }
        
        toast({
          title: "Berhasil",
          description: "Timeline berhasil ditambahkan.",
        })
      } else if (modalType === "edit" && selectedTimeline) {
        const response = await fetch(`/api/admin/timeline/${selectedTimeline.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
        
        if (!response.ok) {
          throw new Error("Failed to update timeline")
        }
        
        toast({
          title: "Berhasil",
          description: "Timeline berhasil diperbarui.",
        })
      }
      
      // Reload timelines
      fetchTimelines()
      setLastRefresh(new Date())
      setShowDialog(false)
    } catch (error) {
      console.error("Error saving timeline:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan timeline. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedTimeline) return
    
    try {
      const response = await fetch(`/api/admin/timeline/${selectedTimeline.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete timeline")
      }
      
      toast({
        title: "Berhasil",
        description: "Timeline berhasil dihapus.",
      })
      
      // Reload timelines
      fetchTimelines()
      setLastRefresh(new Date())
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting timeline:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus timeline. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }
  
  // Helper function to check if a timeline is currently active (between start and end dates)
  const isTimelineActive = (timeline: TimelineData) => {
    const now = new Date();
    const startDate = new Date(timeline.startDate);
    const endDate = new Date(timeline.endDate);
    return timeline.isActive && now >= startDate && now <= endDate;
  }
  
  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
    const end = new Date(endDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
    return `${start} - ${end}`
  }
  
  // Helper function to get job type name
  const getJabatanTypeName = (type: string) => {
    const types: {[key: string]: string} = {
      "all": "Semua Jabatan",
      "pelaksana": "Jabatan Pelaksana",
      "struktural": "Jabatan Struktural",
      "fungsional": "Jabatan Fungsional"
    }
    return types[type] || type
  }
  
  // Helper function to get priority name and class
  const getPriorityInfo = (priority: number) => {
    switch (priority) {
      case 3:
        return { name: "Mendesak", class: "bg-red-100 text-red-700" };
      case 2:
        return { name: "Penting", class: "bg-yellow-100 text-yellow-700" };
      default:
        return { name: "Normal", class: "bg-blue-100 text-blue-700" };
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Timeline Kenaikan Pangkat</h1>
                <p className="text-sky-100">Pengaturan Periode Usulan</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk mengelola timeline kenaikan pangkat. Anda dapat membuat, mengedit, dan menghapus timeline.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Periode Kenaikan Pangkat</CardTitle>
              <p className="text-sm text-muted-foreground">Atur waktu pengusulan untuk setiap jenis jabatan</p>
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
                onClick={() => fetchTimelines()} 
                className="mr-2"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Timeline
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat data timeline...</span>
              </div>
            ) : timelines.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-gray-500">Belum ada timeline yang ditambahkan</p>
                <Button onClick={openAddDialog} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Timeline
                </Button>
              </div>
            ) : (
              timelines.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <div className="flex gap-1">
                      <Badge className={`${getPriorityInfo(item.priority).class} text-xs`}>
                        {getPriorityInfo(item.priority).name}
                      </Badge>
                      <Badge className={item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                      {isTimelineActive(item) && (
                        <Badge className="bg-blue-100 text-blue-700">
                          Periode Berjalan
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex flex-col md:flex-row md:gap-10">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium text-black dark:text-white">Jenis Jabatan</div>
                          <div>{getJabatanTypeName(item.jabatanType)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium text-black dark:text-white">Periode Waktu</div>
                          <div>{formatDateRange(item.startDate, item.endDate)}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </div>
                  
                  {item.wilayahId && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Wilayah:</span> {
                        wilayahOptions.find(w => w.id === item.wilayahId)?.name || item.wilayahId
                      }
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalType === "add" ? "Tambah Timeline" : "Edit Timeline"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Timeline <span className="text-red-500">*</span></Label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                placeholder="Masukkan judul timeline"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi singkat tentang timeline ini"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jabatanType">Jenis Jabatan <span className="text-red-500">*</span></Label>
              <Select 
                value={form.jabatanType} 
                onValueChange={(value) => setForm({ ...form, jabatanType: value })}
              >
                <SelectTrigger id="jabatanType" className="w-full">
                  <SelectValue placeholder="Pilih jenis jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jabatan</SelectItem>
                  <SelectItem value="pelaksana">Jabatan Pelaksana</SelectItem>
                  <SelectItem value="struktural">Jabatan Struktural</SelectItem>
                  <SelectItem value="fungsional">Jabatan Fungsional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai <span className="text-red-500">*</span></Label>
                <input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                  title="Pilih tanggal mulai"
                  placeholder="Pilih tanggal mulai"
                  aria-label="Tanggal Mulai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai <span className="text-red-500">*</span></Label>
                <input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                  title="Pilih tanggal selesai"
                  placeholder="Pilih tanggal selesai"
                  aria-label="Tanggal Selesai"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wilayahId">Wilayah (Opsional)</Label>
              <Select 
                value={form.wilayahId || "all"} 
                onValueChange={(value) => setForm({ ...form, wilayahId: value === "all" ? null : value })}
              >
                <SelectTrigger id="wilayahId" className="w-full">
                  <SelectValue placeholder="Pilih wilayah (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Wilayah</SelectItem>
                  {wilayahOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Jika dipilih, timeline hanya berlaku untuk wilayah tersebut</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <Select 
                value={form.priority.toString()} 
                onValueChange={(value) => setForm({ ...form, priority: parseInt(value) })}
              >
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Normal</SelectItem>
                  <SelectItem value="2">Penting</SelectItem>
                  <SelectItem value="3">Mendesak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isActive" 
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="isActive">Timeline Aktif</Label>
            </div>
          </div>
          
          <DialogFooter>
            {modalType === "edit" && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowDialog(false);
                  setShowDeleteDialog(true);
                }} 
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              {modalType === "add" ? "Tambah" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Timeline</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus timeline &ldquo;{selectedTimeline?.title}&rdquo;? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
