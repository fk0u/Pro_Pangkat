"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  ArrowLeft, 
  Eye, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SingleDocumentPreviewModal } from "@/components/document-preview-modal"

interface Document {
  id: string;
  name: string;
  code: string;
  fileName: string;
  fileUrl: string;
  status: string;
  notes?: string;
  uploadedAt: string;
}

interface PegawaiDetail {
  id: string;
  name: string;
  nip: string;
  jabatan: string;
  golongan: string;
  unitKerja: string;
}

interface UsulanDetail {
  id: string;
  pegawai: PegawaiDetail;
  golonganAsal: string;
  golonganTujuan: string;
  periode: string;
  status: string;
  tanggalAjukan: string;
  tanggalUpdate: string;
  keterangan: string;
  documents: Document[];
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    DRAFT: { variant: "secondary" as const, label: "Draft", icon: Clock },
    SUBMITTED: { variant: "secondary" as const, label: "Menunggu Verifikasi", icon: Clock },
    PENDING: { variant: "secondary" as const, label: "Menunggu Verifikasi", icon: Clock },
    APPROVED: { variant: "default" as const, label: "Disetujui", icon: CheckCircle, className: "bg-green-500" },
    REJECTED: { variant: "destructive" as const, label: "Ditolak", icon: XCircle },
    DISETUJUI_OPERATOR: { variant: "default" as const, label: "Disetujui Operator", icon: CheckCircle, className: "bg-blue-500" },
    DIPROSES_ADMIN: { variant: "default" as const, label: "Diproses Admin", icon: Clock, className: "bg-blue-500" },
    SELESAI: { variant: "default" as const, label: "Selesai", icon: CheckCircle, className: "bg-green-500" },
    DITOLAK: { variant: "destructive" as const, label: "Ditolak", icon: XCircle },
    DIKEMBALIKAN_OPERATOR: { variant: "outline" as const, label: "Butuh Perbaikan", icon: AlertTriangle, className: "border-orange-500 text-orange-600" },
    DIKEMBALIKAN_ADMIN: { variant: "outline" as const, label: "Butuh Perbaikan dari Admin", icon: AlertTriangle, className: "border-orange-500 text-orange-600" },
    MENUNGGU_VERIFIKASI_DINAS: { variant: "secondary" as const, label: "Menunggu Verifikasi Dinas", icon: Clock },
    MENUNGGU_VERIFIKASI_SEKOLAH: { variant: "secondary" as const, label: "Menunggu Verifikasi Sekolah", icon: Clock },
    PERLU_PERBAIKAN_DARI_DINAS: { variant: "outline" as const, label: "Butuh Perbaikan dari Dinas", icon: AlertTriangle, className: "border-orange-500 text-orange-600" }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={"className" in config ? config.className : ""}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  )
}

