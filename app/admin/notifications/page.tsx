"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Trash, Bell, Eye, Info, Loader2, Search, X, CheckCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  userRole: string | null;
  userId: string | null;
  isRead: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function NotifikasiGlobalPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState<string>("")
  const [content, setContent] = useState("")
  const [type, setType] = useState<string>("info")
  const [actionLabel, setActionLabel] = useState("")
  const [actionUrl, setActionUrl] = useState("")
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [readFilter, setReadFilter] = useState("all")

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (typeFilter !== "all") {
        params.append("type", typeFilter)
      }
      if (readFilter !== "all") {
        params.append("isRead", readFilter === "read" ? "true" : "false")
      }
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      
      const response = await fetch(`/api/admin/notifications?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }
      
      const result = await response.json()
      setNotifications(result.data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Gagal memuat notifikasi. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [typeFilter, readFilter, searchQuery, toast])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleSend = async () => {
    if (!title || !target || !content || !type) {
      toast({
        title: "Error",
        description: "Lengkapi semua field yang diperlukan sebelum mengirim notifikasi.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const userId = null
      const userRole = target !== "semua" ? target.toUpperCase() : null
      
      const notificationData = {
        title,
        message: content,
        type,
        userId,
        userRole,
        actionUrl: actionUrl || null,
        actionLabel: actionLabel || null
      }
      
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(notificationData)
      })
      
      if (!response.ok) {
        throw new Error("Failed to create notification")
      }
      
      // Reset form
      setTitle("")
      setTarget("")
      setContent("")
      setType("info")
      setActionLabel("")
      setActionUrl("")
      
      toast({
        title: "Sukses",
        description: "Notifikasi berhasil dikirim.",
        variant: "default"
      })
      
      // Refresh notifications list
      fetchNotifications()
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: "Gagal mengirim notifikasi. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification)
    setIsDetailOpen(true)
  }
  
  const handleSearch = () => {
    fetchNotifications()
  }
  
  const handleDeleteNotification = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus notifikasi ini?")) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete notification")
      }
      
      toast({
        title: "Sukses",
        description: "Notifikasi berhasil dihapus.",
        variant: "default"
      })
      
      // Remove from local state
      setNotifications(notifications.filter(n => n.id !== id))
      
      // Close dialog if it's the one being viewed
      if (selectedNotification?.id === id) {
        setIsDetailOpen(false)
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus notifikasi. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }
  
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isRead: true })
      })
      
      if (!response.ok) {
        throw new Error("Failed to update notification")
      }
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ))
      
      // Also update selected notification if it's the one being viewed
      if (selectedNotification?.id === id) {
        setSelectedNotification({ ...selectedNotification, isRead: true })
      }
      
      toast({
        title: "Sukses",
        description: "Notifikasi ditandai sebagai telah dibaca.",
        variant: "default"
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui status notifikasi. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }
  
  const handleMarkAllAsRead = async () => {
    if (!confirm("Apakah Anda yakin ingin menandai semua notifikasi sebagai telah dibaca?")) {
      return
    }
    
    try {
      const response = await fetch("/api/admin/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read")
      }
      
      const result = await response.json()
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      
      toast({
        title: "Sukses",
        description: `${result.count} notifikasi ditandai sebagai telah dibaca.`,
        variant: "default"
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui status notifikasi. Silakan coba lagi.",
        variant: "destructive"
      })
    }
  }
  
  // Helper to get notification type color and icon
  const getNotificationTypeInfo = (notificationType: string) => {
    switch (notificationType) {
      case "success":
        return { bgColor: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> }
      case "warning":
        return { bgColor: "bg-yellow-100 text-yellow-800", icon: <Info className="h-4 w-4" /> }
      case "error":
        return { bgColor: "bg-red-100 text-red-800", icon: <X className="h-4 w-4" /> }
      case "info":
      default:
        return { bgColor: "bg-blue-100 text-blue-800", icon: <Info className="h-4 w-4" /> }
    }
  }
  
  // Get target display text
  const getTargetDisplay = (userRole: string | null) => {
    if (!userRole) return "Semua Pengguna"
    
    const roleMap: Record<string, string> = {
      "ADMIN": "Admin",
      "PEGAWAI": "Pegawai",
      "OPERATOR": "Operator Dinas",
      "OPERATOR_SEKOLAH": "Operator Sekolah",
      "OPERATOR_UNIT_KERJA": "Operator Unit Kerja"
    }
    
    return roleMap[userRole] || userRole
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Bell className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Notifikasi Global</h1>
                <p className="text-sky-100">Kirim pemberitahuan ke pengguna</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Halaman ini memungkinkan Anda mengirim dan mengelola notifikasi yang dikirim kepada pengguna. 
                  Notifikasi dapat dikirim ke semua pengguna atau ke peran spesifik.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Create Notification Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kirim Notifikasi Baru</CardTitle>
            <p className="text-muted-foreground text-sm">Buat dan kirim notifikasi ke pengguna</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Contoh: Perpanjangan Masa Pengusulan KAPE"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={target} onValueChange={(value) => setTarget(value)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih target penerima" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Pengguna</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="PEGAWAI">Pegawai</SelectItem>
                  <SelectItem value="OPERATOR">Operator Dinas</SelectItem>
                  <SelectItem value="OPERATOR_SEKOLAH">Operator Sekolah</SelectItem>
                  <SelectItem value="OPERATOR_UNIT_KERJA">Operator Unit Kerja</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={type} onValueChange={(value) => setType(value)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis notifikasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informasi</SelectItem>
                  <SelectItem value="success">Sukses</SelectItem>
                  <SelectItem value="warning">Peringatan</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Textarea
              placeholder="Tulis isi notifikasi di sini..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Label tombol aksi (opsional)"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                placeholder="URL aksi (opsional)"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex gap-2">
              <Button className="flex items-center gap-2" onClick={handleSend} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Kirim Notifikasi
              </Button>
              <Button variant="outline" type="button" onClick={() => {
                setTitle("")
                setTarget("")
                setContent("")
                setType("info")
                setActionLabel("")
                setActionUrl("")
              }} disabled={isSubmitting}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <CardTitle className="text-base">Riwayat Notifikasi</CardTitle>
              <p className="text-muted-foreground text-sm">Notifikasi yang telah dikirim</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isLoading}>
                <CheckCheck className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Tandai Semua Dibaca</span>
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Cari notifikasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="info">Informasi</SelectItem>
                    <SelectItem value="success">Sukses</SelectItem>
                    <SelectItem value="warning">Peringatan</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={readFilter} onValueChange={setReadFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="unread">Belum Dibaca</SelectItem>
                    <SelectItem value="read">Sudah Dibaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tidak ada notifikasi yang sesuai dengan filter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  const typeInfo = getNotificationTypeInfo(notification.type)
                  
                  return (
                    <div
                      key={notification.id}
                      className={`border p-4 rounded-lg shadow-sm transition-all ${!notification.isRead ? 'bg-muted/20 border-l-4 border-l-primary' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${typeInfo.bgColor}`}>
                            {typeInfo.icon}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-semibold text-base mb-1">{notification.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2">{notification.message}</div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleString("id-ID")}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {getTargetDisplay(notification.userRole)}
                              </Badge>
                              {!notification.isRead && (
                                <Badge className="text-xs bg-primary text-white">Baru</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Tandai sudah dibaca"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleView(notification)}
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteNotification(notification.id)}
                            title="Hapus notifikasi"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Detail */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedNotification.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">
                      Target: {getTargetDisplay(selectedNotification.userRole)}
                    </Badge>
                    <Badge variant="secondary">
                      {selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}
                    </Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <p className="whitespace-pre-line">{selectedNotification.message}</p>
                
                {selectedNotification.actionUrl && selectedNotification.actionLabel && (
                  <div className="mt-4">
                    <Button variant="outline" asChild>
                      <a href={selectedNotification.actionUrl} target="_blank" rel="noopener noreferrer">
                        {selectedNotification.actionLabel}
                      </a>
                    </Button>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-4">
                  Dibuat pada: {new Date(selectedNotification.createdAt).toLocaleString("id-ID")}
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button variant="destructive" size="sm" onClick={() => handleDeleteNotification(selectedNotification.id)}>
                  <Trash className="h-4 w-4 mr-2" /> Hapus
                </Button>
                <Button onClick={() => setIsDetailOpen(false)}>Tutup</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
