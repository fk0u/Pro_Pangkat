"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type Usulan = {
  id: string
  periode: string
  status: string
  updatedAt: string
  unitKerja: string
  unitKerjaId: string
  documentStats: {
    total: number
    approved: number
    pending: number
    needsRevision: number
    rejected: number
    required: number
    missing: number
  }
  canUploadDocuments: boolean
  needsAttention: boolean
  canWithdraw: boolean
}

export default function RiwayatUsulanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [usulanList, setUsulanList] = useState<Usulan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pegawai/proposals')
      
      if (response.ok) {
        const data = await response.json()
        
        // Transform API data to match our Usulan type
        const transformedData: Usulan[] = data.map((proposal: any) => {
          // Ensure all document stats fields are set with defaults if missing
          const documentStats = proposal.documentStats || {
            total: proposal.documents?.length || 0,
            approved: proposal.documents?.filter((d: any) => d.status === 'APPROVED' || d.status === 'DISETUJUI').length || 0,
            pending: proposal.documents?.filter((d: any) => d.status === 'PENDING' || d.status === 'MENUNGGU_VERIFIKASI').length || 0,
            needsRevision: proposal.documents?.filter((d: any) => d.status === 'NEEDS_REVISION' || d.status === 'PERLU_PERBAIKAN').length || 0,
            rejected: proposal.documents?.filter((d: any) => d.status === 'REJECTED' || d.status === 'DITOLAK').length || 0,
            required: 15, // Default assumption
            missing: 15 - (proposal.documents?.length || 0)
          };
          
          return {
            id: proposal.id,
            periode: proposal.periode || 'Tidak tersedia',
            status: proposal.status,
            updatedAt: proposal.updatedAt || new Date().toISOString(),
            documentStats: documentStats,
            unitKerja: proposal.unitKerja?.nama || proposal.pegawai?.unitKerja || 'Tidak tersedia',
            unitKerjaId: proposal.unitKerjaId || proposal.pegawai?.unitKerjaId || '',
            canUploadDocuments: proposal.canUploadDocuments || ['DRAFT', 'PERLU_PERBAIKAN_DARI_DINAS', 'PERLU_PERBAIKAN_DARI_SEKOLAH'].includes(proposal.status),
            needsAttention: proposal.needsAttention || ['DRAFT', 'PERLU_PERBAIKAN_DARI_DINAS', 'PERLU_PERBAIKAN_DARI_SEKOLAH'].includes(proposal.status),
            canWithdraw: ['MENUNGGU_VERIFIKASI_DINAS', 'MENUNGGU_VERIFIKASI_SEKOLAH', 'DIAJUKAN'].includes(proposal.status),
          }
        });
        
        setUsulanList(transformedData)
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch proposals');
      }
    } catch (error) {
      console.error("Error fetching proposals:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengambil data usulan",
        variant: "destructive",
      })
      
      // Fallback to mock data if API fails
      const mockData: Usulan[] = [
        { 
          id: "usl-001", 
          periode: "April 2024", 
          status: "SELESAI", 
          updatedAt: "2024-04-20T10:00:00Z",
          documentStats: { total: 15, approved: 15, pending: 0, needsRevision: 0, rejected: 0, required: 15, missing: 0 },
          unitKerja: "SMA Negeri 1 Samarinda",
          unitKerjaId: "",
          canUploadDocuments: false,
          needsAttention: false,
          canWithdraw: false
        },
        { 
          id: "usl-002", 
          periode: "Oktober 2024", 
          status: "DRAFT", 
          updatedAt: "2024-10-15T10:00:00Z",
          documentStats: { total: 0, approved: 0, pending: 0, needsRevision: 0, rejected: 0, required: 15, missing: 15 },
          unitKerja: "SMA Negeri 1 Samarinda",
          unitKerjaId: "",
          canUploadDocuments: true,
          needsAttention: true,
          canWithdraw: false
        },
        {
          id: "usl-003",
          periode: "Agustus 2025",
          status: "MENUNGGU_VERIFIKASI_DINAS",
          updatedAt: "2025-06-28T10:00:00Z",
          documentStats: { total: 10, approved: 8, pending: 2, needsRevision: 0, rejected: 0, required: 15, missing: 5 },
          unitKerja: "SMA Negeri 1 Samarinda",
          unitKerjaId: "",
          canUploadDocuments: false,
          needsAttention: false,
          canWithdraw: true
        },
        {
          id: "usl-004",
          periode: "Desember 2025",
          status: "DIAJUKAN",
          updatedAt: "2025-07-01T10:00:00Z",
          documentStats: { total: 15, approved: 12, pending: 3, needsRevision: 0, rejected: 0, required: 15, missing: 0 },
          unitKerja: "SMA Negeri 1 Samarinda",
          unitKerjaId: "",
          canUploadDocuments: false,
          needsAttention: false,
          canWithdraw: true
        },
      ]
      setUsulanList(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdrawUsulan = async (usulanId: string) => {
    const confirmed = window.confirm("Apakah Anda yakin ingin menarik usulan ini? Tindakan ini tidak dapat dibatalkan.")
    
    if (confirmed) {
      try {
        toast({
          title: "Menarik usulan...",
          description: "Harap tunggu sebentar."
        });
        
        const response = await fetch(`/api/pegawai/proposals/${usulanId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'withdraw',
            notes: 'Usulan ditarik oleh pegawai dari halaman riwayat usulan'
          })
        })

        if (response.ok) {
          toast({
            title: "Berhasil",
            description: "Usulan berhasil ditarik"
          })
          // Refresh data
          fetchData()
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Gagal menarik usulan');
        }
      } catch (error) {
        console.error("Error withdrawing proposal:", error);
        toast({
          title: "Error", 
          description: error instanceof Error ? error.message : "Gagal menarik usulan",
          variant: "destructive"
        })
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
      case "DISETUJUI":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Selesai</Badge>
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

  return (
    <DashboardLayout userType="pegawai">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Usulan</h1>
          <p className="text-muted-foreground">Daftar semua usulan kenaikan pangkat yang pernah Anda ajukan.</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Status Terakhir</TableHead>
                    <TableHead>Dokumen</TableHead>
                    <TableHead className="hidden sm:table-cell">Pembaruan Terakhir</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : usulanList.length > 0 ? (
                    usulanList.map((usulan) => (
                      <TableRow key={usulan.id}>
                        <TableCell className="font-medium">{usulan.periode}</TableCell>
                        <TableCell className="font-medium">{usulan.unitKerja}</TableCell>
                        <TableCell>{getStatusBadge(usulan.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {usulan.documentStats.total} dari {usulan.documentStats.required} dokumen
                            </div>
                            {usulan.documentStats.missing > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {usulan.documentStats.missing} belum lengkap
                              </Badge>
                            )}
                            {usulan.documentStats.needsRevision > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {usulan.documentStats.needsRevision} perlu perbaikan
                              </Badge>
                            )}
                            {usulan.documentStats.pending > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 text-xs">
                                {usulan.documentStats.pending} menunggu verifikasi
                              </Badge>
                            )}
                            {usulan.documentStats.approved > 0 && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-xs">
                                {usulan.documentStats.approved} disetujui
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {new Date(usulan.updatedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col sm:flex-row gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/pegawai/usulan/${usulan.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-0 sm:mr-2" />
                              <span className="hidden sm:inline">Detail</span>
                            </Button>
                            {usulan.needsAttention && usulan.canUploadDocuments && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => router.push(`/pegawai/input-usulan?edit=${usulan.id}`)}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                <FileText className="h-4 w-4 mr-0 sm:mr-2" />
                                <span className="hidden sm:inline">Lengkapi Dokumen</span>
                                <span className="sm:hidden">Lengkapi</span>
                              </Button>
                            )}
                            {usulan.canWithdraw && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWithdrawUsulan(usulan.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-0 sm:mr-2" />
                                <span className="hidden sm:inline">Tarik Usulan</span>
                                <span className="sm:hidden">Tarik</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        Anda belum pernah mengajukan usulan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
