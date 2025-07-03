"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, Download, Eye, RotateCcw, Trash2, Send, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type UsulanDetail = {
  id: string
  periode: string
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  pegawai: {
    name: string
    nip: string
    golongan: string
    jabatan: string
    unitKerja: string
  }
  documents: DocumentDetail[]
  documentStats?: {
    total: number
    approved: number
    pending: number
    needsRevision: number
    rejected: number
    required: number
    missing: number
  }
  canUploadDocuments?: boolean
  needsAttention?: boolean
}

type DocumentDetail = {
  id: string
  documentRequirement: {
    id: string
    name: string
    description: string
    isRequired: boolean
  }
  fileName: string
  fileSize: number
  status: string
  notes: string | null
  uploadedAt: string
}

export default function DetailUsulanPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [usulan, setUsulan] = useState<UsulanDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [showResubmitDialog, setShowResubmitDialog] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState("")
  const [resubmitNotes, setResubmitNotes] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchUsulanDetail(params.id as string)
    }
  }, [params.id])

  async function fetchUsulanDetail(id: string) {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/pegawai/proposals/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setUsulan(data)
      } else {
        throw new Error("Failed to fetch proposal detail")
      }
    } catch (error) {
      console.error("Error fetching proposal detail:", error)
      // Fallback to mock data
      const mockData: UsulanDetail = {
        id: id,
        periode: "Agustus 2025",
        status: "DRAFT",
        notes: "Usulan dibuat oleh operator sekolah. Silakan lengkapi dokumen yang diperlukan.",
        createdAt: "2025-06-25T10:00:00Z",
        updatedAt: "2025-06-28T10:00:00Z",
        pegawai: {
          name: "Ahmad Fauzi",
          nip: "198501012010011001",
          golongan: "III/c",
          jabatan: "Guru Matematika",
          unitKerja: "SMA Negeri 1 Samarinda"
        },
        documents: [],
        documentStats: {
          total: 0,
          approved: 0,
          pending: 0, 
          needsRevision: 0,
          rejected: 0,
          required: 15,
          missing: 15
        },
        canUploadDocuments: true,
        needsAttention: true
      }
      setUsulan(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
      case "DISETUJUI":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Disetujui</Badge>
      case "PERLU_PERBAIKAN_DARI_DINAS":
      case "PERLU_PERBAIKAN_DARI_SEKOLAH":
        return <Badge variant="destructive">Perlu Perbaikan</Badge>
      case "DITOLAK":
        return <Badge variant="destructive">Ditolak</Badge>
      case "DITARIK":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">Ditarik</Badge>
      case "MENUNGGU_VERIFIKASI_DINAS":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Verifikasi Dinas</Badge>
      case "MENUNGGU_VERIFIKASI_SEKOLAH":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">Verifikasi Sekolah</Badge>
      case "MENUNGGU_VERIFIKASI":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Menunggu Verifikasi</Badge>
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>
      case "DIAJUKAN":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Diajukan</Badge>
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
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Menunggu Verifikasi</Badge>
      default:
        return <Badge variant="secondary">{status.replace(/_/g, " ").toLowerCase()}</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canWithdraw = usulan?.status && ['MENUNGGU_VERIFIKASI_DINAS', 'MENUNGGU_VERIFIKASI_SEKOLAH', 'DIAJUKAN'].includes(usulan.status)
  const canResubmit = usulan?.status && ['PERLU_PERBAIKAN_DARI_DINAS', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'DITOLAK'].includes(usulan.status)
  const canEditDocuments = usulan?.canUploadDocuments && usulan?.needsAttention

  const handleWithdraw = async () => {
    if (!withdrawReason.trim()) {
      toast({
        title: "Error",
        description: "Alasan penarikan harus diisi",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/pegawai/proposals/${params.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: withdrawReason })
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Usulan berhasil ditarik"
        })
        setShowWithdrawDialog(false)
        setWithdrawReason("")
        // Refresh data
        if (params.id) {
          fetchUsulanDetail(params.id as string)
        }
      } else {
        throw new Error("Failed to withdraw proposal")
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal menarik usulan",
        variant: "destructive"
      })
    }
  }

  const handleResubmit = async () => {
    try {
      const response = await fetch(`/api/pegawai/proposals/${params.id}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: resubmitNotes })
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Usulan berhasil diajukan ulang"
        })
        setShowResubmitDialog(false)
        setResubmitNotes("")
        // Refresh data
        if (params.id) {
          fetchUsulanDetail(params.id as string)
        }
      } else {
        throw new Error("Failed to resubmit proposal")
      }
    } catch {
      toast({
        title: "Error",
        description: "Gagal mengajukan ulang usulan",
        variant: "destructive"
      })
    }
  }

  const handlePreviewDocument = (documentId: string) => {
    // Open document preview in new tab
    window.open(`/api/documents/${documentId}/preview`, '_blank')
  }

  const handleDownloadDocument = (documentId: string, fileName: string) => {
    // Create download link
    const link = document.createElement('a')
    link.href = `/api/documents/${documentId}/download`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <DashboardLayout userType="pegawai">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Memuat data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!usulan) {
    return (
      <DashboardLayout userType="pegawai">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Usulan tidak ditemukan</h1>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="pegawai">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Detail Usulan</h1>
            <p className="text-muted-foreground">Periode {usulan.periode}</p>
          </div>
          <div className="flex gap-2">
            {canWithdraw && (
              <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Tarik Usulan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tarik Usulan</DialogTitle>
                    <DialogDescription>
                      Anda akan menarik usulan ini. Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="withdraw-reason">Alasan Penarikan *</Label>
                      <Textarea
                        id="withdraw-reason"
                        placeholder="Masukkan alasan penarikan usulan..."
                        value={withdrawReason}
                        onChange={(e) => setWithdrawReason(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                      Batal
                    </Button>
                    <Button variant="destructive" onClick={handleWithdraw}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Tarik Usulan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {canResubmit && (
              <Dialog open={showResubmitDialog} onOpenChange={setShowResubmitDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Ajukan Ulang
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajukan Ulang Usulan</DialogTitle>
                    <DialogDescription>
                      Pastikan semua dokumen yang perlu diperbaiki sudah diupload ulang sebelum mengajukan kembali.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resubmit-notes">Catatan Tambahan (Opsional)</Label>
                      <Textarea
                        id="resubmit-notes"
                        placeholder="Masukkan catatan tambahan untuk pengajuan ulang..."
                        value={resubmitNotes}
                        onChange={(e) => setResubmitNotes(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowResubmitDialog(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleResubmit}>
                      <Send className="h-4 w-4 mr-2" />
                      Ajukan Ulang
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Tombol Lengkapi Dokumen - tampil di bawah header jika diperlukan */}
        {canEditDocuments && (
          <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">Dokumen Belum Lengkap</h4>
                  <p className="text-orange-800 dark:text-orange-200 mt-1">
                    {usulan.documentStats?.missing || 0} dokumen wajib belum diupload. 
                    Silakan lengkapi dokumen untuk melanjutkan proses usulan.
                  </p>
                  <Button 
                    className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => router.push(`/pegawai/input-usulan?edit=${usulan.id}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Lengkapi Dokumen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Alert */}
        {usulan.notes && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Catatan Perbaikan</h4>
                  <p className="text-blue-800 dark:text-blue-200 mt-1">{usulan.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="documents">Dokumen</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Usulan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ID Usulan</Label>
                    <p className="font-mono text-sm">{usulan.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Periode</Label>
                    <p>{usulan.periode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(usulan.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</Label>
                    <p>{new Date(usulan.createdAt).toLocaleDateString("id-ID", { dateStyle: "full" })}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</Label>
                    <p>{new Date(usulan.updatedAt).toLocaleDateString("id-ID", { dateStyle: "full" })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pegawai Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pegawai</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nama</Label>
                    <p>{usulan.pegawai.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">NIP</Label>
                    <p className="font-mono">{usulan.pegawai.nip}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Golongan</Label>
                    <p>{usulan.pegawai.golongan}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Jabatan</Label>
                    <p>{usulan.pegawai.jabatan}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Unit Kerja</Label>
                    <p>{usulan.pegawai.unitKerja}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dokumen Pendukung</CardTitle>
                <CardDescription>
                  Daftar dokumen yang telah diupload untuk usulan ini
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Dokumen</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead>Tanggal Upload</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usulan.documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{doc.documentRequirement.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.documentRequirement.description}
                              </p>
                              {doc.documentRequirement.isRequired && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Wajib
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{doc.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.fileSize)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getDocumentStatusBadge(doc.status)}
                          </TableCell>
                          <TableCell>
                            {doc.notes ? (
                              <div className="max-w-xs">
                                <p className="text-sm break-words">{doc.notes}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(doc.uploadedAt).toLocaleDateString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewDocument(doc.id)}
                                title="Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
