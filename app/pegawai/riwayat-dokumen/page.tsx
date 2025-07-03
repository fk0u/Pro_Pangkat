"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ErrorPage } from "@/components/error-page"
import { ProposalListSkeleton, EmptyProposalState } from "@/components/proposal-skeleton"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  RotateCcw, 
  Calendar, 
  AlertCircle,
  Plus,
  User,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { formatDate as formatDateUtil, formatFileSize as formatFileSizeUtil } from "@/lib/date-utils"

type ProposalDocument = {
  id: string
  fileName: string
  fileSize: number
  status: string
  notes?: string
  uploadedAt: string
  fileUrl?: string
  documentRequirement: {
    name: string
    code: string
    description?: string
    isRequired: boolean
  }
}

type Proposal = {
  id: string
  periode: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  pegawai: {
    name: string
    nip: string
    jabatan?: string
    golongan?: string
    unitKerja?: string
  }
  operator?: {
    name: string
    nip: string
  }
  documents: ProposalDocument[]
  documentStats: {
    total: number
    approved: number
    pending: number
    needsRevision: number
    rejected: number
    required?: number
    missing?: number
  }
  golonganAsal?: string
  golonganTujuan?: string
  missingDocuments?: Array<{
    id: string
    code: string
    name: string
    description?: string
    isRequired: boolean
  }>
  canUploadDocuments?: boolean
  canSubmit?: boolean
  needsAttention?: boolean
}