export default function UsulanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [usulan, setUsulan] = useState<UsulanDetail | null>(null)
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false)
  const [processAction, setProcessAction] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE')
  const [processNotes, setProcessNotes] = useState('')
  const [processingAction, setProcessingAction] = useState(false)
  
  // Document preview state
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  // Status polling
  const [pollingActive, setPollingActive] = useState(true)
  const pollingInterval = 10000; // 10 seconds

  const fetchUsulanDetail = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const response = await fetch(`/api/operator-sekolah/usulan/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        // Extract usulan from the response data structure
        setUsulan(data.usulan || null);
      } else {
        if (showLoading) {
          toast({
            title: "Error",
            description: "Gagal memuat detail usulan",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
      if (showLoading) {
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat memuat data",
          variant: "destructive"
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [id, toast]);

  useEffect(() => {
    fetchUsulanDetail();
    
    // Set up polling for real-time updates
    if (pollingActive) {
      const interval = setInterval(() => {
        fetchUsulanDetail(false); // Pass false to not show loading state during polling
      }, pollingInterval);
      
      return () => clearInterval(interval);
    }
  }, [id, pollingActive]);

  // Stop polling when the component is unmounted
  useEffect(() => {
    return () => {
      setPollingActive(false);
    };
  }, []);

  const handlePreviewDocument = (document: Document) => {
    setPreviewDocument(document)
    setIsPreviewModalOpen(true)
  }

  const handleProcessUsulan = (action: 'APPROVE' | 'REJECT' | 'RETURN') => {
    setProcessAction(action)
    setProcessNotes('')
    setIsProcessingModalOpen(true)
  }

  const submitProcessAction = async () => {
    if (!usulan) return
    
    try {
      setProcessingAction(true)
      
      // Map the action to a proper API action
      const apiAction = processAction
      
      const response = await fetch(`/api/operator-sekolah/usulan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: apiAction.toLowerCase(),
          notes: processNotes
        })
      })
      
      if (response.ok) {
        setIsProcessingModalOpen(false)
        toast({
          title: "Berhasil",
          description: processAction === 'APPROVE' 
            ? "Usulan berhasil disetujui dan diteruskan ke operator" 
            : processAction === 'REJECT' 
              ? "Usulan berhasil ditolak" 
              : "Usulan berhasil dikembalikan untuk perbaikan"
        })
        fetchUsulanDetail()
      } else {
        const errorData = await response.json()
        toast({
          title: "Gagal",
          description: errorData.message || "Gagal memproses usulan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error processing usulan:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memproses usulan",
        variant: "destructive"
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // Fungsi handleApproveDocument dihapus karena operator-sekolah tidak boleh menyetujui dokumen

  if (loading) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="flex justify-center items-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Memuat detail usulan...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!usulan) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="space-y-6">
          <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Data Tidak Ditemukan</h2>
                <p className="text-muted-foreground">Usulan yang Anda cari tidak dapat ditemukan.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator-sekolah">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
          <div className="flex gap-2">
            {/* Show action buttons only for school operator before forwarding to dinas */}
            {(
              (usulan.status === "SUBMITTED" || usulan.status === "PENDING" || usulan.status === "MENUNGGU_VERIFIKASI_SEKOLAH" || usulan.status === "MENUNGGU_KONFIRMASI")
              && usulan.status !== "MENUNGGU_VERIFIKASI_DINAS"
            ) ? (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleProcessUsulan('REJECT')}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" /> Tolak
                </Button>
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={() => handleProcessUsulan('APPROVE')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/* Main Info Card */}
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl dark:text-white">Detail Usulan Kenaikan Pangkat</CardTitle>
                <CardDescription className="dark:text-slate-400">Data usulan kenaikan pangkat pegawai</CardDescription>
              </div>
              {getStatusBadge(usulan.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg dark:text-white">Informasi Pegawai</h3>
                <dl className="space-y-2">
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama</dt>
                    <dd className="mt-1 text-sm dark:text-white">{usulan.pegawai?.name || 'Tidak tersedia'}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">NIP</dt>
                    <dd className="mt-1 text-sm dark:text-white">{usulan.pegawai?.nip || 'Tidak tersedia'}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Jabatan</dt>
                    <dd className="mt-1 text-sm dark:text-white">{usulan.pegawai?.jabatan || 'Tidak tersedia'}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit Kerja</dt>
                    <dd className="mt-1 text-sm dark:text-white">
                      {typeof usulan.pegawai?.unitKerja === 'string' 
                        ? usulan.pegawai.unitKerja 
                        : typeof usulan.pegawai?.unitKerja === 'object' && usulan.pegawai?.unitKerja !== null
                          ? (usulan.pegawai.unitKerja.nama || 'Tidak tersedia')
                          : 'Tidak tersedia'
                      }
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-lg dark:text-white">Informasi Usulan</h3>
                <dl className="space-y-2">
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pangkat/Golongan Asal</dt>
                    <dd className="mt-1 text-sm dark:text-white">{usulan.golonganAsal}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pangkat/Golongan Tujuan</dt>
                    <dd className="mt-1 text-sm dark:text-white">{usulan.golonganTujuan}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Periode</dt>
                    <dd className="mt-1 text-sm dark:text-white">{usulan.periode || 'Januari 2025'}</dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal Diajukan</dt>
                    <dd className="mt-1 text-sm dark:text-white">
                      {usulan.tanggalAjukan ? 
                        new Date(usulan.tanggalAjukan).toLocaleDateString('id-ID') : 
                        'Tidak tersedia'}
                    </dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Terakhir Diperbarui</dt>
                    <dd className="mt-1 text-sm dark:text-white">
                      {usulan.tanggalUpdate ? 
                        new Date(usulan.tanggalUpdate).toLocaleDateString('id-ID') : 
                        'Tidak tersedia'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {usulan.keterangan && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-lg dark:text-white">Catatan</h3>
                <p className="text-sm p-3 bg-gray-50 dark:bg-slate-800 rounded-md border dark:border-slate-700 dark:text-slate-300">{usulan.keterangan}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card className="dark:bg-slate-900 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Dokumen Pendukung</CardTitle>
            <CardDescription className="dark:text-slate-400">Daftar dokumen yang dilampirkan dalam usulan</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700">
                  <TableHead className="dark:text-slate-300">Jenis Dokumen</TableHead>
                  <TableHead className="dark:text-slate-300">Nama File</TableHead>
                  <TableHead className="dark:text-slate-300">Status</TableHead>
                  <TableHead className="dark:text-slate-300">Tanggal Upload</TableHead>
                  <TableHead className="text-right dark:text-slate-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usulan.documents && usulan.documents.length > 0 ? (
                  usulan.documents.map((doc) => (
                    <TableRow key={doc.id} className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-white">{doc.name || 'Dokumen'}</TableCell>
                      <TableCell className="dark:text-white">{doc.fileName || 'Tidak tersedia'}</TableCell>
                      <TableCell>
                        {doc.status === 'VERIFIED' ? (
                          <Badge variant="default" className="bg-green-500 dark:bg-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> Diverifikasi
                          </Badge>
                        ) : doc.status === 'PENDING' ? (
                          <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-200">
                            <Clock className="w-3 h-3 mr-1" /> Menunggu Verifikasi
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-500 text-orange-600 dark:border-orange-600 dark:text-orange-400">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Perlu Peninjauan
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="dark:text-white">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('id-ID') : 'Tidak tersedia'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handlePreviewDocument(doc)}
                            className="dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                            className="dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {/* Tombol persetujuan dokumen dihapus untuk operator-sekolah karena hanya operator yang boleh melakukan approval */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="dark:border-slate-700">
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground dark:text-slate-400">
                      Tidak ada dokumen yang dilampirkan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Processing Modal */}
        <Dialog open={isProcessingModalOpen} onOpenChange={setIsProcessingModalOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {processAction === 'APPROVE' ? 'Setujui Usulan' : 
                processAction === 'REJECT' ? 'Tolak Usulan' : 'Kembalikan Usulan'}
              </DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                {processAction === 'APPROVE' ? 'Usulan akan disetujui dan diteruskan ke admin untuk proses selanjutnya.' : 
                processAction === 'REJECT' ? 'Usulan akan ditolak dan tidak dapat diproses lebih lanjut.' : 
                'Usulan akan dikembalikan ke pegawai untuk perbaikan.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="notes" className="dark:text-white">Catatan {processAction !== 'APPROVE' && '(Wajib)'}</Label>
                <Textarea
                  id="notes"
                  placeholder={`Berikan catatan untuk ${processAction !== 'APPROVE' ? 'alasan penolakan/pengembalian' : 'usulan ini (opsional)'}`}
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  rows={4}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsProcessingModalOpen(false)} 
                disabled={processingAction}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Batal
              </Button>
              <Button 
                onClick={submitProcessAction} 
                disabled={processingAction || (processAction !== 'APPROVE' && !processNotes.trim())}
                variant={processAction === 'APPROVE' ? 'default' : processAction === 'REJECT' ? 'destructive' : 'outline'}
                className={`${processAction === 'RETURN' ? 'border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-slate-800' : 
                  processAction === 'APPROVE' ? 'dark:bg-green-700 dark:hover:bg-green-600' : 
                  processAction === 'REJECT' ? 'dark:bg-red-800 dark:hover:bg-red-700' : ''}`}
              >
                {processingAction ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : processAction === 'APPROVE' ? (
                  'Setujui Usulan'
                ) : processAction === 'REJECT' ? (
                  'Tolak Usulan'
                ) : (
                  'Kembalikan untuk Perbaikan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Preview Modal */}
        {previewDocument && (
          <SingleDocumentPreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            documentId={previewDocument.id}
            documentName={previewDocument.fileName}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
