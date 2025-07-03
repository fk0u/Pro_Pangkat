"use client"

import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { FileText, User, Upload, Trash2, CheckCircle, Info, Search, AlertCircle, XCircle } from "lucide-react"
import { useState, useEffect } from "react"

type DocumentRequirement = {
  id: string
  name: string
  required: boolean
  hasSimASN: boolean
  description: string
}

export default function InputUsulanPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const editProposalId = searchParams.get('edit')
  const [activeTab, setActiveTab] = useState("detail-pegawai")
  const [isDetailComplete, setIsDetailComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [existingProposal, setExistingProposal] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    unitKerja: "",
    unitKerjaId: "", // Tetap ada untuk kompatibilitas backend
    golongan: "",
    tmtGolongan: "",
    tmtPangkat: "", // Tambah field TMT Pangkat
    jabatan: "",
    jenisJabatan: "",
    tahunLulus: "",
    nomorSurat: "",
    tanggalSurat: "",
    periode: "", // Add periode field
  })
  
  // Add state for unit kerja options (removed - using text input instead)
  // const [unitKerjaOptions, setUnitKerjaOptions] = useState<{id: string, nama: string, jenjang?: string, npsn?: string}[]>([])

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any>>({})
  const [requiredDocuments, setRequiredDocuments] = useState<DocumentRequirement[]>([])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUserData(data.data)
        
        // Get the user's unitKerjaId if it exists, or match by name
        let userUnitKerjaId = data.data.user.unitKerjaId || "";
        
        // If there's no unitKerjaId but there is a unitKerja name, try to find a match
        if (!userUnitKerjaId && data.data.user.unitKerja && unitKerjaOptions.length > 0) {
          const matchedUnitKerja = unitKerjaOptions.find(
            uk => uk.nama.toLowerCase() === data.data.user.unitKerja.toLowerCase()
          );
          if (matchedUnitKerja) {
            userUnitKerjaId = matchedUnitKerja.id;
          }
        }
        
        // Auto-fill form with user data
        setFormData({
          nip: data.data.user.nip || "",
          nama: data.data.user.name || "",
          unitKerja: data.data.user.unitKerja || "",
          unitKerjaId: userUnitKerjaId,
          golongan: data.data.user.golongan || "",
          tmtGolongan: data.data.user.tmtGolongan ? new Date(data.data.user.tmtGolongan).toISOString().split('T')[0] : "",
          jabatan: data.data.user.jabatan || "",
          jenisJabatan: data.data.user.jenisJabatan || "",
          pendidikan: "",
          tahunLulus: "",
          nomorSurat: "",
          tanggalSurat: "",
          periode: formData.periode, // Preserve any existing periode value
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Gagal mengambil data pengguna",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to fetch unit kerja options - TIDAK DIGUNAKAN LAGI
  // const fetchUnitKerjaOptions = async () => { ... }

  useEffect(() => {
    // Hanya fetch data user dan dokumen requirements, TIDAK fetch unit kerja
    const initData = async () => {
      await fetchUserData();
      await fetchDocumentRequirements();
      
      // Check if editing existing proposal
      if (editProposalId) {
        setIsEditMode(true);
        await fetchExistingProposal(editProposalId);
        
        // Show notification for completion
        toast({
          title: "📝 Lengkapi Data dan Dokumen",
          description: "Harap melengkapi data dan berkas dokumen untuk melanjutkan proses pengajuan usulan kenaikan pangkat.",
          duration: 5000,
        });
      }
    };
    
    initData();
  }, [editProposalId, toast])

  const fetchExistingProposal = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/pegawai/proposals/${proposalId}`)
      if (response.ok) {
        const proposal = await response.json()
        setExistingProposal(proposal)
        
        // Get the unit kerja ID if it exists or try to match by name
        let proposalUnitKerjaId = proposal.pegawai?.unitKerjaId || "";
        
        // If no ID but there is a name, try to find a match
        if (!proposalUnitKerjaId && proposal.pegawai?.unitKerja && unitKerjaOptions.length > 0) {
          const matchedUnitKerja = unitKerjaOptions.find(
            uk => uk.nama.toLowerCase() === proposal.pegawai.unitKerja.toLowerCase()
          );
          if (matchedUnitKerja) {
            proposalUnitKerjaId = matchedUnitKerja.id;
          } else {
            // If no match is found, set to custom
            proposalUnitKerjaId = "custom";
          }
        }
        
        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          periode: proposal.periode || "",
          // Prefill with user data or existing proposal data
          nip: proposal.pegawai?.nip || userData?.user?.nip || "",
          nama: proposal.pegawai?.name || userData?.user?.name || "",
          unitKerja: proposal.pegawai?.unitKerja || userData?.user?.unitKerja || "",
          unitKerjaId: proposalUnitKerjaId,
          golongan: proposal.pegawai?.golongan || userData?.user?.golongan || "",
          jabatan: proposal.pegawai?.jabatan || userData?.user?.jabatan || "",
          jenisJabatan: userData?.user?.jenisJabatan || "",
        }))
        
        // Load existing documents
        if (proposal.documents && proposal.documents.length > 0) {
          const documentsMap: Record<string, any> = {}
          proposal.documents.forEach((doc: any) => {
            documentsMap[doc.documentRequirement.code] = {
              file: null,
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
              status: doc.status,
              notes: doc.notes,
              uploadedAt: doc.uploadedAt
            }
          })
          setUploadedFiles(documentsMap)
        }
      } else {
        toast({
          title: "❌ Gagal Memuat Data",
          description: "Tidak dapat memuat data usulan yang akan diedit.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching existing proposal:", error)
      toast({
        title: "❌ Terjadi Kesalahan",
        description: "Gagal memuat data usulan.",
        variant: "destructive"
      })
    }
  }

  const fetchDocumentRequirements = async () => {
    try {
      const response = await fetch("/api/document-requirements")
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match frontend interface
        const transformedData = (data.data.requirements || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          required: doc.isRequired,
          hasSimASN: doc.hasSimASN,
          description: doc.description
        }))
        setRequiredDocuments(transformedData)
      } else {
        throw new Error('API response not ok')
      }
    } catch (error) {
      console.error("Error fetching document requirements:", error)
      // Fallback to mock data if API fails
      const mockDocs: DocumentRequirement[] = [
        {
          id: "surat-pengantar",
          name: "Surat Pengantar Usulan",
          required: true,
          hasSimASN: false,
          description: "Surat pengantar dari Unit Kerja untuk usulan kenaikan pangkat",
        },
        {
          id: "surat-bebas-hukuman",
          name: "Surat Pernyataan Bebas Hukuman Disiplin",
          required: true,
          hasSimASN: false,
          description: "Surat pernyataan bahwa pegawai bebas dari hukuman disiplin",
        },
        {
          id: "surat-kebenaran-dokumen",
          name: "Surat Pernyataan Kebenaran Dokumen",
          required: true,
          hasSimASN: false,
          description: "Surat pernyataan kebenaran semua dokumen yang diupload",
        },
        {
          id: "sk-kenaikan-terakhir",
          name: "SK Kenaikan Pangkat Terakhir",
          required: true,
          hasSimASN: true,
          description: "SK kenaikan pangkat yang terakhir diterima",
        },
        {
          id: "penilaian-kinerja-1",
          name: "Penilaian Kinerja Pegawai 1 (satu) tahun terakhir",
          required: true,
          hasSimASN: true,
          description: "Penilaian kinerja pegawai untuk 1 tahun terakhir",
        },
        {
          id: "penilaian-kinerja-2",
          name: "Penilaian Kinerja Pegawai 2 (dua) tahun terakhir",
          required: true,
          hasSimASN: true,
          description: "Penilaian kinerja pegawai untuk 2 tahun terakhir",
        },
        {
          id: "sk-pns",
          name: "SK PNS",
          required: true,
          hasSimASN: true,
          description: "Bagi yang baru pertama kali diusulkan kenaikan pangkat",
        },
        {
          id: "sk-cpns",
          name: "SK CPNS",
          required: true,
          hasSimASN: true,
          description: "Bagi yang baru pertama kali diusulkan kenaikan pangkat",
        },
      ]
      setRequiredDocuments(mockDocs)
    }
  }

  const handleImportData = async () => {
    if (!formData.nip || formData.nip.length !== 18) {
      toast({
        title: "NIP tidak valid",
        description: "Masukkan NIP 18 digit untuk import data",
        variant: "destructive",
      })
      return
    }

    toast({ title: "Mengimpor data...", description: "Sedang mengambil data dari sistem" })
    
    try {
      const response = await fetch(`/api/auth/me`)
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.user) {
          // Get the user's unitKerjaId if it exists, or match by name
          let userUnitKerjaId = data.data.user.unitKerjaId || "";
          
          // If there's no unitKerjaId but there is a unitKerja name, try to find a match
          if (!userUnitKerjaId && data.data.user.unitKerja && unitKerjaOptions.length > 0) {
            const matchedUnitKerja = unitKerjaOptions.find(
              uk => uk.nama.toLowerCase() === data.data.user.unitKerja.toLowerCase()
            );
            if (matchedUnitKerja) {
              userUnitKerjaId = matchedUnitKerja.id;
            }
          }
          
          setFormData({
            ...formData,
            nama: data.data.user.name || "",
            unitKerja: data.data.user.unitKerja || "",
            unitKerjaId: userUnitKerjaId,
            golongan: data.data.user.golongan || "",
            tmtGolongan: data.data.user.tmtGolongan ? new Date(data.data.user.tmtGolongan).toISOString().split('T')[0] : "",
            jabatan: data.data.user.jabatan || "",
            jenisJabatan: data.data.user.jenisJabatan || "",
          })
          toast({ title: "Data berhasil diimpor! 🎉", description: "Data pegawai telah diisi otomatis dari sistem" })
        }
      } else {
        throw new Error("Failed to fetch user data")
      }
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        title: "Gagal mengimpor data",
        description: "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      })
    }
  }

  const handleSaveDetail = () => {
    const isComplete = Object.values(formData).every((value) => value !== "")
    if (isComplete) {
      setIsDetailComplete(true)
      setActiveTab("kelengkapan-berkas")
      toast({
        title: "Detail pegawai tersimpan! ✅",
        description: "Anda dapat melanjutkan ke upload kelengkapan berkas",
      })
    } else {
      toast({
        title: "Data belum lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (docId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast({
        title: "Ukuran file melebihi batas",
        description: "Ukuran file maksimal adalah 5MB.",
        variant: "destructive",
      })
      return
    }

    if (!editProposalId && !isEditMode) {
      // Local storage only if not in edit mode
      setUploadedFiles((prev) => ({
        ...prev,
        [docId]: { file, name: file.name, size: file.size, uploadDate: new Date(), status: "uploaded" },
      }))
      toast({ title: "File berhasil diupload! 📁", description: `${file.name} telah diupload` })
      return
    }

    // If in edit mode, upload to server directly
    try {
      toast({ 
        title: "Mengupload dokumen...", 
        description: "Harap tunggu sebentar" 
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentRequirementId', docId)

      const response = await fetch(`/api/pegawai/proposals/${editProposalId}/documents`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setUploadedFiles((prev) => ({
          ...prev,
          [docId]: { 
            file, 
            name: file.name, 
            size: file.size, 
            uploadDate: new Date(), 
            status: "MENUNGGU_VERIFIKASI",
            fileUrl: result.fileUrl
          },
        }))
        toast({ 
          title: "Dokumen berhasil diupload! ✅", 
          description: `${file.name} telah diunggah dan menunggu verifikasi` 
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Gagal mengupload dokumen')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        title: "Gagal mengupload dokumen",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengupload dokumen",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFile = (docId: string) => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev }
      delete newFiles[docId]
      return newFiles
    })
    toast({ title: "File dihapus", description: "File telah dihapus dari sistem" })
  }

  const handleSubmitProposal = async () => {
    // Check if periode is filled when in edit mode
    if (isEditMode && !formData.periode.trim()) {
      toast({
        title: "Periode Harus Diisi",
        description: "Mohon isi periode usulan terlebih dahulu.",
        variant: "destructive",
      })
      return
    }

    const allRequiredUploaded = requiredDocuments.filter((doc) => doc.required).every((doc) => uploadedFiles[doc.id])

    if (!allRequiredUploaded) {
      toast({
        title: "Dokumen Wajib Belum Lengkap",
        description: "Mohon upload semua dokumen yang wajib diisi.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: isEditMode ? "Memperbarui Usulan..." : "Mengajukan Dokumen...",
      description: "Harap tunggu sebentar.",
    })

    try {
      if (isEditMode && existingProposal) {
        // Update existing proposal
        const updateData = {
          periode: formData.periode,
          notes: `Usulan kenaikan pangkat untuk periode ${formData.periode}. Dilengkapi oleh ${formData.nama} (${formData.nip})`,
        }

        const response = await fetch(`/api/pegawai/proposals/${existingProposal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Gagal memperbarui usulan');
        }

        // Upload documents if any
        const documentsToUpload = Object.entries(uploadedFiles)
          .filter(([_, fileData]) => fileData.file && !fileData.fileUrl);

        for (const [docId, fileData] of documentsToUpload) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('documentRequirementId', docId);

          const uploadResponse = await fetch(`/api/pegawai/proposals/${existingProposal.id}/documents`, {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || 'Gagal mengupload dokumen');
          }
        }

        // Submit the proposal
        const submitResponse = await fetch(`/api/pegawai/proposals/${existingProposal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'submit',
            notes: 'Usulan dilengkapi dan diajukan oleh pegawai'
          }),
        })

        if (submitResponse.ok) {
          toast({
            title: "Usulan Berhasil Diajukan! ✅",
            description: "Usulan Anda telah berhasil dilengkapi dan diajukan untuk verifikasi.",
          })
          setTimeout(() => {
            window.location.href = '/pegawai/riwayat-usulan'
          }, 2000)
        } else {
          const errorData = await submitResponse.json();
          throw new Error(errorData.message || 'Gagal mengajukan usulan');
        }
      } else {
        // Create new proposal
        const proposalData = {
          periode: formData.periode || "Agustus 2025",
          notes: `Usulan kenaikan pangkat untuk periode ${formData.periode || "Agustus 2025"}. Pengajuan oleh ${formData.nama} (${formData.nip})`,
          formData,
        }

        const response = await fetch('/api/pegawai/proposals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proposalData),
        })

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Gagal membuat usulan baru');
        }

        const result = await response.json()
        const proposalId = result.id;

        // Upload documents
        for (const [docId, fileData] of Object.entries(uploadedFiles)) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('documentRequirementId', docId);

          const uploadResponse = await fetch(`/api/pegawai/proposals/${proposalId}/documents`, {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || 'Gagal mengupload dokumen');
          }
        }

        // Submit the proposal
        const submitResponse = await fetch(`/api/pegawai/proposals/${proposalId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'submit',
            notes: 'Usulan diajukan oleh pegawai'
          }),
        })

        if (submitResponse.ok) {
          toast({
            title: "Pengajuan Berhasil! ✅",
            description: "Dokumen Anda telah berhasil diajukan dan akan segera diverifikasi.",
          })
          setTimeout(() => {
            window.location.href = '/pegawai/riwayat-usulan'
          }, 2000)
        } else {
          const errorData = await submitResponse.json();
          throw new Error(errorData.message || 'Gagal mengajukan usulan');
        }
      }
    } catch (error) {
      console.error("Error submitting proposal:", error)
      toast({
        title: "Gagal mengajukan dokumen",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengajukan dokumen. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout userType="pegawai" isLoading={isLoading}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-sky-500 to-teal-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Input Usulan Pengajuan</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Lengkapi detail pegawai, kemudian upload semua dokumen yang diperlukan. Semua field wajib diisi.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Form Pengajuan Kenaikan Pangkat</CardTitle>
              <CardDescription>Isi data pegawai dan upload dokumen kelengkapan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="detail-pegawai" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Detail Pegawai</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="kelengkapan-berkas"
                    disabled={!isDetailComplete}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Kelengkapan Berkas</span>
                    {!isDetailComplete && (
                      <Badge variant="secondary" className="ml-2">
                        Terkunci
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="detail-pegawai" className="space-y-6 pt-6">
                  {/* Edit Mode Alert */}
                  {isEditMode && existingProposal && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-blue-800 dark:text-blue-200">
                            Mode Edit Usulan
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Anda sedang melengkapi usulan yang dibuat oleh operator sekolah.
                            Silakan lengkapi semua data dan dokumen yang diperlukan.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Periode Field - First field when editing */}
                    {isEditMode && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="periode">Periode Usulan *</Label>
                        <Input
                          id="periode"
                          placeholder="Contoh: 2024"
                          value={formData.periode}
                          onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                          required
                          className={!formData.periode ? "border-orange-300 focus:border-orange-500" : ""}
                        />
                        {!formData.periode && (
                          <p className="text-sm text-orange-600">
                            Periode usulan perlu diisi untuk melanjutkan proses
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="nip">NIP Pegawai *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="nip"
                          placeholder="Masukkan NIP 18 digit"
                          value={formData.nip}
                          onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                          maxLength={18}
                          required
                          disabled={isEditMode} // Disable when editing
                        />
                        {!isEditMode && (
                          <Button onClick={handleImportData} variant="outline">
                            <Search className="h-4 w-4 mr-2" />
                            Import
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nama">Nama Pegawai *</Label>
                      <Input
                        id="nama"
                        placeholder="Nama lengkap pegawai"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitKerja">Unit Kerja (Sekolah) *</Label>
                      <Input
                        id="unitKerja"
                        placeholder="Masukkan nama unit kerja/sekolah"
                        value={formData.unitKerja}
                        onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="golongan">Golongan Saat Ini *</Label>
                      <Input
                        id="golongan"
                        value={formData.golongan}
                        disabled
                        className="bg-gray-100 dark:bg-gray-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tmtGolongan">TMT Golongan *</Label>
                      <Input
                        id="tmtGolongan"
                        type="date"
                        value={formData.tmtGolongan}
                        onChange={(e) => setFormData({ ...formData, tmtGolongan: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tmtPangkat">TMT Pangkat *</Label>
                      <Input
                        id="tmtPangkat"
                        type="date"
                        value={formData.tmtPangkat}
                        onChange={(e) => setFormData({ ...formData, tmtPangkat: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jabatan">Jabatan *</Label>
                      <Input
                        id="jabatan"
                        placeholder="Jabatan saat ini"
                        value={formData.jabatan}
                        onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jenisJabatan">Jenis Jabatan *</Label>
                      <Select
                        value={formData.jenisJabatan}
                        onValueChange={(value) => setFormData({ ...formData, jenisJabatan: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pelaksana">Pelaksana</SelectItem>
                          <SelectItem value="Struktural">Struktural</SelectItem>
                          <SelectItem value="Fungsional">Fungsional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tahunLulus">Tahun Lulus</Label>
                      <Input
                        id="tahunLulus"
                        placeholder="Tahun lulus pendidikan terakhir"
                        value={formData.tahunLulus}
                        onChange={(e) => setFormData({ ...formData, tahunLulus: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomorSurat">Nomor Surat Pengantar *</Label>
                      <Input
                        id="nomorSurat"
                        placeholder="Nomor surat pengantar dari unit kerja"
                        value={formData.nomorSurat}
                        onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tanggalSurat">Tanggal Surat Pengantar *</Label>
                      <Input
                        id="tanggalSurat"
                        type="date"
                        value={formData.tanggalSurat}
                        onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveDetail} className="bg-gradient-to-r from-sky-500 to-teal-500">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Simpan & Lanjutkan
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="kelengkapan-berkas" className="space-y-6 pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="p-3 text-left font-medium">Nama Dokumen</th>
                          <th className="p-3 text-left font-medium">Status</th>
                          <th className="p-3 text-left font-medium">File</th>
                          <th className="p-3 text-center font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requiredDocuments.map((doc) => {
                          const uploadedFile = uploadedFiles[doc.id]
                          return (
                            <tr key={doc.id} className="border-b dark:border-gray-700">
                              <td className="p-3">
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{doc.description}</p>
                              </td>
                              <td className="p-3">
                                <Badge variant="destructive">Wajib</Badge>
                              </td>
                              <td className="p-3">
                                {uploadedFile ? (
                                  <div className="text-xs">
                                    <p className="font-medium text-green-600">{uploadedFile.name}</p>
                                    <p className="text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">Belum diupload</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <input
                                    type="file"
                                    id={`file-${doc.id}`}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    aria-label={`Upload file untuk ${doc.name}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleFileUpload(doc.id, file)
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                                  >
                                    <Upload className="h-3 w-3" />
                                  </Button>
                                  {uploadedFile && (
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteFile(doc.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setActiveTab("detail-pegawai")}>
                      Kembali
                    </Button>
                    <div className="flex space-x-2">
                      {isEditMode && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                              <XCircle className="h-4 w-4 mr-2" />
                              Batal Ajukan Usulan
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Batalkan Usulan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin membatalkan usulan kenaikan pangkat ini? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Tidak</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  if (!existingProposal) return
                                  try {
                                    const response = await fetch(`/api/pegawai/proposals/${existingProposal.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        action: "withdraw",
                                        notes: "Usulan dibatalkan oleh pegawai"
                                      })
                                    })
                                    if (response.ok) {
                                      toast({
                                        title: "✅ Usulan Berhasil Dibatalkan",
                                        description: "Usulan kenaikan pangkat telah dibatalkan.",
                                      })
                                      window.location.href = '/pegawai/dashboard'
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "❌ Gagal Membatalkan Usulan",
                                      description: "Terjadi kesalahan saat membatalkan usulan.",
                                      variant: "destructive"
                                    })
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Ya, Batalkan
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      <Button onClick={handleSubmitProposal} className="bg-gradient-to-r from-sky-500 to-teal-500">
                        <FileText className="h-4 w-4 mr-2" />
                        {isEditMode ? "Lengkapi & Ajukan Usulan" : "Ajukan Dokumen"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
