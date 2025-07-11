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
import { User, Edit, Save, Camera, CheckCircle, AlertCircle, Lock, Eye, EyeOff } from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Helper function to safely get string values from potentially complex objects
const safeGetString = (value: unknown): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null) {
    // If it's an object, try to get the 'nama' property, or stringify if that fails
    // @ts-expect-error - We're checking for property existence in a generic object
    return value.nama || value.name || ""
  }
  return String(value)
}

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
    tmtJabatan: "",
    jabatan: "",
    jenisJabatan: "",
    email: "",
    telepon: "",
    alamat: "",
    wilayah: "",
  })
  
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  })
  
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  })
  
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  useEffect(() => {
    fetchProfileData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/pegawai/profile")
      
      if (response.ok) {
        const data = await response.json()
        console.log('Profile API Response:', data) // Debug log
        
        // Process TMT Jabatan field
        let formattedTmtJabatan = "";
        try {
          if (data.tmtJabatan) {
            formattedTmtJabatan = new Date(data.tmtJabatan).toISOString().split('T')[0];
          }
        } catch (error) {
          console.error("Error formatting tmtJabatan:", error);
        }
        
        setProfileData({
          namaLengkap: safeGetString(data.name),
          nip: safeGetString(data.nip),
          perangkatDaerah: safeGetString(data.unitKerja),
          golongan: safeGetString(data.golongan),
          tmtJabatan: formattedTmtJabatan,
          jabatan: safeGetString(data.jabatan),
          jenisJabatan: safeGetString(data.jenisJabatan),
          email: safeGetString(data.email),
          telepon: safeGetString(data.phone),
          alamat: safeGetString(data.address),
          wilayah: safeGetString(data.wilayah),
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

      // Validate TMT Jabatan format (YYYY-MM-DD)
      if (profileData.tmtJabatan) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(profileData.tmtJabatan)) {
          toast({
            title: "Format TMT Jabatan tidak valid",
            description: "Gunakan format Tahun-Bulan-Tanggal (YYYY-MM-DD)",
            variant: "destructive",
          })
          return
        }
      }

      setIsLoading(true);
      
      // Siapkan data untuk dikirim ke API
      const updateData = {
        name: profileData.namaLengkap,
        email: profileData.email || "",
        phone: profileData.telepon || "",
        address: profileData.alamat || "",
        jabatan: profileData.jabatan || "",
        jenisJabatan: profileData.jenisJabatan || "",
        unitKerja: profileData.perangkatDaerah || "", // Backend akan menghandle ini dengan benar
        tmtJabatan: profileData.tmtJabatan || null, // Allow null if empty
      }

      // Filter out null or undefined values to prevent API errors
      const cleanedUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== null && value !== undefined)
      );

      console.log("Sending profile update:", cleanedUpdateData); // Debug log to see what's being sent

      const response = await fetch("/api/pegawai/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedUpdateData),
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
          namaLengkap: safeGetString(updatedData.name),
          email: safeGetString(updatedData.email),
          telepon: safeGetString(updatedData.phone),
          alamat: safeGetString(updatedData.address),
          jabatan: safeGetString(updatedData.jabatan),
          jenisJabatan: safeGetString(updatedData.jenisJabatan),
          perangkatDaerah: safeGetString(updatedData.unitKerja),
          tmtJabatan: updatedData.tmtJabatan ? new Date(updatedData.tmtJabatan).toISOString().split('T')[0] : "",
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

  const handleChangePassword = async () => {
    // Reset errors
    setPasswordErrors({});
    
    // Validate passwords
    const errors: {
      newPassword?: string;
      confirmPassword?: string;
      general?: string;
    } = {};
    
    if (!passwordData.newPassword) {
      errors.newPassword = "Password baru wajib diisi";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password minimal 8 karakter";
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Password tidak cocok";
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (data.errors) {
          setPasswordErrors(data.errors);
        } else {
          setPasswordErrors({
            general: data.message || "Gagal mengubah password"
          });
        }
        return;
      }
      
      // Success - close dialog and reset form
      setChangePasswordOpen(false);
      
      // Reset form data
      setPasswordData({ 
        newPassword: "", 
        confirmPassword: "" 
      });
      
      // Reset password visibility
      setShowPassword({ 
        newPassword: false, 
        confirmPassword: false 
      });
      
      // Show success toast
      toast({
        title: "Password berhasil diubah ✅",
        description: "Password Anda telah berhasil diperbarui",
      });
    } catch (error) {
      setPasswordErrors({
        general: error instanceof Error ? error.message : "Terjadi kesalahan saat mengubah password"
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <DashboardLayout userType="pegawai">
      <div className={`space-y-6 ${isLoading ? "opacity-70 pointer-events-none" : ""}`}>
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telepon">Telepon</Label>
                      <Input
                        id="telepon"
                        value={profileData.telepon}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, telepon: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="alamat">Alamat</Label>
                      <Input
                        id="alamat"
                        value={profileData.alamat}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData({ ...profileData, alamat: e.target.value })}
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
                      <Label htmlFor="tmtJabatan">TMT Jabatan</Label>
                      <Input
                        id="tmtJabatan"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={profileData.tmtJabatan}
                        onChange={(e) => setProfileData({ ...profileData, tmtJabatan: e.target.value })}
                        disabled={!isEditing}
                      />
                      <p className="text-xs text-gray-500">
                        Format: Tahun-Bulan-Tanggal (contoh: 2025-07-04)
                      </p>
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

        {/* Account Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold flex items-center">
                <Lock className="h-6 w-6 mr-2 text-primary" />
                Pengaturan Akun
              </CardTitle>
              <CardDescription>
                Kelola keamanan akun dan ubah password Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div>
                <h3 className="text-lg font-medium mb-2">Ubah Password</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pastikan password Anda kuat dan tidak mudah ditebak
                </p>
                
                <Dialog open={changePasswordOpen} onOpenChange={(open) => {
                  setChangePasswordOpen(open);
                  if (!open) {
                    // Reset form when dialog is closed
                    setPasswordData({ newPassword: "", confirmPassword: "" });
                    setShowPassword({ newPassword: false, confirmPassword: false });
                    setPasswordErrors({});
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Ubah Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Ubah Password</DialogTitle>
                      <DialogDescription>
                        Masukkan password baru Anda. Password minimal 8 karakter.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      {passwordErrors.general && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-600 dark:text-red-200 text-sm">
                          {passwordErrors.general}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="dialogNewPassword">Password Baru</Label>
                        <div className="relative">
                          <Input
                            id="dialogNewPassword"
                            type={showPassword.newPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            className={passwordErrors.newPassword ? "border-red-500" : ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword({...showPassword, newPassword: !showPassword.newPassword})}
                          >
                            {showPassword.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dialogConfirmPassword">Konfirmasi Password</Label>
                        <div className="relative">
                          <Input
                            id="dialogConfirmPassword"
                            type={showPassword.confirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword({...showPassword, confirmPassword: !showPassword.confirmPassword})}
                          >
                            {showPassword.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="secondary" 
                        onClick={() => setChangePasswordOpen(false)}
                        disabled={isChangingPassword}
                      >
                        Batal
                      </Button>
                      <Button 
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <span className="mr-2">Menyimpan...</span>
                            <span className="animate-spin">⏳</span>
                          </>
                        ) : (
                          "Simpan Password"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Account Security */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Keamanan Akun</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Jaga kerahasiaan password Anda. Jangan bagikan informasi login kepada orang lain.
                      Ganti password Anda secara berkala untuk menjaga keamanan akun.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
