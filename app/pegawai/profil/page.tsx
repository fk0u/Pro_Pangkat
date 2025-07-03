"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { User, Edit, Save, Camera, CheckCircle, AlertCircle } from "lucide-react"

export default function ProfilPage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileData, setProfileData] = useState({
    namaLengkap: "",
    nip: "",
    perangkatDaerah: "",
    golongan: "",
    tmtGolongan: "",
    jabatan: "",
    jenisJabatan: "",
    email: "",
    telepon: "",
    alamat: "",
    wilayah: "",
  })

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/pegawai/profile")
      
      if (response.ok) {
        const data = await response.json()
        console.log('Profile API Response:', data) // Debug log
        
        setProfileData({
          namaLengkap: data.name || "",
          nip: data.nip || "",
          perangkatDaerah: data.unitKerja || "",
          golongan: data.golongan || "",
          tmtGolongan: data.tmtGolongan ? new Date(data.tmtGolongan).toISOString().split('T')[0] : "",
          jabatan: data.jabatan || "",
          jenisJabatan: data.jenisJabatan || "",
          email: data.email || "",
          telepon: data.phone || "",
          alamat: data.address || "",
          wilayah: data.wilayah || "",
        })
        
        if (data.profilePictureUrl) {
          setProfileImage(data.profilePictureUrl)
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch profile")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil data profil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File terlalu besar",
          description: "Ukuran file maksimal 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
        toast({
          title: "Foto berhasil diupload! 📸",
          description: "Foto profil telah diperbarui",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      // Validate data
      if (!profileData.namaLengkap.trim()) {
        toast({
          title: "Nama tidak boleh kosong",
          description: "Mohon isi nama lengkap Anda.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true);
      
      const updateData = {
        name: profileData.namaLengkap,
        email: profileData.email,
        phone: profileData.telepon,
        address: profileData.alamat,
        jabatan: profileData.jabatan,
        jenisJabatan: profileData.jenisJabatan,
        unitKerja: profileData.perangkatDaerah,
        tmtGolongan: profileData.tmtGolongan,
      }

      const response = await fetch("/api/pegawai/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setIsEditing(false)
        toast({
          title: "Profil berhasil disimpan! ✅",
          description: "Data profil Anda telah diperbarui",
        })
        
        // Update local state with response data
        setProfileData(prev => ({
          ...prev,
          namaLengkap: updatedData.name || prev.namaLengkap,
          email: updatedData.email || prev.email,
          telepon: updatedData.phone || prev.telepon,
          alamat: updatedData.address || prev.alamat,
          jabatan: updatedData.jabatan || prev.jabatan,
          jenisJabatan: updatedData.jenisJabatan || prev.jenisJabatan,
          perangkatDaerah: updatedData.unitKerja || prev.perangkatDaerah,
          pendidikan: updatedData.pendidikan || prev.pendidikan,
          jurusan: updatedData.jurusan || prev.jurusan,
          tahunLulus: updatedData.tahunLulus || prev.tahunLulus,
        }))
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Gagal menyimpan profil",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data if needed
  }

  return (
    <DashboardLayout userType="pegawai" isLoading={isLoading}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-sky-500 to-teal-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <User className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Profil Pegawai</h1>
                <p className="text-sky-100">Kelola informasi profil dan data pribadi Anda</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Pastikan data profil Anda selalu terkini untuk kelancaran proses administrasi
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Foto Profil</CardTitle>
                <CardDescription className="text-center">Upload foto 3x4 dengan ukuran maksimal 5MB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="w-32 h-40 rounded-lg">
                      <AvatarImage src={profileImage || undefined} className="object-cover" />
                      <AvatarFallback className="w-32 h-40 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <User className="h-16 w-16 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-2 right-2">
                      <input
                        type="file"
                        id="profile-image"
                        className="hidden"
                        accept="image/*"
                        aria-label="Upload foto profil"
                        onChange={handleImageUpload}
                      />
                      <Button
                        size="sm"
                        className="rounded-full w-8 h-8 p-0"
                        onClick={() => document.getElementById("profile-image")?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{profileData.namaLengkap}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">NIP: {profileData.nip}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.perangkatDaerah}</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800 dark:text-green-200 font-medium">Profil Terverifikasi</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Data Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Data Profil</CardTitle>
                    <CardDescription>Informasi lengkap data pegawai</CardDescription>
                  </div>
                  <div className="space-x-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={handleCancel}>
                          Batal
                        </Button>
                        <Button onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Simpan
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profil
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Informasi Pribadi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                      <Input
                        id="namaLengkap"
                        value={profileData.namaLengkap}
                        onChange={(e) => setProfileData({ ...profileData, namaLengkap: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nip">NIP</Label>
                      <Input id="nip" value={profileData.nip} disabled={true} className="bg-gray-50 dark:bg-gray-800" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telepon">Telepon</Label>
                      <Input
                        id="telepon"
                        value={profileData.telepon}
                        onChange={(e) => setProfileData({ ...profileData, telepon: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="alamat">Alamat</Label>
                      <Input
                        id="alamat"
                        value={profileData.alamat}
                        onChange={(e) => setProfileData({ ...profileData, alamat: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">
                    Informasi Kepegawaian
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="perangkatDaerah">Unit Kerja (Sekolah)</Label>
                      <Input
                        id="perangkatDaerah"
                        placeholder="Masukkan nama unit kerja/sekolah"
                        value={profileData.perangkatDaerah}
                        onChange={(e) => setProfileData({ ...profileData, perangkatDaerah: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="golongan">Golongan</Label>
                      <Input
                        id="golongan"
                        value={profileData.golongan}
                        disabled={true} // Changed from !isEditing to always true
                        className="bg-gray-100 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500">
                        Golongan diperbarui secara otomatis setelah kenaikan pangkat disetujui.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tmtGolongan">TMT Golongan</Label>
                      <Input
                        id="tmtGolongan"
                        type="date"
                        value={profileData.tmtGolongan}
                        onChange={(e) => setProfileData({ ...profileData, tmtGolongan: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jabatan">Jabatan</Label>
                      <Input
                        id="jabatan"
                        value={profileData.jabatan}
                        onChange={(e) => setProfileData({ ...profileData, jabatan: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jabatan">Jabatan</Label>
                      <Input
                        id="jabatan"
                        value={profileData.jabatan}
                        onChange={(e) => setProfileData({ ...profileData, jabatan: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jenisJabatan">Jenis Jabatan</Label>
                      <Select
                        value={profileData.jenisJabatan}
                        onValueChange={(value) => setProfileData({ ...profileData, jenisJabatan: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pelaksana">Pelaksana</SelectItem>
                          <SelectItem value="Struktural">Struktural</SelectItem>
                          <SelectItem value="Fungsional">Fungsional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Education Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Informasi Pendidikan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pendidikan">Pendidikan Terakhir</Label>
                      <Select
                        value={profileData.pendidikan}
                        onValueChange={(value) => setProfileData({ ...profileData, pendidikan: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SD">SD</SelectItem>
                          <SelectItem value="SMP">SMP</SelectItem>
                          <SelectItem value="SMA/K">SMA/K</SelectItem>
                          <SelectItem value="D1">D1</SelectItem>
                          <SelectItem value="D2">D2</SelectItem>
                          <SelectItem value="D3">D3</SelectItem>
                          <SelectItem value="D4/S1">D4/S1</SelectItem>
                          <SelectItem value="S2">S2</SelectItem>
                          <SelectItem value="S3">S3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jurusan">Jurusan</Label>
                      <Input
                        id="jurusan"
                        value={profileData.jurusan}
                        onChange={(e) => setProfileData({ ...profileData, jurusan: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tahunLulus">Tahun Lulus</Label>
                      <Input
                        id="tahunLulus"
                        value={profileData.tahunLulus}
                        onChange={(e) => setProfileData({ ...profileData, tahunLulus: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Information Note */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Informasi Penting</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Data profil yang akurat sangat penting untuk proses kenaikan pangkat. Pastikan semua informasi
                        yang Anda masukkan benar dan sesuai dengan dokumen resmi.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
