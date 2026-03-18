import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSWRConfig } from 'swr'
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Check, Clock, FilePlus, FileText, HelpCircle, Info, Loader2, Search, Upload, User } from "lucide-react"

import DashboardLayout from "@/components/dashboard-layout"
import ProposalSkeleton from "@/components/proposal-skeleton"

export default function InputUsulanPage() {
  // State for loading
  const [isLoading, setIsLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // State for form data
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    unitKerja: "",
    unitKerjaId: "", // Added unitKerjaId for the combo box
    golongan: "",
    tmtGolongan: "",
    jabatan: "",
    jenisJabatan: "",
    pendidikanTerakhir: "",
    periode: "",
    usulanKe: "1",
    jenisUsulan: "kenaikan_pangkat",
    golonganTujuan: "",
    alasanUsulan: ""
  })

  // State for user data
  const [userData, setUserData] = useState<any>(null)
  const [existingProposal, setExistingProposal] = useState<any>(null)
  const [requiredDocuments, setRequiredDocuments] = useState<{ id: string; title: string; description: string }[]>([])
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<{id: string, nama: string, jenjang?: string, npsn?: string}[]>([])
  const [userUnitKerjaId, setUserUnitKerjaId] = useState("")

  // State for document uploads
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeStep, setActiveStep] = useState(0) // 0: Detail, 1: Dokumen

  // Toast notifications
  const { toast } = useToast()
  const { mutate } = useSWRConfig()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editProposalId = searchParams.get('edit')

  // Function to fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUserData(data.data)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }, [])

  // Function to fetch document requirements
  const fetchDocumentRequirements = async () => {
    try {
      const response = await fetch("/api/pegawai/document-requirements")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.requirements) {
          setRequiredDocuments(data.data.requirements)
          return
        }
      }
      
      // Fallback to mock data if API fails
      const mockDocs = [
        {
          id: "sk_cpns",
          title: "SK CPNS",
          description: "Surat Keputusan CPNS",
        },
        {
          id: "sk_pns",
          title: "SK PNS",
          description: "Surat Keputusan PNS",
        },
        {
          id: "sk_pangkat_terakhir",
          title: "SK Pangkat Terakhir",
          description: "Surat Keputusan Pangkat Terakhir",
        },
        {
          id: "skp_2_tahun",
          title: "SKP 2 Tahun Terakhir",
          description: "Sasaran Kinerja Pegawai 2 tahun terakhir",
        },
        {
          id: "stlud",
          title: "STLUD",
          description: "Surat Tanda Lulus Ujian Dinas",
        },
        {
          id: "ijazah",
          title: "Ijazah dan Transkrip",
          description: "Bagi yang baru pertama kali diusulkan kenaikan pangkat",
        },
      ]
      setRequiredDocuments(mockDocs)
    }
  }

  // Function to fetch unit kerja options - only when explicitly called
  const fetchUnitKerjaOptions = async () => {
    try {
      // Set loading indicator
      setIsLoading(true)
      
      // Clear cache untuk memastikan data realtime
      const response = await fetch("/api/unit-kerja?minimal=true", {
        cache: 'no-store', // Tidak menggunakan cache untuk memastikan data realtime
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Set data unit kerja
          setUnitKerjaOptions(data.data)
          
          toast({
            title: "Data Unit Kerja",
            description: `Berhasil mengambil ${data.data.length} data unit kerja`,
            duration: 3000,
          })
          
          return data.data
        }
      } else {
        throw new Error("Gagal mengambil data unit kerja")
      }
    } catch (error) {
      console.error("Error fetching unit kerja options:", error)
      toast({
        title: "Error",
        description: "Gagal mengambil data unit kerja. Silakan coba lagi.",
        variant: "destructive",
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Inisialisasi data tanpa mengambil unit kerja secara otomatis
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
  }, [editProposalId, toast, fetchUserData, fetchDocumentRequirements, fetchExistingProposal])

  const fetchExistingProposal = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/pegawai/proposals/${proposalId}`)
      if (response.ok) {
        const proposal = await response.json()
        
        if (!proposal || !proposal.pegawai) {
          throw new Error("Proposal tidak ditemukan atau data tidak lengkap")
        }
        
        setExistingProposal(proposal)
        
        // Populate uploads from existing documents
        if (proposal.documents && proposal.documents.length > 0) {
          const documentsMap: Record<string, any> = {}
          proposal.documents.forEach((doc: any) => {
            documentsMap[doc.documentType] = {
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              uploaded: true,
              documentId: doc.id
            }
          })
          
          setUploadedFiles(documentsMap)
        }
        
        // Get unitKerjaId from existing proposal
        let proposalUnitKerjaId = proposal.pegawai?.unitKerjaId || "";
        
        // If there's no unitKerjaId but there is a unitKerja name, try to find a match
        if (!proposalUnitKerjaId && proposal.pegawai?.unitKerja && unitKerjaOptions.length > 0) {
          const matchedUnitKerja = unitKerjaOptions.find(
            uk => uk.nama.toLowerCase() === proposal.pegawai.unitKerja.toLowerCase()
          );
          if (matchedUnitKerja) {
            proposalUnitKerjaId = matchedUnitKerja.id;
          } else {
            // If no match is found, set custom
            proposalUnitKerjaId = "custom";
          }
        }
        
        // Populate form with existing data
        setFormData({
          nip: proposal.pegawai.nip || "",
          nama: proposal.pegawai.nama || "",
          unitKerja: proposal.pegawai.unitKerja || "",
          unitKerjaId: proposalUnitKerjaId,
          golongan: proposal.pegawai.golongan || "",
          tmtGolongan: proposal.pegawai.tmtGolongan ? new Date(proposal.pegawai.tmtGolongan).toISOString().split('T')[0] : "",
          jabatan: proposal.pegawai.jabatan || "",
          jenisJabatan: proposal.pegawai.jenisJabatan || "",
          pendidikanTerakhir: proposal.pegawai.pendidikanTerakhir || "",
          periode: proposal.periode || "",
          usulanKe: proposal.usulanKe?.toString() || "1",
          jenisUsulan: proposal.jenisUsulan || "kenaikan_pangkat",
          golonganTujuan: proposal.golonganTujuan || "",
          alasanUsulan: proposal.alasanUsulan || "",
        })
      } else {
        toast({
          title: "Error",
          description: "Gagal mengambil data usulan",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching proposal:", error)
      toast({
        title: "Error",
        description: "Gagal mengambil data usulan",
        variant: "destructive",
      })
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
    setIsLoading(true)
    
    try {
      // 1. Pertama, ambil data unit kerja (secara realtime)
      console.log("Mengambil data unit kerja...")
      const unitKerjaData = await fetchUnitKerjaOptions()
      
      // 2. Ambil data user berdasarkan session saat ini
      console.log("Mengambil data user...")
      const response = await fetch(`/api/auth/me`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error("Gagal mengambil data pengguna")
      }
      
      const data = await response.json()
      
      if (!data.data || !data.data.user) {
        throw new Error("Data pengguna tidak ditemukan")
      }
      
      // Get the user's unitKerjaId if it exists, or match by name
      let userUnitKerjaId = data.data.user.unitKerjaId || ""
      
      // If there's no unitKerjaId but there is a unitKerja name, try to find a match
      if (!userUnitKerjaId && data.data.user.unitKerja && unitKerjaData && unitKerjaData.length > 0) {
        const matchedUnitKerja = unitKerjaData.find(
          (uk: {nama: string, id: string}) => uk.nama.toLowerCase() === data.data.user.unitKerja.toLowerCase()
        )
        if (matchedUnitKerja) {
          userUnitKerjaId = matchedUnitKerja.id
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
      
      toast({ 
        title: "Data berhasil diimpor! 🎉", 
        description: "Data pegawai telah diisi otomatis dari sistem" 
      })
      
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        title: "Gagal mengimpor data",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDetail = () => {
    const isComplete = Object.values(formData).every((value) => value !== "")
    
    if (isComplete) {
      setActiveStep(1) // Move to document upload
      toast({ title: "Detail tersimpan", description: "Silakan unggah dokumen yang diperlukan" })
    } else {
      toast({
        title: "Data belum lengkap",
        description: "Harap isi semua field yang ditandai dengan *",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Update state with the new file
      setUploadedFiles((prev) => ({
        ...prev,
        [docId]: {
          file,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploaded: false, // Needs to be uploaded
        },
      }))
    }
  }

  const handleFileUpload = async (docId: string) => {
    const fileData = uploadedFiles[docId]
    
    if (!fileData || !fileData.file) {
      toast({
        title: "File tidak ditemukan",
        description: "Pilih file terlebih dahulu",
        variant: "destructive",
      })
      return
    }
    
    // Set loading state for this file
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        uploading: true,
      },
    }))
    
    try {
      const formData = new FormData()
      formData.append('file', fileData.file)
      formData.append('documentType', docId)
      
      if (existingProposal) {
        formData.append('proposalId', existingProposal.id)
      }
      
      const response = await fetch('/api/pegawai/upload-document', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Update state with the uploaded file details
        setUploadedFiles((prev) => ({
          ...prev,
          [docId]: {
            ...prev[docId],
            fileUrl: result.fileUrl,
            documentId: result.documentId,
            uploaded: true,
            uploading: false,
          },
        }))
        
        toast({
          title: "File berhasil diunggah",
          description: `${fileData.fileName} telah diunggah`,
        })
      } else {
        throw new Error(result.message || 'Failed to upload file')
      }
    } catch (error) {
      console.error(`Error uploading file for ${docId}:`, error)
      
      // Reset uploading state
      setUploadedFiles((prev) => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          uploading: false,
          error: true,
        },
      }))
      
      toast({
        title: "Gagal mengunggah file",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    }
  }

  const handleSubmitProposal = async () => {
    // Check if all required files are uploaded
    const allFilesUploaded = requiredDocuments.every(
      doc => uploadedFiles[doc.id]?.uploaded
    )
    
    if (!allFilesUploaded) {
      toast({
        title: "Dokumen belum lengkap",
        description: "Harap unggah semua dokumen yang diperlukan",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Get only the files that need to be uploaded
      const filesToUpload = Object.entries(uploadedFiles)
        .filter(([_, fileData]) => fileData.file && !fileData.fileUrl);
      
      // Upload any remaining files first
      if (filesToUpload.length > 0) {
        toast({
          title: "Mengunggah dokumen",
          description: "Sedang mengunggah dokumen yang belum terunggah",
        })
        
        for (const [docId, _] of filesToUpload) {
          await handleFileUpload(docId)
        }
      }
      
      // Create the proposal data
      const proposalData = {
        ...formData,
        documents: Object.entries(uploadedFiles).map(([docType, fileData]) => ({
          documentType: docType,
          fileUrl: fileData.fileUrl,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
          documentId: fileData.documentId
        }))
      }
      
      // Submit the proposal
      const url = editProposalId 
        ? `/api/pegawai/proposals/${editProposalId}` 
        : '/api/pegawai/proposals'
        
      const method = editProposalId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData),
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Clear form and cache
        mutate('/api/pegawai/proposals')
        
        // Show success toast
        toast({
          title: editProposalId ? "Usulan berhasil diperbarui" : "Usulan berhasil dibuat",
          description: `Usulan telah ${editProposalId ? 'diperbarui' : 'dibuat'} dan menunggu persetujuan`,
        })
        
        // Redirect to list page
        router.push('/pegawai/usulan')
      } else {
        throw new Error(result.message || 'Failed to submit proposal')
      }
    } catch (error) {
      console.error("Error submitting proposal:", error)
      toast({
        title: "Gagal mengirim usulan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && !userData) {
    return (
      <DashboardLayout userType="pegawai">
        <ProposalSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="pegawai">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FilePlus size={24} />
                {isEditMode ? "Edit Usulan Kenaikan Pangkat" : "Input Usulan Kenaikan Pangkat"}
              </CardTitle>
              <CardDescription>
                {isEditMode 
                  ? "Silakan edit data usulan kenaikan pangkat yang sudah dibuat sebelumnya" 
                  : "Silakan input data usulan kenaikan pangkat pegawai"
                }
              </CardDescription>
              
              {isEditMode && existingProposal && (
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                    Status: {existingProposal.status || "Draft"}
                  </Badge>
                  {existingProposal.createdAt && (
                    <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
                      <Clock className="h-3 w-3 mr-1" />
                      Dibuat: {new Date(existingProposal.createdAt).toLocaleDateString('id-ID')}
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="detail" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="detail" className={activeStep === 0 ? "bg-blue-100 text-blue-800" : ""}>
                    <User className="h-4 w-4 mr-2" />
                    Detail Pegawai
                  </TabsTrigger>
                  <TabsTrigger value="dokumen" disabled={activeStep < 1} className={activeStep === 1 ? "bg-blue-100 text-blue-800" : ""}>
                    <FileText className="h-4 w-4 mr-2" />
                    Dokumen Pendukung
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="detail">
                  <div className="space-y-6">
                    {/* Periode usulan */}
                    {!isEditMode && (
                      <div className="space-y-2">
                        <Label htmlFor="periode">Periode Usulan *</Label>
                        <Select 
                          value={formData.periode} 
                          onValueChange={(value) => setFormData({ ...formData, periode: value })}
                          required
                        >
                          <SelectTrigger
                            className={!formData.periode ? "border-orange-300 focus:border-orange-500" : ""}
                          >
                            <SelectValue placeholder="Pilih periode usulan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="periode_1">Periode 1 (Januari-Februari)</SelectItem>
                            <SelectItem value="periode_2">Periode 2 (April-Mei)</SelectItem>
                            <SelectItem value="periode_3">Periode 3 (Juli-Agustus)</SelectItem>
                            <SelectItem value="periode_4">Periode 4 (Oktober-November)</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <div className="flex flex-col gap-2">
                        <Select
                          value={formData.unitKerjaId || ""}
                          onValueChange={(value) => {
                            // Find the selected unit kerja to get its name
                            const selectedUnitKerja = unitKerjaOptions.find(uk => uk.id === value);
                            setFormData({ 
                              ...formData, 
                              unitKerjaId: value,
                              unitKerja: selectedUnitKerja?.nama || formData.unitKerja 
                            })
                          }}
                          required
                          disabled={unitKerjaOptions.length === 0} // Disable saat data belum diimpor
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={unitKerjaOptions.length === 0 ? "Klik tombol Import untuk data" : "Pilih Unit Kerja"} />
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
                        
                        {unitKerjaOptions.length === 0 && (
                          <div className="text-sm text-amber-600 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            <span>Silakan klik tombol "Import" di atas untuk mengambil data unit kerja</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Show manual input if "custom" is selected */}
                      {formData.unitKerjaId === "custom" && (
                        <div className="mt-2">
                          <Input
                            placeholder="Input nama unit kerja"
                            value={formData.unitKerja}
                            onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                            required
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="golongan">Golongan Saat Ini *</Label>
                      <Select 
                        value={formData.golongan} 
                        onValueChange={(value) => setFormData({ ...formData, golongan: value })}
                        required
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
                      <Label htmlFor="tmtGolongan">TMT Golongan *</Label>
                      <Input
                        id="tmtGolongan"
                        type="date"
                        value={formData.tmtGolongan}
                        onChange={(e) => setFormData({ ...formData, tmtGolongan: e.target.value })}
                        required
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">Terhitung Mulai Tanggal Golongan</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jabatan">Jabatan *</Label>
                      <Input
                        id="jabatan"
                        placeholder="Jabatan pegawai"
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
                          <SelectItem value="Fungsional">Fungsional</SelectItem>
                          <SelectItem value="Struktural">Struktural</SelectItem>
                          <SelectItem value="Pelaksana">Pelaksana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pendidikanTerakhir">Pendidikan Terakhir *</Label>
                      <Select 
                        value={formData.pendidikanTerakhir} 
                        onValueChange={(value) => setFormData({ ...formData, pendidikanTerakhir: value })}
                        required
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
                    <div className="space-y-2">
                      <Label htmlFor="usulanKe">Usulan Ke- *</Label>
                      <Select 
                        value={formData.usulanKe} 
                        onValueChange={(value) => setFormData({ ...formData, usulanKe: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih usulan ke-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Usulan Ke-1</SelectItem>
                          <SelectItem value="2">Usulan Ke-2</SelectItem>
                          <SelectItem value="3">Usulan Ke-3</SelectItem>
                          <SelectItem value="4">Usulan Ke-4</SelectItem>
                          <SelectItem value="5">Usulan Ke-5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="golonganTujuan">Golongan Tujuan *</Label>
                      <Select 
                        value={formData.golonganTujuan} 
                        onValueChange={(value) => setFormData({ ...formData, golonganTujuan: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih golongan tujuan" />
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
                      <Label htmlFor="alasanUsulan">Alasan Usulan *</Label>
                      <Textarea
                        id="alasanUsulan"
                        placeholder="Alasan pengajuan usulan kenaikan pangkat"
                        value={formData.alasanUsulan}
                        onChange={(e) => setFormData({ ...formData, alasanUsulan: e.target.value })}
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveDetail} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Simpan & Lanjutkan
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="dokumen">
                  <div className="space-y-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Petunjuk Unggah Dokumen</h4>
                        <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                          <li>Format file yang didukung: PDF, JPG, PNG</li>
                          <li>Ukuran maksimal setiap file: 5 MB</li>
                          <li>Pastikan dokumen terlihat jelas dan lengkap</li>
                          <li>Semua dokumen wajib diunggah</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid gap-6">
                      {requiredDocuments.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-gray-900">{doc.title}</h3>
                              <p className="text-sm text-gray-600">{doc.description}</p>
                            </div>
                            <div className="flex items-center">
                              {uploadedFiles[doc.id]?.uploaded ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
                                  <Check className="h-3 w-3 mr-1" />
                                  Terunggah
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                                  <HelpCircle className="h-3 w-3 mr-1" />
                                  Belum Diunggah
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            {uploadedFiles[doc.id]?.fileUrl ? (
                              <div className="flex flex-wrap gap-3 items-center">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-700 truncate">
                                    {uploadedFiles[doc.id].fileName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {Math.round(uploadedFiles[doc.id].fileSize / 1024)} KB
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={uploadedFiles[doc.id].fileUrl} target="_blank" rel="noopener noreferrer">
                                      Lihat
                                    </a>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setUploadedFiles((prev) => ({
                                        ...prev,
                                        [doc.id]: {
                                          ...prev[doc.id],
                                          file: null,
                                          fileName: null,
                                          fileSize: null,
                                          fileUrl: null,
                                          uploaded: false,
                                        },
                                      }))
                                    }}
                                  >
                                    Ganti
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-3">
                                <div className="flex-1 min-w-0">
                                  <Label htmlFor={`file-${doc.id}`} className="cursor-pointer">
                                    <div className="border-2 border-dashed border-gray-300 rounded-md px-3 py-2 text-center">
                                      <Upload className="h-5 w-5 mx-auto text-gray-400" />
                                      <span className="text-sm text-gray-500 mt-1 block">
                                        {uploadedFiles[doc.id]?.fileName || "Pilih file atau seret & lepas di sini"}
                                      </span>
                                    </div>
                                  </Label>
                                  <Input
                                    id={`file-${doc.id}`}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, doc.id)}
                                    required
                                  />
                                </div>
                                {uploadedFiles[doc.id]?.file && (
                                  <Button
                                    onClick={() => handleFileUpload(doc.id)}
                                    disabled={uploadedFiles[doc.id]?.uploading}
                                    size="sm"
                                  >
                                    {uploadedFiles[doc.id]?.uploading ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Mengunggah...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-3 w-3 mr-1" />
                                        Unggah
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-6 flex justify-between">
                      <Button variant="outline" onClick={() => setActiveStep(0)}>
                        Kembali ke Detail
                      </Button>
                      <Button onClick={handleSubmitProposal} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {isEditMode ? "Perbarui Usulan" : "Kirim Usulan"}
                          </>
                        )}
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
