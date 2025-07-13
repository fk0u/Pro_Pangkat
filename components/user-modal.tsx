"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UnitKerja {
  id: string
  nama: string
}

interface WilayahData {
  id: string
  kode: string
  nama: string
  namaLengkap: string
}

interface UserData {
  id: string
  nip: string
  name: string
  email?: string
  role: string
  unitKerja?: {
    id: string
    nama: string
  }
  unitKerjaId?: string
  wilayahId?: string
  createdAt?: string
  updatedAt?: string
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: "add" | "edit" | "view"
  userId?: string
}

export function UserModal({ isOpen, onClose, onSuccess, mode, userId }: UserModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([])
  const [wilayahList, setWilayahList] = useState<WilayahData[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    nip: "",
    name: "",
    role: "PEGAWAI",
    unitKerjaId: "none",
    wilayahId: "none",
    password: mode === "add" ? "password123" : "", // Default password for new users
  })

  const isOperatorRole = formData.role === "OPERATOR" || formData.role === "OPERATOR_SEKOLAH" || formData.role === "OPERATOR_UNIT_KERJA"

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      } catch {
        console.error("Failed to format date");
        return dateString;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMappings: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
      "ADMIN": { label: "Admin", variant: "destructive" },
      "OPERATOR": { label: "Operator", variant: "secondary" },
      "OPERATOR_SEKOLAH": { label: "Operator Sekolah", variant: "secondary" },
      "OPERATOR_UNIT_KERJA": { label: "Operator Unit Kerja", variant: "secondary" },
      "PEGAWAI": { label: "Pegawai", variant: "default" }
    };

    const roleInfo = roleMappings[role] || { label: role, variant: "outline" };
    
    return (
      <Badge variant={roleInfo.variant}>
        {roleInfo.label}
      </Badge>
    );
  };

  const getUnitKerjaName = () => {
    if (!formData.unitKerjaId || formData.unitKerjaId === "none") return "-";
    const unitKerja = unitKerjaList.find(unit => unit.id === formData.unitKerjaId);
    return unitKerja?.nama || userData?.unitKerja?.nama || "-";
  };

  const getWilayahName = () => {
    if (!formData.wilayahId || formData.wilayahId === "none") return "-";
    const wilayah = wilayahList.find(w => w.id === formData.wilayahId);
    return wilayah?.namaLengkap || "-";
  };

  // Fetch unit kerja and wilayah data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch unit kerja
        const unitKerjaRes = await fetch("/api/admin/unit-kerja-list");
        if (unitKerjaRes.ok) {
          const unitKerjaData = await unitKerjaRes.json();
          if (unitKerjaData.success) {
            setUnitKerjaList(unitKerjaData.data);
          }
        }
        
        // Fetch wilayah
        const wilayahRes = await fetch("/api/admin/wilayah");
        if (wilayahRes.ok) {
          const wilayahData = await wilayahRes.json();
          if (wilayahData.success) {
            setWilayahList(wilayahData.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch reference data:", error);
      }
    };
    
    if (isOpen) {
      fetchReferenceData();
    }
  }, [isOpen]);

  // Fetch user data if in edit or view mode
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch user data");
        }
        
        // Store the complete user data
        setUserData(data.data);
        
        // Update form with user data
        setFormData({
          nip: data.data.nip || "",
          name: data.data.name || "",
          role: data.data.role || "PEGAWAI",
          unitKerjaId: data.data.unitKerjaId || "none",
          wilayahId: data.data.wilayahId || "none",
          password: "", // Don't show password
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data pengguna. Silakan coba lagi.",
          variant: "destructive"
        });
        onClose();
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && (mode === "edit" || mode === "view") && userId) {
      fetchUserData();
    } else if (isOpen && mode === "add") {
      // Reset form for add mode
      setFormData({
        nip: "",
        name: "",
        role: "PEGAWAI",
        unitKerjaId: "none",
        wilayahId: "none",
        password: "password123", // Default password for new users
      });
    }
  }, [isOpen, mode, userId, toast, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when changing selection
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nip?.trim()) {
      newErrors.nip = 'NIP wajib diisi';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }
    if (!formData.role?.trim()) {
      newErrors.role = 'Role wajib diisi';
    }
    
    // Validate operator roles must have wilayah
    if ((formData.role === "OPERATOR" || formData.role === "OPERATOR_SEKOLAH" || formData.role === "OPERATOR_UNIT_KERJA") 
        && (formData.wilayahId === "none")) {
      newErrors.wilayahId = 'Wilayah wajib diisi untuk peran operator';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate the form first
    if (!validateForm()) {
      toast({
        title: "Validasi Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive"
      });
      return;
    }

    // Prepare form data for submission - convert "none" to null
    const submitData = {
      ...formData,
      unitKerjaId: formData.unitKerjaId === "none" ? null : formData.unitKerjaId,
      wilayahId: formData.wilayahId === "none" ? null : formData.wilayahId
    };

    try {
      setSubmitting(true);
      
      const url = mode === "add" 
        ? "/api/admin/users" 
        : `/api/admin/users/${userId}`;
      
      const method = mode === "add" ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submitData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save user");
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to save user");
      }
      
      toast({
        title: "Berhasil",
        description: mode === "add" 
          ? "Pengguna berhasil ditambahkan" 
          : "Data pengguna berhasil diperbarui",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: `Terjadi kesalahan saat menyimpan data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // View mode rendering
  if (mode === "view") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detail Pengguna
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap pengguna sistem
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Memuat data pengguna...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Pengguna */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Pengguna</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">NIP</Label>
                      <p className="font-mono text-sm">{formData.nip || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nama Lengkap</Label>
                      <p className="font-medium">{formData.name || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Peran (Role)</Label>
                    <div className="mt-1">{getRoleBadge(formData.role)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Unit Kerja</Label>
                      <p>{getUnitKerjaName()}</p>
                    </div>
                    {isOperatorRole && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Wilayah</Label>
                        <p>{getWilayahName()}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p>{userData?.email || `${formData.nip}@example.com`}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informasi Tambahan */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Sistem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ID Pengguna</Label>
                    <p className="font-mono text-xs">{userData?.id || '-'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</Label>
                      <p>{userData?.createdAt ? formatDate(userData.createdAt) : '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</Label>
                      <p>{userData?.updatedAt ? formatDate(userData.updatedAt) : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === "add" ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Masukkan data pengguna baru" 
              : "Ubah informasi pengguna"
            }
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Memuat data pengguna...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Utama */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Utama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nip">NIP *</Label>
                  <Input
                    id="nip"
                    name="nip"
                    value={formData.nip}
                    onChange={handleChange}
                    placeholder="Masukkan NIP"
                    className={errors.nip ? 'border-red-500' : ''}
                  />
                  {errors.nip && <p className="text-sm text-red-500">{errors.nip}</p>}
                </div>
                
                <div>
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                
                <div>
                  <Label>Peran (Role) *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange("role", value)}
                  >
                    <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEGAWAI">Pegawai</SelectItem>
                      <SelectItem value="OPERATOR">Operator</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OPERATOR_SEKOLAH">Operator Sekolah</SelectItem>
                      <SelectItem value="OPERATOR_UNIT_KERJA">Operator Unit Kerja</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Data Penempatan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Penempatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isOperatorRole && (
                  <div>
                    <Label>Wilayah *</Label>
                    <Select
                      value={formData.wilayahId}
                      onValueChange={(value) => handleSelectChange("wilayahId", value)}
                    >
                      <SelectTrigger className={errors.wilayahId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih wilayah" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Pilih Wilayah --</SelectItem>
                        {wilayahList.map((wilayah) => (
                          <SelectItem key={wilayah.id} value={wilayah.id}>
                            {wilayah.namaLengkap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.wilayahId && <p className="text-sm text-red-500">{errors.wilayahId}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Wajib diisi untuk peran operator
                    </p>
                  </div>
                )}
                
                <div>
                  <Label>Unit Kerja</Label>
                  <Select
                    value={formData.unitKerjaId}
                    onValueChange={(value) => handleSelectChange("unitKerjaId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Pilih Unit Kerja --</SelectItem>
                      {unitKerjaList.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Data Akun */}
            {mode === "add" && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Data Akun</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="password">Password Default *</Label>
                    <Input
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type="text"
                      placeholder="Masukkan password default"
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Password default akan diberikan pada pengguna baru. Pengguna harus mengubah password saat login pertama.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {mode === "view" ? "Tutup" : "Batal"}
          </Button>
          
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "add" ? "Tambah Pengguna" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}