"use client"

import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

// Helper function to safely get string values from any type of data
const safeGetString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const obj = value as { nama?: string; name?: string; id?: string };
    // Handle both nama/name properties and full UnitKerja objects
    if (obj.nama) return obj.nama;
    if (obj.name) return obj.name;
    // If it seems to be a full object with more properties, stringify for debugging
    // but in production return empty string to avoid crashes
    if (Object.keys(obj).length > 5) {
      console.log("Complex object found:", obj);
      return process.env.NODE_ENV === 'production' ? "" : JSON.stringify(obj).slice(0, 30) + "...";
    }
    return "";
  }
  return String(value);
}

// Debug logging helper
const debug = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] ${message}`, data);
  }
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { FileText, User, Upload, Trash2, CheckCircle, Info, Search, AlertCircle, XCircle, Database } from "lucide-react"
import { useState, useEffect, useRef } from "react"

type DocumentRequirement = {
  id: string
  name: string
  description: string
  required: boolean
  isRequired: boolean
  hasSimASN: boolean
}

export default function InputUsulanPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const editProposalId = searchParams.get('edit')
  const [activeTab, setActiveTab] = useState("detail-pegawai")
  const [isDetailComplete, setIsDetailComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<{
    nip?: string;
    name?: string;
    unitKerja?: string | { nama?: string };
    unitKerjaId?: string;
    golongan?: string;
    tmtJabatan?: string;
    jabatan?: string;
    jenisJabatan?: string;
  } | null>(null)
  const [existingProposal, setExistingProposal] = useState<{
    id: string;
    periode?: string;
    pegawai?: {
      nip?: string;
      name?: string;
      unitKerja?: string | { nama?: string };
      unitKerjaId?: string;
      golongan?: string;
      tmtJabatan?: string;
      jabatan?: string;
    };
    documents?: Array<{
      documentRequirement: { code: string };
      fileUrl: string;
      fileName: string;
      status: string;
      notes: string;
      uploadedAt: string;
    }>;
  } | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    unitKerja: "",
    unitKerjaId: "", // Tetap ada untuk kompatibilitas backend
    golongan: "",
    tmtJabatan: "", // Changed from tmtGolongan to tmtJabatan
    jabatan: "",
    jenisJabatan: "",
    tahunLulus: "",
    nomorSurat: "",
    tanggalSurat: "",
    periode: "", // Add periode field
  })
  
  // Add state for unit kerja options (removed - using text input instead)
  // const [unitKerjaOptions, setUnitKerjaOptions] = useState<{id: string, nama: string, jenjang?: string, npsn?: string}[]>([])

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, {
    file: File | null;
    name?: string;
    size?: number;
    uploadDate?: Date;
    status?: string;
    fileUrl?: string;
    fileName?: string;
    notes?: string;
    uploadedAt?: string;
    source?: 'upload' | 'simasn';
  }>>({})
  const [requiredDocuments, setRequiredDocuments] = useState<DocumentRequirement[]>([])
  const [loadingSimasn, setLoadingSimasn] = useState<Record<string, boolean>>({})
  const [isDownloadingSimasn, setIsDownloadingSimasn] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/pegawai/profile")
      if (response.ok) {
        const data = await response.json()
        console.log('User profile data received:', data); // Debug log
        
        // Ensure unitKerja is handled correctly if it's an object
        if (data.unitKerja && typeof data.unitKerja === 'object') {
          // Extract nama or name from the unitKerja object
          data.unitKerjaStr = data.unitKerja.nama || data.unitKerja.name || "Unit Kerja Tidak Tersedia";
        } else {
          data.unitKerjaStr = safeGetString(data.unitKerja);
        }
        
        setUserData(data)
        
        // Process TMT Jabatan field
        let formattedTmtJabatan = "";
        try {
          if (data.tmtJabatan) {
            formattedTmtJabatan = new Date(data.tmtJabatan).toISOString().split('T')[0];
          }
        } catch (error) {
          console.error("Error formatting tmtJabatan:", error);
        }
        
        // Auto-fill form with user data
        setFormData({
          nip: safeGetString(data.nip),
          nama: safeGetString(data.name),
          unitKerja: data.unitKerjaStr || safeGetString(data.unitKerja),
          unitKerjaId: safeGetString(data.unitKerjaId),
          golongan: safeGetString(data.golongan),
          tmtJabatan: formattedTmtJabatan,
          jabatan: safeGetString(data.jabatan),
          jenisJabatan: safeGetString(data.jenisJabatan),
          tahunLulus: "",
          nomorSurat: "",
          tanggalSurat: "",
          periode: formData.periode, // Preserve any existing periode value
        })
      } else {
        throw new Error('Failed to fetch user profile')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProposalId])

  const fetchExistingProposal = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/pegawai/proposals/${proposalId}`)
      if (response.ok) {
        const proposal = await response.json()
        console.log('Existing proposal data:', proposal); // Debug log
        
        // Safely handle unit kerja object if present
        if (proposal.pegawai && proposal.pegawai.unitKerja && typeof proposal.pegawai.unitKerja === 'object') {
          // Create a safe string version of unitKerja
          proposal.pegawai.unitKerjaStr = proposal.pegawai.unitKerja.nama || 
                                         proposal.pegawai.unitKerja.name || 
                                         "Unit Kerja Tidak Tersedia";
        }
        
        setExistingProposal(proposal)
        
        // Process TMT Jabatan from proposal or userData
        let formattedTmtJabatan = "";
        try {
          if (proposal.pegawai?.tmtJabatan) {
            formattedTmtJabatan = new Date(proposal.pegawai.tmtJabatan).toISOString().split('T')[0];
          } else if (userData?.tmtJabatan) {
            formattedTmtJabatan = new Date(userData.tmtJabatan).toISOString().split('T')[0];
          }
        } catch (error) {
          console.error("Error formatting tmtJabatan:", error);
        }
        
        // Get unit kerja in string form, handling both object and string cases
        let unitKerjaString = "";
        if (proposal.pegawai?.unitKerjaStr) {
          unitKerjaString = proposal.pegawai.unitKerjaStr;
        } else if (proposal.pegawai?.unitKerja && typeof proposal.pegawai.unitKerja === 'object') {
          unitKerjaString = proposal.pegawai.unitKerja.nama || proposal.pegawai.unitKerja.name || "";
        } else {
          unitKerjaString = safeGetString(proposal.pegawai?.unitKerja) || safeGetString(userData?.unitKerja);
        }
        
        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          periode: safeGetString(proposal.periode),
          // Prefill with user data or existing proposal data
          nip: safeGetString(proposal.pegawai?.nip) || safeGetString(userData?.nip),
          nama: safeGetString(proposal.pegawai?.name) || safeGetString(userData?.name),
          unitKerja: unitKerjaString,
          unitKerjaId: safeGetString(proposal.pegawai?.unitKerjaId) || safeGetString(userData?.unitKerjaId),
          golongan: safeGetString(proposal.pegawai?.golongan) || safeGetString(userData?.golongan),
          jabatan: safeGetString(proposal.pegawai?.jabatan) || safeGetString(userData?.jabatan),
          jenisJabatan: safeGetString(userData?.jenisJabatan),
          tmtJabatan: formattedTmtJabatan,
        }))
        
        // Load existing documents
        if (proposal.documents && proposal.documents.length > 0) {
          const documentsMap: Record<string, {
            file: File | null;
            fileUrl?: string;
            fileName?: string;
            status?: string;
            notes?: string;
            uploadedAt?: string;
          }> = {}
          proposal.documents.forEach((doc: {
            documentRequirement: { code: string };
            fileUrl: string;
            fileName: string;
            status: string;
            notes: string;
            uploadedAt: string;
          }) => {
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
        const data = await response.json()          // Transform API data to match frontend interface
        const transformedData = (data.data.requirements || []).map((doc: {
          id: string;
          name: string;
          isRequired: boolean;
          hasSimASN: boolean;
          description: string;
        }) => ({
          id: doc.id,
          name: doc.name,
          required: doc.isRequired,
          isRequired: doc.isRequired,
          hasSimASN: doc.hasSimASN,
          description: doc.description
        }))
        // Paksa semua dokumen menjadi wajib
        setRequiredDocuments(transformedData.map(doc => ({ ...doc, required: true, isRequired: true })))
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
          isRequired: true,
          hasSimASN: false,
          description: "Surat pengantar dari Unit Kerja untuk usulan kenaikan pangkat",
        },
        {
          id: "surat-bebas-hukuman",
          name: "Surat Pernyataan Bebas Hukuman Disiplin",
          required: true,
          isRequired: true,
          hasSimASN: false,
          description: "Surat pernyataan bahwa pegawai bebas dari hukuman disiplin",
        },
        {
          id: "surat-kebenaran-dokumen",
          name: "Surat Pernyataan Kebenaran Dokumen",
          required: true,
          isRequired: true,
          hasSimASN: false,
          description: "Surat pernyataan kebenaran semua dokumen yang diupload",
        },
        {
          id: "sk-kenaikan-terakhir",
          name: "SK Kenaikan Pangkat Terakhir",
          required: true,
          isRequired: true,
          hasSimASN: true,
          description: "SK kenaikan pangkat yang terakhir diterima",
        },
        {
          id: "penilaian-kinerja-1",
          name: "Penilaian Kinerja Pegawai 1 (satu) tahun terakhir",
          required: true,
          isRequired: true,
          hasSimASN: true,
          description: "Penilaian kinerja pegawai untuk 1 tahun terakhir",
        },
        {
          id: "penilaian-kinerja-2",
          name: "Penilaian Kinerja Pegawai 2 (dua) tahun terakhir",
          required: true,
          isRequired: true,
          hasSimASN: true,
          description: "Penilaian kinerja pegawai untuk 2 tahun terakhir",
        },
        {
          id: "sk-pns",
          name: "SK PNS",
          required: true,
          isRequired: true,
          hasSimASN: true,
          description: "Bagi yang baru pertama kali diusulkan kenaikan pangkat",
        },
        {
          id: "sk-cpns",
          name: "SK CPNS",
          required: true,
          isRequired: true,
          hasSimASN: true,
          description: "Bagi yang baru pertama kali diusulkan kenaikan pangkat",
        },
      ]
      // Paksa semua dokumen mock menjadi wajib
      setRequiredDocuments(mockDocs.map(doc => ({ ...doc, required: true, isRequired: true })))
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
      const response = await fetch(`/api/pegawai/profile`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          // Process TMT Jabatan field
          let formattedTmtJabatan = "";
          try {
            if (data.tmtJabatan) {
              formattedTmtJabatan = new Date(data.tmtJabatan).toISOString().split('T')[0];
            }
          } catch (error) {
            console.error("Error formatting tmtJabatan:", error);
          }
          
          setFormData({
            ...formData,
            nama: safeGetString(data.name),
            unitKerja: safeGetString(data.unitKerja),
            unitKerjaId: safeGetString(data.unitKerjaId),
            golongan: safeGetString(data.golongan),
            tmtJabatan: formattedTmtJabatan,
            jabatan: safeGetString(data.jabatan),
            jenisJabatan: safeGetString(data.jenisJabatan),
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
    // Debug log to see all form data values
    console.log("Form data at save:", formData);
    
    // Check only required fields instead of all fields
    const requiredFields = ['nip', 'nama', 'unitKerja', 'jabatan', 'jenisJabatan'];
    
    // Check if editing mode requires periode
    if (isEditMode) {
      requiredFields.push('periode');
    }
    
    // Check if any required field is empty
    const missingFields = requiredFields.filter(field => 
      !formData[field as keyof typeof formData] || 
      formData[field as keyof typeof formData].toString().trim() === ""
    );
    
    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      toast({
        title: "Data belum lengkap",
        description: `Mohon lengkapi field berikut: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    // If we reach here, validation passed
    setIsDetailComplete(true);
    setActiveTab("kelengkapan-berkas");
    toast({
      title: "Detail pegawai tersimpan! ✅",
      description: "Anda dapat melanjutkan ke upload kelengkapan berkas",
    });
  }

  const handleFileUpload = async (docId: string, file: File) => {
    // Reset input file agar bisa upload file yang sama dua kali
    const input = fileInputRefs.current[docId];
    if (input) input.value = '';
    // Check file size - 5MB max
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      toast({
        title: "Ukuran file terlalu besar",
        description: `Ukuran file maksimal adalah 5MB. File Anda: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format file tidak didukung",
        description: "Hanya file PDF, JPG, dan PNG yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    // Show loading toast
    toast({ 
      title: "Memproses dokumen...", 
      description: `Sedang mengupload ${file.name}` 
    });

    if (!editProposalId && !isEditMode) {
      // Local storage only if not in edit mode
      setUploadedFiles((prev) => ({
        ...prev,
        [docId]: { 
          file, 
          name: file.name, 
          size: file.size, 
          uploadDate: new Date(), 
          status: "uploaded" 
        },
      }));
      
      toast({ 
        title: "Dokumen berhasil disiapkan! 📁", 
        description: `${file.name} siap untuk diajukan` 
      });
      // Reset input file setelah upload lokal
      if (input) input.value = '';
      return;
    }

    // If in edit mode, upload to server directly
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentRequirementId', docId);

      const response = await fetch(`/api/pegawai/proposals/${editProposalId}/documents`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
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
        }));
        
        toast({ 
          title: "Dokumen berhasil diupload! ✅", 
          description: `${file.name} telah diunggah dan menunggu verifikasi` 
        });
      } else {
        // Try to get error message from response
        let errorMessage = 'Gagal mengupload dokumen';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        // Reset input file setelah error
        if (input) input.value = '';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Gagal mengupload dokumen",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengupload dokumen",
        variant: "destructive",
      });
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

  // Fungsi untuk mengambil dokumen dari SimASN
  const fetchSimasnDocument = async (docId: string, docName: string) => {
    try {
      setLoadingSimasn(prev => ({ ...prev, [docId]: true }))
      
      toast({
        title: "Mengambil data dari SimASN...",
        description: `Sedang mengambil dokumen ${docName} dari sistem SimASN`,
      })
      
      // Simulasi delay untuk pengambilan data (akan diganti dengan API call yang sebenarnya)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Nanti ini akan diganti dengan panggilan API yang sesungguhnya
      // const response = await fetch(`/api/simasn/documents/${docId}?nip=${formData.nip}`)
      // if (!response.ok) throw new Error('Gagal mengambil dokumen dari SimASN')
      // const data = await response.json()
      
      // Simulasi data response (akan diganti dengan data dari API)
      const mockData = {
        success: true,
        fileUrl: "/simasn-document-sample.pdf",
        fileName: `${docName} - SimASN.pdf`,
        size: 256000, // 250KB
      }
      
      if (mockData.success) {
        setUploadedFiles(prev => ({
          ...prev,
          [docId]: {
            file: null, // Tidak ada file lokal
            fileUrl: mockData.fileUrl,
            fileName: mockData.fileName,
            name: mockData.fileName,
            size: mockData.size,
            uploadDate: new Date(),
            status: isEditMode ? "MENUNGGU_VERIFIKASI" : "uploaded",
            source: 'simasn'
          }
        }))
        
        toast({
          title: "Dokumen berhasil diambil! ✅",
          description: `${docName} telah berhasil diambil dari SimASN`,
        })
      } else {
        throw new Error('Gagal mengambil dokumen')
      }
    } catch (error) {
      console.error(`Error fetching document from SimASN:`, error)
      toast({
        title: "Gagal mengambil dokumen",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil dokumen dari SimASN",
        variant: "destructive",
      })
    } finally {
      setLoadingSimasn(prev => ({ ...prev, [docId]: false }))
    // Reset input file jika terjadi error
    if (input) input.value = '';
    }
  }
  
  // Fungsi untuk mengambil semua dokumen SimASN sekaligus
  const fetchAllSimasnDocuments = async () => {
    try {
      setIsDownloadingSimasn(true)
      
      toast({
        title: "Mengambil semua dokumen SimASN...",
        description: "Proses ini mungkin memerlukan waktu beberapa saat",
      })
      
      // Daftar dokumen yang tersedia di SimASN
      const simasnDocIds = requiredDocuments
        .filter(doc => doc.hasSimASN)
        .map(doc => doc.id)
      
      // Simulasi mengambil semua dokumen
      await Promise.all(
        simasnDocIds.map(async docId => {
          const doc = requiredDocuments.find(d => d.id === docId)
          if (doc) {
            await fetchSimasnDocument(docId, doc.name)
          }
        })
      )
      
      toast({
        title: "Semua dokumen SimASN berhasil diambil! ✅",
        description: "Dokumen telah ditambahkan ke daftar berkas Anda",
      })
    } catch (error) {
      console.error("Error fetching all SimASN documents:", error)
      toast({
        title: "Gagal mengambil beberapa dokumen",
        description: "Beberapa dokumen gagal diambil dari SimASN. Silakan coba satu per satu.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingSimasn(false)
    }
  }

  const handleSubmitProposal = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("Form data at submission:", formData);
    console.log("Uploaded files:", uploadedFiles);
    
    // Debug info about required docs
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter(doc => uploadedFiles[doc.id]);
    console.log(`Uploaded ${uploadedRequiredDocs.length} of ${requiredDocs.length} required documents`);
    
    // Check if periode is filled when in edit mode (more lenient validation)
    if (isEditMode && !formData.periode.trim()) {
      toast({
        title: "Periode Harus Diisi",
        description: "Mohon isi periode usulan terlebih dahulu.",
        variant: "destructive",
      })
      return
    }

    // More lenient TMT Jabatan validation - only validate if it's provided
    if (formData.tmtJabatan && formData.tmtJabatan.trim() !== "") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.tmtJabatan)) {
        toast({
          title: "Format TMT Jabatan tidak valid",
          description: "Gunakan format Tahun-Bulan-Tanggal (YYYY-MM-DD)",
          variant: "destructive",
        })
        return
      }
    }

    // Count required documents that have been uploaded
    const allRequiredUploaded = requiredDocuments.filter((doc) => doc.isRequired).every((doc) => uploadedFiles[doc.id])
    
    // More lenient document validation for debugging/development
    if (!allRequiredUploaded) {
      const missingDocs = requiredDocuments
        .filter(doc => doc.isRequired && !uploadedFiles[doc.id])
        .map(doc => doc.name);
      
      console.log("Missing required documents:", missingDocs);
      
      // In development, show warning but allow proceeding
      if (process.env.NODE_ENV !== 'production') {
        const willProceed = confirm(
          `Dokumen wajib belum lengkap (${missingDocs.join(", ")}). Lanjutkan pengajuan? Ini hanya diizinkan dalam mode development.`
        );
        if (!willProceed) {
          return;
        }
      } else {
        // In production, still require all documents
        toast({
          title: "Dokumen Wajib Belum Lengkap",
          description: "Mohon upload semua dokumen yang wajib diisi.",
          variant: "destructive",
        })
        return
      }
    }

    toast({
      title: isEditMode ? "Memperbarui Usulan..." : "Mengajukan Dokumen...",
      description: "Harap tunggu sebentar.",
    })

    try {
      // First, update the user profile with the latest input data
      const profileUpdateData = {
        name: formData.nama,
        jabatan: formData.jabatan,
        jenisJabatan: formData.jenisJabatan,
        unitKerja: formData.unitKerja,
        tmtJabatan: formData.tmtJabatan, // Send date in YYYY-MM-DD format for server to handle as timestamp
      }

      console.log("Updating profile from input-usulan:", profileUpdateData); // Debug log

      // Update profile data
      const profileResponse = await fetch('/api/pegawai/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileUpdateData),
      })

      if (!profileResponse.ok) {
        console.warn("Failed to update profile data, but continuing with proposal submission");
      } else {
        const profileData = await profileResponse.json();
        console.log("Profile update successful:", profileData);
        
        // Update userData with the new profile data
        setUserData({
          ...userData,
          name: profileData.name,
          jabatan: profileData.jabatan,
          jenisJabatan: profileData.jenisJabatan,
          unitKerja: profileData.unitKerja,
          tmtJabatan: profileData.tmtJabatan
        });
      }

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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([docId, fileData]) => fileData.file && !fileData.fileUrl);

        for (const [docId, fileData] of documentsToUpload) {
          const formData = new FormData();
          if (fileData.file) {
            formData.append('file', fileData.file);
          }
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
            window.location.href = '/pegawai/riwayat-dokumen'
          }, 2000)
        } else {
          const errorData = await submitResponse.json();
          throw new Error(errorData.message || 'Gagal mengajukan usulan');
        }
      } else {
        // Create new proposal
        const currentYear = new Date().getFullYear();
        const proposalData = {
          periode: formData.periode || `${currentYear}`,
          notes: `Usulan kenaikan pangkat untuk periode ${formData.periode || currentYear}. Pengajuan oleh ${formData.nama} (${formData.nip})`,
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
          if (fileData.file) {
            formData.append('file', fileData.file);
          }
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
            window.location.href = '/pegawai/riwayat-dokumen'
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
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout userType="pegawai">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-sky-500 to-teal-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Input Usulan Pengajuan</h1>
                <p className="text-sky-100">Periode {new Date().getFullYear()}</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Lengkapi detail pegawai, termasuk TMT Jabatan (dalam format Tahun-Bulan-Tanggal), kemudian upload semua dokumen yang diperlukan.
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
                      <Label htmlFor="tmtJabatan">TMT Jabatan *</Label>
                      <Input
                        id="tmtJabatan"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        value={formData.tmtJabatan}
                        onChange={(e) => setFormData({ ...formData, tmtJabatan: e.target.value })}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Format: Tahun-Bulan-Tanggal (contoh: 2025-01-01)
                      </p>
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
                    
                    {/* Debug button - only visible in development */}
                    {process.env.NODE_ENV !== 'production' && (
                      <Button 
                        variant="outline" 
                        className="ml-2 border-orange-500 text-orange-700"
                        onClick={() => {
                          console.log("Force proceeding to next step");
                          setIsDetailComplete(true);
                          setActiveTab("kelengkapan-berkas");
                          toast({
                            title: "Debug: Force Proceeding",
                            description: "Skipping validation and proceeding to next step",
                          });
                        }}
                      >
                        Debug: Force Proceed
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="kelengkapan-berkas" className="space-y-6 pt-6">
                  {/* Tombol tarik semua data SimASN */}
                  {requiredDocuments.some(doc => doc.hasSimASN) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Database className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium text-blue-800 dark:text-blue-200">
                              Dokumen SimASN Tersedia
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Beberapa dokumen dapat ditarik dari database SimASN secara otomatis
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
                          onClick={fetchAllSimasnDocuments}
                          disabled={isDownloadingSimasn}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          {isDownloadingSimasn ? 'Mengambil data...' : 'Tarik Semua Data SimASN'}
                        </Button>
                      </div>
                    </div>
                  )}
                  
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
                          const isLoading = loadingSimasn[doc.id] || false
                          return (
                            <tr key={doc.id} className="border-b dark:border-gray-700">
                              <td className="p-3">
                                <div className="flex items-center">
                                  <div>
                                    <p className="font-medium">{doc.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{doc.description}</p>
                                  </div>
                                  {doc.hasSimASN && (
                                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                                      SimASN
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="destructive">Wajib</Badge>
                              </td>
                              <td className="p-3">
                                {uploadedFile ? (
                                  <div className="text-xs">
                                    <p className="font-medium text-green-600">{uploadedFile.name || uploadedFile.fileName || "File Uploaded"}</p>
                                    {uploadedFile.size && <p className="text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>}
                                    {uploadedFile.source === 'simasn' && (
                                      <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                                        Data SimASN
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">Belum diupload</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  {/* Drag & Drop Area */}
                                  <div
                                    onDrop={e => {
                                      e.preventDefault();
                                      const file = e.dataTransfer.files?.[0];
                                      if (file) handleFileUpload(doc.id, file);
                                    }}
                                    onDragOver={e => e.preventDefault()}
                                    className="border border-dashed border-gray-300 rounded px-2 py-2 mr-2 cursor-pointer hover:bg-gray-50 text-xs text-gray-500"
                                    style={{ minWidth: 90, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Drag & drop file di sini"
                                  >
                                    Drag file di sini
                                  </div>
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
                                    ref={(input) => {
                                      fileInputRefs.current[doc.id] = input;
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const input = fileInputRefs.current[doc.id];
                                      if (input) {
                                        input.click();
                                      }
                                    }}
                                    disabled={isLoading}
                                  >
                                    <Upload className="h-3 w-3" />
                                  </Button>
                                  
                                  {/* Tombol Tarik Data SimASN */}
                                  {doc.hasSimASN && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                      onClick={() => fetchSimasnDocument(doc.id, doc.name)}
                                      disabled={isLoading}
                                    >
                                      {isLoading ? (
                                        <div className="h-3 w-3 rounded-full border-2 border-b-transparent border-blue-700 animate-spin" />
                                      ) : (
                                        <Database className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                  
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
                      {process.env.NODE_ENV !== 'production' && (
                        <Button 
                          variant="outline" 
                          className="border-yellow-500 text-yellow-700"
                          onClick={() => {
                            debug("Current state", {
                              formData,
                              uploadedFiles,
                              userData,
                              existingProposal,
                              requiredDocuments
                            });
                            toast({
                              title: "Debug Info",
                              description: "Check console for debug information",
                            });
                          }}
                        >
                          Debug Info
                        </Button>
                      )}
                      
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
                                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                  } catch (err) {
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
                      
                      <div className="relative">
                        <Button onClick={handleSubmitProposal} className="bg-gradient-to-r from-sky-500 to-teal-500" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <span className="mr-2">
                              <svg className="animate-spin h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                              </svg>
                            </span>
                          ) : (
                            <FileText className="h-4 w-4 mr-2" />
                          )}
                          {isEditMode ? "Lengkapi & Ajukan Usulan" : "Ajukan Dokumen"}
                        </Button>
                        {isSubmitting && (
                          <div className="absolute left-0 right-0 -bottom-7 flex justify-center">
                            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-2 bg-gradient-to-r from-sky-500 to-teal-500 animate-pulse w-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      )}
    </DashboardLayout>
  )
}
