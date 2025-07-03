"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Calendar, Edit, Save, X, Eye, EyeOff, Shield, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfileData {
  id: string
  nip: string
  nama: string
  email?: string
  noHp?: string
  jabatan: string
  unitKerja: string
  golongan: string
  alamat?: string
  statusKepegawaian: string
  jenisKelamin: string
  pendidikanTerakhir?: string
  tanggalLahir?: string
  tempatLahir?: string
  statusPerkawinan?: string
  agama?: string
  tanggalMasukKerja?: string
  masaKerja?: string
  wilayah?: string
  unitKerjaId?: string
  role: string
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
}

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function OperatorSekolahProfilPage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/operator-sekolah/profile')
        if (response.ok) {
          const data = await response.json()
          setProfileData(data.profile)
        } else {
          toast({
            title: "Error",
            description: "Gagal memuat data profil",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat memuat profil",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [toast])

  const handleSaveProfile = async () => {
    if (!profileData) return

    try {
      setSaving(true)
      const response = await fetch('/api/operator-sekolah/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: profileData.nama,
          email: profileData.email,
          noHp: profileData.noHp,
          alamat: profileData.alamat,
          tempatLahir: profileData.tempatLahir,
          tanggalLahir: profileData.tanggalLahir,
          statusPerkawinan: profileData.statusPerkawinan,
          agama: profileData.agama,
          pendidikanTerakhir: profileData.pendidikanTerakhir
        })
      })

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Profil berhasil diperbarui",
        })
        setEditMode(false)
        // Refetch profile data
        const refetchResponse = await fetch('/api/operator-sekolah/profile')
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json()
          setProfileData(refetchData.profile)
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData?.message || "Gagal memperbarui profil",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan profil",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Password saat ini wajib diisi'
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Password baru wajib diisi'
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password baru minimal 6 karakter'
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      setSaving(true)
      const response = await fetch('/api/operator-sekolah/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      })

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Password berhasil diubah",
        })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordForm(false)
        setErrors({})
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData?.message || "Gagal mengubah password",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengubah password",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PNS': 'default',
      'PPPK': 'secondary',
      'GTT': 'outline',
      'PTT': 'outline',
      'Honorer': 'destructive',
      'OPERATOR_SEKOLAH': 'default'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat profil...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profileData) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Data profil tidak ditemukan</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator-sekolah">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profil Saya</h1>
            <p className="text-muted-foreground">
              Kelola informasi profil dan pengaturan akun Anda
            </p>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setEditMode(false)}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profil
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarFallback className="text-2xl">
                  {getInitials(profileData.nama)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profileData.nama}</CardTitle>
              <CardDescription>{profileData.jabatan}</CardDescription>
              <div className="flex justify-center gap-2 mt-2">
                {getStatusBadge(profileData.statusKepegawaian)}
                {getStatusBadge(profileData.role)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profileData.unitKerja}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Bergabung {formatDate(profileData.tanggalMasukKerja)}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NIP:</span>
                  <span className="font-mono">{profileData.nip}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Golongan:</span>
                  <span className="font-mono">{profileData.golongan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Masa Kerja:</span>
                  <span>{profileData.masaKerja || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Login Terakhir:</span>
                  <span>{formatDate(profileData.lastLogin)}</span>
                </div>
              </div>

              <Separator />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                <Key className="h-4 w-4 mr-2" />
                Ubah Password
              </Button>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informasi Detail</CardTitle>
              <CardDescription>
                {editMode ? 'Edit informasi profil Anda' : 'Informasi lengkap profil Anda'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Pribadi */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    {editMode ? (
                      <Input
                        id="nama"
                        value={profileData.nama}
                        onChange={(e) => setProfileData(prev => prev ? {...prev, nama: e.target.value} : null)}
                      />
                    ) : (
                      <p className="p-2 bg-muted/50 rounded">{profileData.nama}</p>
                    )}
                  </div>
                  <div>
                    <Label>Jenis Kelamin</Label>
                    <p className="p-2 bg-muted/50 rounded">{profileData.jenisKelamin}</p>
                  </div>
                  <div>
                    <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                    {editMode ? (
                      <Input
                        id="tempatLahir"
                        value={profileData.tempatLahir || ''}
                        onChange={(e) => setProfileData(prev => prev ? {...prev, tempatLahir: e.target.value} : null)}
                      />
                    ) : (
                      <p className="p-2 bg-muted/50 rounded">{profileData.tempatLahir || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                    {editMode ? (
                      <Input
                        id="tanggalLahir"
                        type="date"
                        value={profileData.tanggalLahir ? new Date(profileData.tanggalLahir).toISOString().split('T')[0] : ''}
                        onChange={(e) => setProfileData(prev => prev ? {...prev, tanggalLahir: e.target.value} : null)}
                      />
                    ) : (
                      <p className="p-2 bg-muted/50 rounded">{formatDate(profileData.tanggalLahir)}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="statusPerkawinan">Status Perkawinan</Label>
                    {editMode ? (
                      <Select value={profileData.statusPerkawinan || ''} onValueChange={(value) => setProfileData(prev => prev ? {...prev, statusPerkawinan: value} : null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Belum Menikah">Belum Menikah</SelectItem>
                          <SelectItem value="Menikah">Menikah</SelectItem>
                          <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                          <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="p-2 bg-muted/50 rounded">{profileData.statusPerkawinan || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="agama">Agama</Label>
                    {editMode ? (
                      <Select value={profileData.agama || ''} onValueChange={(value) => setProfileData(prev => prev ? {...prev, agama: value} : null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih agama" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Islam">Islam</SelectItem>
                          <SelectItem value="Kristen Protestan">Kristen Protestan</SelectItem>
                          <SelectItem value="Kristen Katolik">Kristen Katolik</SelectItem>
                          <SelectItem value="Hindu">Hindu</SelectItem>
                          <SelectItem value="Buddha">Buddha</SelectItem>
                          <SelectItem value="Konghucu">Konghucu</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="p-2 bg-muted/50 rounded">{profileData.agama || '-'}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="alamat">Alamat</Label>
                  {editMode ? (
                    <Textarea
                      id="alamat"
                      value={profileData.alamat || ''}
                      onChange={(e) => setProfileData(prev => prev ? {...prev, alamat: e.target.value} : null)}
                      rows={3}
                    />
                  ) : (
                    <p className="p-2 bg-muted/50 rounded min-h-[80px]">{profileData.alamat || '-'}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Data Kontak */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informasi Kontak</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    {editMode ? (
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email || ''}
                        onChange={(e) => setProfileData(prev => prev ? {...prev, email: e.target.value} : null)}
                      />
                    ) : (
                      <p className="p-2 bg-muted/50 rounded">{profileData.email || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="noHp">No. HP</Label>
                    {editMode ? (
                      <Input
                        id="noHp"
                        value={profileData.noHp || ''}
                        onChange={(e) => setProfileData(prev => prev ? {...prev, noHp: e.target.value} : null)}
                      />
                    ) : (
                      <p className="p-2 bg-muted/50 rounded">{profileData.noHp || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Kepegawaian */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informasi Kepegawaian</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Unit Kerja</Label>
                    <p className="p-2 bg-muted/50 rounded">{profileData.unitKerja}</p>
                  </div>
                  <div>
                    <Label>Wilayah</Label>
                    <p className="p-2 bg-muted/50 rounded">{profileData.wilayah || '-'}</p>
                  </div>
                  <div>
                    <Label htmlFor="pendidikanTerakhir">Pendidikan Terakhir</Label>
                    {editMode ? (
                      <Select value={profileData.pendidikanTerakhir || ''} onValueChange={(value) => setProfileData(prev => prev ? {...prev, pendidikanTerakhir: value} : null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pendidikan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SD">SD</SelectItem>
                          <SelectItem value="SMP">SMP</SelectItem>
                          <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                          <SelectItem value="D3">D3</SelectItem>
                          <SelectItem value="S1">S1</SelectItem>
                          <SelectItem value="S2">S2</SelectItem>
                          <SelectItem value="S3">S3</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="p-2 bg-muted/50 rounded">{profileData.pendidikanTerakhir || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label>TMT</Label>
                    <p className="p-2 bg-muted/50 rounded">{formatDate(profileData.tanggalMasukKerja)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Password Change Form */}
        {showPasswordForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ubah Password
              </CardTitle>
              <CardDescription>
                Masukkan password lama dan password baru untuk mengubah password akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currentPassword">Password Saat Ini</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                      className={errors.currentPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({...prev, current: !prev.current}))}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.currentPassword && <p className="text-sm text-red-500">{errors.currentPassword}</p>}
                </div>
                <div>
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                      className={errors.newPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({...prev, new: !prev.new}))}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({...prev, confirm: !prev.confirm}))}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                >
                  {saving ? 'Mengubah...' : 'Ubah Password'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setErrors({})
                  }}
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