export default function RiwayatDokumenPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [isResubmitOpen, setIsResubmitOpen] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const loadProposals = async () => {
      await fetchProposals()
    }
    loadProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('Fetching proposals...')
      
      const response = await fetch('/api/pegawai/proposals')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Proposals data:', data)
        setProposals(data)
      } else if (response.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.')
        // Redirect to login after showing error
        setTimeout(() => {
          router.push('/login/pegawai')
        }, 2000)
      } else {
        const errorData = await response.text()
        console.error('API Error:', errorData)
        setError('Gagal memuat data riwayat usulan. Silakan coba lagi.')
        setProposals([])
      }
    } catch (error) {
      console.error("Error fetching proposals:", error)
      setError('Terjadi kesalahan saat memuat data. Periksa koneksi internet Anda.')
      setProposals([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch = 
      proposal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.periode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
      case "DISETUJUI":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Selesai
        </Badge>
      case "PERLU_PERBAIKAN_DARI_DINAS":
      case "PERLU_PERBAIKAN_DARI_SEKOLAH":
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Perlu Perbaikan
        </Badge>
      case "DITOLAK":
        return <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Ditolak
        </Badge>
      case "DITARIK":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
          <Trash2 className="h-3 w-3 mr-1" />
          Ditarik
        </Badge>
      case "MENUNGGU_VERIFIKASI_DINAS":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Verifikasi Dinas
        </Badge>
      case "MENUNGGU_VERIFIKASI_SEKOLAH":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
          <Clock className="h-3 w-3 mr-1" />
          Verifikasi Sekolah
        </Badge>
      case "MENUNGGU_VERIFIKASI":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <Clock className="h-3 w-3 mr-1" />
          Menunggu Verifikasi
        </Badge>
      case "DRAFT":
        return <Badge variant="secondary">
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      case "DIAJUKAN":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <Clock className="h-3 w-3 mr-1" />
          Diajukan
        </Badge>
      default:
        return <Badge variant="secondary">{status.replace(/_/g, " ").toLowerCase()}</Badge>
    }
  }

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "DISETUJUI":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Disetujui</Badge>
      case "PERLU_PERBAIKAN":
        return <Badge variant="destructive">Perlu Perbaikan</Badge>
      case "DITOLAK":
        return <Badge variant="destructive">Ditolak</Badge>
      case "MENUNGGU_VERIFIKASI":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Menunggu</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    return formatFileSizeUtil(bytes)
  }

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString)
  }

  const canWithdraw = (status: string) => {
    return ["DIAJUKAN", "MENUNGGU_VERIFIKASI", "MENUNGGU_VERIFIKASI_DINAS", "MENUNGGU_VERIFIKASI_SEKOLAH"].includes(status)
  }

  const canResubmit = (status: string) => {
    return ["DITOLAK", "PERLU_PERBAIKAN_DARI_DINAS", "PERLU_PERBAIKAN_DARI_SEKOLAH", "DIKEMBALIKAN_OPERATOR", "DIKEMBALIKAN_ADMIN"].includes(status)
  }

  const needsDocumentCompletion = (proposal: Proposal) => {
    return proposal.documentStats.total === 0 || 
           proposal.documentStats.needsRevision > 0 || 
           proposal.documentStats.rejected > 0 ||
           (proposal.status === "DRAFT" && (proposal.documentStats.missing || 0) > 0) ||
           proposal.needsAttention === true
  }

  const handleWithdraw = async () => {
    if (!selectedProposal || !withdrawReason.trim()) {
      toast({
        title: "Error",
        description: "Alasan penarikan harus diisi",
        variant: "destructive"
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/pegawai/proposals/${selectedProposal.id}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: withdrawReason }),
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Usulan berhasil ditarik",
        })
        setIsWithdrawOpen(false)
        setWithdrawReason("")
        await fetchProposals()
      } else {
        const error = await response.json()
        throw new Error(error.message || error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menarik usulan",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleResubmit = async () => {
    if (!selectedProposal) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/pegawai/proposals/${selectedProposal.id}/resubmit`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Usulan berhasil diajukan ulang",
        })
        setIsResubmitOpen(false)
        await fetchProposals()
      } else {
        const error = await response.json()
        throw new Error(error.message || error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengajukan ulang usulan",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handlePreview = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/preview`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
      } else {
        throw new Error("Gagal preview dokumen")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal preview dokumen",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        throw new Error("Gagal download dokumen")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal download dokumen",
        variant: "destructive"
      })
    }
  }

  return (
    <DashboardLayout userType="pegawai">
      {error ? (
        <ErrorPage
          title="Gagal Memuat Data"
          description={error}
          onRetry={fetchProposals}
          showHomeButton={true}
        />
      ) : (
        <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={FileText}
          title="Riwayat Dokumen"
          subtitle="Pantau status dan riwayat semua usulan kenaikan pangkat Anda"
        />

        {/* Filter & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter & Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari ID usulan atau periode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                    <SelectItem value="MENUNGGU_VERIFIKASI_DINAS">Verifikasi Dinas</SelectItem>
                    <SelectItem value="MENUNGGU_VERIFIKASI_SEKOLAH">Verifikasi Sekolah</SelectItem>
                    <SelectItem value="PERLU_PERBAIKAN_DARI_DINAS">Perlu Perbaikan</SelectItem>
                    <SelectItem value="DITOLAK">Ditolak</SelectItem>
                    <SelectItem value="SELESAI">Selesai</SelectItem>
                    <SelectItem value="DITARIK">Ditarik</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => router.push('/pegawai/input-usulan')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Usulan Baru
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Proposal List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4"
        >
          {filteredProposals.map((proposal, index) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.01 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{proposal.id}</h3>
                        {getStatusBadge(proposal.status)}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Periode: {proposal.periode}</span>
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>{proposal.pegawai.name}</span>
                        </div>
                        {proposal.pegawai.golongan && (
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-2" />
                            <span>Golongan: {proposal.pegawai.golongan}</span>
                          </div>
                        )}
                      </div>
                      {proposal.notes && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-orange-800 dark:text-orange-200">{proposal.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document Stats */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-green-700 dark:text-green-300">Disetujui</span>
                            <span className="font-bold text-green-800 dark:text-green-200">{proposal.documentStats.approved}</span>
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 dark:text-blue-300">Menunggu</span>
                            <span className="font-bold text-blue-800 dark:text-blue-200">{proposal.documentStats.pending}</span>
                          </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Perbaikan</span>
                            <span className="font-bold text-orange-800 dark:text-orange-200">{proposal.documentStats.needsRevision}</span>
                          </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-red-700 dark:text-red-300">Ditolak</span>
                            <span className="font-bold text-red-800 dark:text-red-200">{proposal.documentStats.rejected}</span>
                          </div>
                        </div>
                      </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Dokumen:</span>
                            <span className="font-medium">{proposal.documentStats.total}</span>
                          </div>
                          {proposal.documentStats.required && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Dokumen Wajib:</span>
                              <span className="font-medium">{proposal.documentStats.required}</span>
                            </div>
                          )}
                          {proposal.documentStats.missing && proposal.documentStats.missing > 0 && (
                            <div className="flex justify-between">
                              <span className="text-red-600 dark:text-red-400">Belum Upload:</span>
                              <span className="font-medium text-red-600 dark:text-red-400">{proposal.documentStats.missing}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Diajukan:</span>
                            <span className="font-medium">{formatDate(proposal.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Terakhir Update:</span>
                            <span className="font-medium">{formatDate(proposal.updatedAt)}</span>
                          </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedProposal(proposal)
                          setIsDetailOpen(true)
                        }}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detail Usulan
                      </Button>
                      
                      {needsDocumentCompletion(proposal) && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/pegawai/usulan/${proposal.id}?mode=edit`)}
                          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/20"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Lengkapi Dokumen</span>
                          <span className="sm:hidden">Lengkapi</span>
                        </Button>
                      )}
                      
                      {canWithdraw(proposal.status) && (
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedProposal(proposal)
                            setIsWithdrawOpen(true)
                          }}
                          className="w-full"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Tarik Usulan</span>
                          <span className="sm:hidden">Tarik</span>
                        </Button>
                      )}
                      
                      {canResubmit(proposal.status) && (
                        <Button
                          onClick={() => {
                            setSelectedProposal(proposal)
                            setIsResubmitOpen(true)
                          }}
                          className="w-full"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Ajukan Ulang</span>
                          <span className="sm:hidden">Ajukan</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredProposals.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <EmptyProposalState
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onCreateNew={() => router.push('/pegawai/input-usulan')}
            />
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && <ProposalListSkeleton />}

        {/* Detail Modal */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Usulan {selectedProposal?.id}</DialogTitle>
              <DialogDescription>
                Informasi lengkap usulan kenaikan pangkat dan dokumen pendukung
              </DialogDescription>
            </DialogHeader>
            
            {selectedProposal && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Dokumen ({selectedProposal.documents.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">ID Usulan</Label>
                        <p className="text-sm">{selectedProposal.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Periode</Label>
                        <p className="text-sm">{selectedProposal.periode}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedProposal.status)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tanggal Diajukan</Label>
                        <p className="text-sm">{formatDate(selectedProposal.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Nama Pegawai</Label>
                        <p className="text-sm">{selectedProposal.pegawai.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">NIP</Label>
                        <p className="text-sm">{selectedProposal.pegawai.nip}</p>
                      </div>
                      {selectedProposal.pegawai.jabatan && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Jabatan</Label>
                          <p className="text-sm">{selectedProposal.pegawai.jabatan}</p>
                        </div>
                      )}
                      {selectedProposal.pegawai.golongan && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Golongan</Label>
                          <p className="text-sm">{selectedProposal.pegawai.golongan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedProposal.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Catatan</Label>
                      <div className="mt-1 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-sm text-orange-800 dark:text-orange-200">{selectedProposal.notes}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dokumen</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ukuran</TableHead>
                          <TableHead>Catatan</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProposal.documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{doc.documentRequirement.name}</p>
                                <p className="text-sm text-gray-500">{doc.fileName}</p>
                                <p className="text-xs text-gray-400">Upload: {formatDate(doc.uploadedAt)}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getDocumentStatusBadge(doc.status)}</TableCell>
                            <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                            <TableCell>
                              {doc.notes ? (
                                <div className="max-w-xs">
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={doc.notes}>
                                    {doc.notes}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(doc.id)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(doc.id, doc.fileName)}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {selectedProposal.documents.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada dokumen yang diunggah</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Withdraw Modal */}
        <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tarik Usulan</DialogTitle>
              <DialogDescription>
                Anda akan menarik usulan {selectedProposal?.id}. Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Setelah ditarik, usulan tidak dapat diproses lebih lanjut dan Anda perlu membuat usulan baru.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="withdraw-reason">Alasan Penarikan *</Label>
                <Textarea
                  id="withdraw-reason"
                  placeholder="Jelaskan alasan Anda menarik usulan ini..."
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleWithdraw}
                disabled={actionLoading || !withdrawReason.trim()}
              >
                {actionLoading ? "Menarik..." : "Tarik Usulan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resubmit Modal */}
        <Dialog open={isResubmitOpen} onOpenChange={setIsResubmitOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajukan Ulang Usulan</DialogTitle>
              <DialogDescription>
                Anda akan mengajukan ulang usulan {selectedProposal?.id}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Pastikan Anda telah memperbaiki semua dokumen yang diperlukan sebelum mengajukan ulang.
                </AlertDescription>
              </Alert>
              
              {selectedProposal && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status Dokumen:</Label>
                  <div className="space-y-1">
                    {selectedProposal.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between text-sm">
                        <span>{doc.documentRequirement.name}</span>
                        {getDocumentStatusBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResubmitOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleResubmit} disabled={actionLoading}>
                {actionLoading ? "Mengajukan..." : "Ajukan Ulang"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      )}
    </DashboardLayout>
  )
}
