"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar, 
  Activity,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Edit,
  Save,
  X
} from "lucide-react"

interface OperatorProfile {
  id: string
  nip: string
  nama: string
  email: string
  noHp: string
  alamat: string
  jabatan: string
  golongan: string
  jenisJabatan: string
  unitKerja: string
  wilayah: string
  profilePictureUrl?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  statistics: {
    totalHandledProposals: number
    totalUnitKerja: number
    totalPegawai: number
    workStats: Array<{
      status: string
      count: number
    }>
  }
  recentActivities: Array<{
    id: string
    action: string
    details: string
    createdAt: string
  }>
}

export default function OperatorProfilPage() {
  const [profile, setProfile] = useState<OperatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    noHp: "",
    alamat: "",
    password: "",
    confirmPassword: ""
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operator/profile')
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.profile) {
          setProfile(result.profile)
          setFormData({
            nama: result.profile.nama || "",
            email: result.profile.email || "",
            noHp: result.profile.noHp || "",
            alamat: result.profile.alamat || "",
            password: "",
            confirmPassword: ""
          })
        } else {
          throw new Error(result.message || "Failed to fetch profile data")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch profile data")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memuat profil",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    // Basic validation
    if (!formData.nama.trim()) {
      toast({
        title: "Error",
        description: "Nama tidak boleh kosong",
        variant: "destructive"
      })
      return
    }

    // Validate password if provided
    if (formData.password) {
      if (formData.password.length < 6) {
        toast({
          title: "Error",
          description: "Password minimal 6 karakter",
          variant: "destructive"
        })
        return
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Error", 
          description: "Konfirmasi password tidak sesuai",
          variant: "destructive"
        })
        return
      }
    }

    try {
      setSaving(true)
      
      const updateData = {
        nama: formData.nama.trim(),
        email: formData.email.trim() || null,
        noHp: formData.noHp.trim() || null,
        alamat: formData.alamat.trim() || null
      }
      
      // Only add password if provided
      if (formData.password) {
        Object.assign(updateData, { password: formData.password });
      }
      
      const response = await fetch('/api/operator/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // Make sure we update the profile with the latest data including statistics
        await fetchProfile()
        
        // Reset form and exit edit mode
        setEditing(false)
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }))
        
        toast({
          title: "Berhasil!",
          description: "Profil berhasil diperbarui",
        })
      } else {
        throw new Error(result.error || result.message || 'Gagal memperbarui profil')
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui profil",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        nama: profile.nama || "",
        email: profile.email || "",
        noHp: profile.noHp || "",
        alamat: profile.alamat || "",
        password: "",
        confirmPassword: ""
      })
    }
    setEditing(false)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DIAJUKAN':
      case 'MENUNGGU_VERIFIKASI_SEKOLAH':
      case 'MENUNGGU_VERIFIKASI_DINAS':
        return 'bg-yellow-100 text-yellow-800'
      case 'DIPROSES_OPERATOR':
      case 'DIPROSES_ADMIN':
        return 'bg-blue-100 text-blue-800'
      case 'SELESAI':
        return 'bg-green-100 text-green-800'
      case 'DITOLAK':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DIAJUKAN':
        return 'Diajukan'
      case 'MENUNGGU_VERIFIKASI_SEKOLAH':
        return 'Menunggu Verifikasi Sekolah'
      case 'MENUNGGU_VERIFIKASI_DINAS':
        return 'Menunggu Verifikasi Dinas'
      case 'DIPROSES_OPERATOR':
        return 'Diproses Operator'
      case 'DIPROSES_ADMIN':
        return 'Diproses Admin'
      case 'SELESAI':
        return 'Selesai'
      case 'DITOLAK':
        return 'Ditolak'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat profil...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout userType="operator">
        <div className="text-center py-8">
          <p className="text-gray-500">Profil tidak ditemukan</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4 border-4 border-white/30">
                  <AvatarImage src={profile.profilePictureUrl} />
                  <AvatarFallback className="bg-white/20 text-white text-xl">
                    {profile.nama.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">{profile.nama}</h1>
                  <p className="text-blue-100">{profile.jabatan} - {profile.wilayah}</p>
                  <p className="text-blue-200 text-sm">NIP: {profile.nip}</p>
                </div>
              </div>
              <Button
                onClick={() => setEditing(!editing)}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {editing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {editing ? "Batal" : "Edit Profil"}
              </Button>
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
                  <p className="text-sm font-medium text-gray-600">Total Usulan</p>
                  <p className="text-2xl font-bold">{profile.statistics.totalHandledProposals}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unit Kerja</p>
                  <p className="text-2xl font-bold">{profile.statistics.totalUnitKerja}</p>
                </div>
                <Building className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pegawai</p>
                  <p className="text-2xl font-bold">{profile.statistics.totalPegawai}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Efisiensi</p>
                  <p className="text-2xl font-bold">
                    {profile.statistics.totalHandledProposals > 0 ? 
                      Math.round((profile.statistics.workStats.find(s => s.status === 'SELESAI')?.count || 0) / profile.statistics.totalHandledProposals * 100) 
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informasi Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nama">Nama Lengkap</Label>
                      <Input
                        id="nama"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Masukkan email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="noHp">No. HP</Label>
                      <Input
                        id="noHp"
                        value={formData.noHp}
                        onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                        placeholder="Masukkan nomor HP"
                      />
                    </div>

                    <div>
                      <Label htmlFor="alamat">Alamat</Label>
                      <Textarea
                        id="alamat"
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        placeholder="Masukkan alamat lengkap"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password Baru (Opsional)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Kosongkan jika tidak ingin mengubah"
                      />
                    </div>

                    {formData.password && (
                      <div>
                        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="Konfirmasi password baru"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Menyimpan..." : "Simpan"}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" disabled={saving}>
                        <X className="h-4 w-4 mr-2" />
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2">{profile.email || "-"}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">No. HP:</span>
                      <span className="ml-2">{profile.noHp || "-"}</span>
                    </div>

                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span className="text-gray-600">Alamat:</span>
                      <span className="ml-2">{profile.alamat || "-"}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Unit Kerja:</span>
                      <span className="ml-2">{profile.unitKerja || "-"}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Bergabung:</span>
                      <span className="ml-2">
                        {new Date(profile.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {profile.lastLogin && (
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-600">Login Terakhir:</span>
                        <span className="ml-2">
                          {new Date(profile.lastLogin).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Work Statistics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Statistik Pekerjaan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.statistics.workStats.length > 0 ? (
                  <div className="space-y-3">
                    {profile.statistics.workStats.map((stat) => (
                      <div key={stat.status} className="flex items-center justify-between">
                        <Badge className={getStatusBadgeColor(stat.status)}>
                          {getStatusLabel(stat.status)}
                        </Badge>
                        <span className="font-semibold">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Belum ada data statistik</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Aktivitas Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {profile.recentActivities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="border-l-2 border-blue-200 pl-4 pb-3">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-600">{activity.details}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.createdAt).toLocaleDateString('id-ID', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Belum ada aktivitas</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
