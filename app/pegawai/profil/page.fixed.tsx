import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, FileText, Info, Loader2, Search, User } from "lucide-react";

import DashboardLayout from "@/components/dashboard-layout";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<{id: string, nama: string, jenjang?: string, npsn?: string}[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({
    name: "",
    email: "",
    nip: "",
    jabatan: "",
    jenisJabatan: "",
    golongan: "",
    tmtGolongan: "",
    pendidikanTerakhir: "",
    unitKerja: "",
    unitKerjaId: "",
    nomor_telepon: "",
    alamat: "",
  });

  const { toast } = useToast();

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUserData(data.data);
        
        // Format tanggal ke YYYY-MM-DD untuk input type="date"
        const tmtGolongan = data.data.user.tmtGolongan 
          ? new Date(data.data.user.tmtGolongan).toISOString().split('T')[0] 
          : "";
        
        setEditableData({
          name: data.data.user.name || "",
          email: data.data.user.email || "",
          nip: data.data.user.nip || "",
          jabatan: data.data.user.jabatan || "",
          jenisJabatan: data.data.user.jenisJabatan || "",
          golongan: data.data.user.golongan || "",
          tmtGolongan,
          pendidikanTerakhir: data.data.user.pendidikanTerakhir || "",
          unitKerja: data.data.user.unitKerja || "",
          unitKerjaId: data.data.user.unitKerjaId || "",
          nomor_telepon: data.data.user.nomor_telepon || "",
          alamat: data.data.user.alamat || "",
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal mengambil data pengguna",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data pengguna",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch unit kerja options - only when requested
  const fetchUnitKerjaOptions = async () => {
    try {
      // Set loading indicator
      setIsLoading(true);
      
      // Fetch without cache to ensure real-time data
      const response = await fetch("/api/unit-kerja?minimal=true", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUnitKerjaOptions(data.data);
          
          toast({
            title: "Data Unit Kerja",
            description: `Berhasil mengambil ${data.data.length} data unit kerja`,
            duration: 3000,
          });
          
          return data.data;
        }
      } else {
        throw new Error("Gagal mengambil data unit kerja");
      }
    } catch (error) {
      console.error("Error fetching unit kerja options:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data unit kerja. Silakan coba lagi.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile data
  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);

      // Basic validation
      if (!editableData.name || !editableData.email || !editableData.nip) {
        toast({
          title: "Error",
          description: "Nama, email, dan NIP tidak boleh kosong",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editableData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Sukses",
            description: "Profil berhasil diperbarui",
          });
          
          // Show success message and refresh user data
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
          
          // Refresh user data
          await fetchUserData();
          
          // Exit edit mode
          setIsEditing(false);
        } else {
          throw new Error(result.message || "Gagal memperbarui profil");
        }
      } else {
        throw new Error("Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui profil",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle input change
  const handleChange = (field: string, value: string) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImportData = async () => {
    try {
      // 1. Ambil data unit kerja
      await fetchUnitKerjaOptions();
      
      // 2. Segarkan data user
      await fetchUserData();
      
      toast({ 
        title: "Data berhasil dimuat", 
        description: "Data unit kerja telah dimuat dan profil disegarkan" 
      });
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        title: "Gagal memuat data",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      });
    }
  };

  // Load initial data
  useEffect(() => {
    fetchUserData();
    // Tidak memanggil fetchUnitKerjaOptions() secara otomatis - akan dipanggil saat tombol Import ditekan
  }, [fetchUserData]);

  if (isLoading && !userData) {
    return (
      <DashboardLayout userType="pegawai">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Memuat data profil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="pegawai">
      <div className="container mx-auto py-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <User className="h-6 w-6" />
                    Profil Pegawai
                  </CardTitle>
                  <CardDescription>Lihat dan edit informasi profil pegawai</CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    Edit Profil
                  </Button>
                )}
              </div>
              
              {showSuccessMessage && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-800 rounded-md p-3 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Profil berhasil diperbarui!</span>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="info">
                    <User className="h-4 w-4 mr-2" />
                    Informasi Pribadi
                  </TabsTrigger>
                  <TabsTrigger value="kerja">
                    <FileText className="h-4 w-4 mr-2" />
                    Informasi Pekerjaan
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input
                        id="name"
                        value={editableData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editableData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nip">NIP</Label>
                      <Input
                        id="nip"
                        value={editableData.nip}
                        onChange={(e) => handleChange("nip", e.target.value)}
                        disabled={!isEditing}
                        maxLength={18}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                      <Input
                        id="nomor_telepon"
                        value={editableData.nomor_telepon}
                        onChange={(e) => handleChange("nomor_telepon", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="alamat">Alamat</Label>
                      <Textarea
                        id="alamat"
                        value={editableData.alamat}
                        onChange={(e) => handleChange("alamat", e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="kerja" className="space-y-6">
                  {!isEditing && unitKerjaOptions.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3 mb-4">
                      <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Data Unit Kerja Belum Dimuat</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Klik tombol "Import Data" untuk memuat data unit kerja terbaru
                        </p>
                        <Button 
                          onClick={handleImportData} 
                          variant="outline" 
                          className="mt-2 bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Import Data
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="jabatan">Jabatan</Label>
                      <Input
                        id="jabatan"
                        value={editableData.jabatan}
                        onChange={(e) => handleChange("jabatan", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jenisJabatan">Jenis Jabatan</Label>
                      <Select
                        value={editableData.jenisJabatan}
                        onValueChange={(value) => handleChange("jenisJabatan", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fungsional">Fungsional</SelectItem>
                          <SelectItem value="Struktural">Struktural</SelectItem>
                          <SelectItem value="Pelaksana">Pelaksana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="golongan">Golongan</Label>
                      <Select
                        value={editableData.golongan}
                        onValueChange={(value) => handleChange("golongan", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih golongan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="I/a">I/a</SelectItem>
                          <SelectItem value="I/b">I/b</SelectItem>
                          <SelectItem value="I/c">I/c</SelectItem>
                          <SelectItem value="I/d">I/d</SelectItem>
                          <SelectItem value="II/a">II/a</SelectItem>
                          <SelectItem value="II/b">II/b</SelectItem>
                          <SelectItem value="II/c">II/c</SelectItem>
                          <SelectItem value="II/d">II/d</SelectItem>
                          <SelectItem value="III/a">III/a</SelectItem>
                          <SelectItem value="III/b">III/b</SelectItem>
                          <SelectItem value="III/c">III/c</SelectItem>
                          <SelectItem value="III/d">III/d</SelectItem>
                          <SelectItem value="IV/a">IV/a</SelectItem>
                          <SelectItem value="IV/b">IV/b</SelectItem>
                          <SelectItem value="IV/c">IV/c</SelectItem>
                          <SelectItem value="IV/d">IV/d</SelectItem>
                          <SelectItem value="IV/e">IV/e</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tmtGolongan">TMT Golongan</Label>
                      <Input
                        id="tmtGolongan"
                        type="date"
                        value={editableData.tmtGolongan}
                        onChange={(e) => handleChange("tmtGolongan", e.target.value)}
                        disabled={!isEditing}
                      />
                      <p className="text-xs text-gray-500">Terhitung Mulai Tanggal Golongan</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pendidikanTerakhir">Pendidikan Terakhir</Label>
                      <Select
                        value={editableData.pendidikanTerakhir}
                        onValueChange={(value) => handleChange("pendidikanTerakhir", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pendidikan terakhir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SD">SD</SelectItem>
                          <SelectItem value="SMP">SMP</SelectItem>
                          <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                          <SelectItem value="D1">D1</SelectItem>
                          <SelectItem value="D2">D2</SelectItem>
                          <SelectItem value="D3">D3</SelectItem>
                          <SelectItem value="D4">D4</SelectItem>
                          <SelectItem value="S1">S1</SelectItem>
                          <SelectItem value="S2">S2</SelectItem>
                          <SelectItem value="S3">S3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="unitKerja">Unit Kerja (Sekolah)</Label>
                      <div className="flex flex-col gap-2">
                        {isEditing ? (
                          <>
                            <Select
                              value={editableData.unitKerjaId || ""}
                              onValueChange={(value) => {
                                // Find the selected unit kerja to get its name
                                const selectedUnitKerja = unitKerjaOptions.find(uk => uk.id === value);
                                handleChange("unitKerjaId", value);
                                
                                if (selectedUnitKerja) {
                                  handleChange("unitKerja", selectedUnitKerja.nama);
                                } else if (value === "custom") {
                                  // For custom input, don't change the unitKerja value
                                } else {
                                  handleChange("unitKerja", "");
                                }
                              }}
                              disabled={unitKerjaOptions.length === 0} // Disable if no data is loaded
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={unitKerjaOptions.length === 0 ? "Import data terlebih dahulu" : "Pilih Unit Kerja"} />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                {unitKerjaOptions.length === 0 ? (
                                  <SelectItem value="need_import">Klik tombol Import terlebih dahulu</SelectItem>
                                ) : (
                                  unitKerjaOptions.slice(0, 100).map(option => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {option.nama} {option.jenjang ? `(${option.jenjang})` : ""}
                                    </SelectItem>
                                  ))
                                )}
                                {unitKerjaOptions.length > 100 && (
                                  <SelectItem value="search_more">
                                    + {unitKerjaOptions.length - 100} unit kerja lainnya, gunakan pencarian
                                  </SelectItem>
                                )}
                                {/* Add a manual input option if unit kerja isn't in the list */}
                                <SelectItem value="custom">Lainnya (Input Manual)</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {/* Show manual input if "custom" is selected */}
                            {editableData.unitKerjaId === "custom" && (
                              <div className="mt-2">
                                <Input
                                  placeholder="Input nama unit kerja"
                                  value={editableData.unitKerja}
                                  onChange={(e) => handleChange("unitKerja", e.target.value)}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-2 px-3 border rounded-md bg-gray-50">
                            {editableData.unitKerja || "Belum diatur"}
                            {editableData.unitKerjaId && editableData.unitKerjaId !== "custom" && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                ID: {editableData.unitKerjaId}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            {isEditing && (
              <CardFooter className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating}>
                  Batal
                </Button>
                <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
