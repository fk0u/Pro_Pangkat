"use client"

import { useState, useEffect } from "react"
import { Eye, Search, Info, Mail, CheckCircle, X, FileText, Download, MessageCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { formatWilayahForDisplay } from "@/lib/wilayah-utils"

interface DocumentItem {
  id: string
  filename: string
  originalName: string
  status: string
  catatan: string | null
  uploadedAt: string
  verifiedAt: string | null
  requirement: {
    id: string
    name: string
    description: string | null
    isRequired: boolean
    category: string | null
    format: string | null
    maxSize: number | null
  }
}

interface Proposal {
  id: string
  periode: string
  status: string
  createdAt: string
  updatedAt: string
  pegawai: {
    id: string
    name: string
    nip: string
    unitKerja: string
    jabatan: string
    golongan: string
    wilayah: string
  }
  documents: DocumentItem[]
  documentProgress: {
    total: number
    completed: number
    pending: number
    rejected: number
    percentage: number
  }
}

interface InboxData {
  proposals: Proposal[]
  stats: {
    total: number
    menunggu: number
    diproses: number
    disetujui: number
    dikembalikan: number
  }
  filterOptions: {
    unitKerja: string[]
    status: { value: string; label: string }[]
  }
}

export default function InboxClient() {
  const [data, setData] = useState<InboxData | null>(null)
  const [search, setSearch] = useState("")
  const [unitKerjaFilter, setUnitKerjaFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | "process" | null>(null)
  const [actionNote, setActionNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchInboxData()
  }, [])

  const fetchInboxData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      if (unitKerjaFilter !== "all") params.set("unitKerja", unitKerjaFilter)

      const response = await fetch(`/api/operator/inbox?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error("Error fetching inbox data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInboxData()
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [search, unitKerjaFilter, statusFilter])

  const handleShowDetail = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setShowDetailModal(true)
  }

  const handleAction = (proposal: Proposal, type: "approve" | "reject" | "process") => {
    setSelectedProposal(proposal)
    setActionType(type)
    setActionNote("")
    setShowActionModal(true)
  }

  const submitAction = async () => {
    if (!selectedProposal || !actionType) return

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/operator/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: selectedProposal.id,
          action: actionType,
          catatan: actionNote,
        }),
      })

      if (response.ok) {
        setShowActionModal(false)
        setSelectedProposal(null)
        setActionType(null)
        setActionNote("")
        await fetchInboxData() // Refresh data
      }
    } catch (error) {
      console.error("Error submitting action:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DIAJUKAN: { label: "Perlu Verifikasi", className: "bg-orange-100 text-orange-800" },
      DIPROSES_OPERATOR: { label: "Sedang Diproses", className: "bg-blue-100 text-blue-800" },
      DISETUJUI_OPERATOR: { label: "Disetujui", className: "bg-green-100 text-green-800" },
      DIKEMBALIKAN_OPERATOR: { label: "Dikembalikan", className: "bg-red-100 text-red-800" },
    }
    
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
  }

  const getDocumentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      MENUNGGU_VERIFIKASI: { label: "Menunggu", className: "bg-yellow-100 text-yellow-800" },
      DISETUJUI: { label: "Disetujui", className: "bg-green-100 text-green-800" },
      DITOLAK: { label: "Ditolak", className: "bg-red-100 text-red-800" },
    }
    
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Baru saja"
    if (diffInHours < 24) return `${diffInHours} jam lalu`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} hari lalu`
  }

  if (isLoading) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data inbox...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Mail className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Inbox Usulan</h1>
                <p className="text-green-100">Kelola usulan kenaikan pangkat pegawai</p>
              </div>
            </div>

            {data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{data.stats.total}</div>
                  <div className="text-sm text-green-200">Total Usulan</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{data.stats.menunggu}</div>
                  <div className="text-sm text-green-200">Perlu Verifikasi</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{data.stats.diproses}</div>
                  <div className="text-sm text-green-200">Sedang Diproses</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{data.stats.disetujui}</div>
                  <div className="text-sm text-green-200">Telah Disetujui</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Filter Section */}
          <Card className="shadow-md rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl">Filter Usulan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Select onValueChange={setUnitKerjaFilter} defaultValue="all">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit Kerja</SelectItem>
                  {data?.filterOptions.unitKerja.map((unitKerja) => (
                    <SelectItem key={unitKerja} value={unitKerja}>
                      {unitKerja}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setStatusFilter} defaultValue="all">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status Usulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {data?.filterOptions.status.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-[200px]">
                <Input
                  placeholder="Cari nama/NIP"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          {/* Proposals List */}
          <Card className="shadow-md rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl">Daftar Usulan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Menampilkan {data?.proposals.length || 0} usulan untuk diverifikasi
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm border-separate border-spacing-y-2">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th className="px-4">No</th>
                    <th className="px-4">Nama / NIP</th>
                    <th className="px-4">Unit Kerja</th>
                    <th className="px-4">Jabatan</th>
                    <th className="px-4">Periode</th>
                    <th className="px-4">Dokumen</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Waktu</th>
                    <th className="px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.proposals && data.proposals.length > 0 ? (
                    data.proposals.map((proposal, index) => (
                      <tr
                        key={proposal.id}
                        className="bg-white dark:bg-gray-900 shadow-sm border hover:shadow-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg overflow-hidden"
                      >
                        <td className="px-4 py-3 align-top rounded-l-lg">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{proposal.pegawai.name}</div>
                          <div className="text-gray-500 text-xs">{proposal.pegawai.nip}</div>
                          <div className="text-gray-500 text-xs">{formatWilayahForDisplay(proposal.pegawai.wilayah)}</div>
                        </td>
                        <td className="px-4 py-3">{proposal.pegawai.unitKerja}</td>
                        <td className="px-4 py-3">
                          <div>{proposal.pegawai.jabatan}</div>
                          <div className="text-xs text-gray-500">{proposal.pegawai.golongan}</div>
                        </td>
                        <td className="px-4 py-3">{proposal.periode}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              {proposal.documentProgress.completed}/{proposal.documentProgress.total}
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`bg-blue-600 h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${Math.min(proposal.documentProgress.percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{proposal.documentProgress.percentage}%</span>
                          </div>
                          {proposal.documentProgress.pending > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              {proposal.documentProgress.pending} perlu verifikasi
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(proposal.status)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatRelativeTime(proposal.updatedAt)}
                        </td>
                        <td className="px-4 py-3 space-x-2 rounded-r-lg">
                          <div className="flex flex-col space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => handleShowDetail(proposal)}
                            >
                              <Eye className="h-3 w-3 mr-1" /> Detail
                            </Button>
                            
                            {proposal.status === "DIAJUKAN" && (
                              <div className="flex space-x-1">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAction(proposal, "approve")}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Setuju
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={() => handleAction(proposal, "reject")}
                                >
                                  <X className="h-3 w-3 mr-1" /> Tolak
                                </Button>
                              </div>
                            )}
                            
                            {proposal.status === "DIPROSES_OPERATOR" && (
                              <div className="text-xs text-blue-600 text-center">
                                Sedang diproses
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada usulan yang ditemukan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Usulan Pegawai</DialogTitle>
            </DialogHeader>
            
            {selectedProposal && (
              <div className="space-y-6">
                {/* Pegawai Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Nama Pegawai</p>
                    <p className="font-medium">{selectedProposal.pegawai.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">NIP</p>
                    <p className="font-medium">{selectedProposal.pegawai.nip}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unit Kerja</p>
                    <p className="font-medium">{selectedProposal.pegawai.unitKerja}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jabatan</p>
                    <p className="font-medium">{selectedProposal.pegawai.jabatan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Golongan</p>
                    <p className="font-medium">{selectedProposal.pegawai.golongan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Wilayah</p>
                    <p className="font-medium">{formatWilayahForDisplay(selectedProposal.pegawai.wilayah)}</p>
                  </div>
                </div>

                {/* Document Progress */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Progress Dokumen
                  </h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{selectedProposal.documentProgress.total}</div>
                      <div className="text-sm text-blue-700">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{selectedProposal.documentProgress.completed}</div>
                      <div className="text-sm text-green-700">Disetujui</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{selectedProposal.documentProgress.pending}</div>
                      <div className="text-sm text-orange-700">Menunggu</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{selectedProposal.documentProgress.rejected}</div>
                      <div className="text-sm text-red-700">Ditolak</div>
                    </div>
                  </div>
                </div>

                {/* Documents List */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Daftar Dokumen ({selectedProposal.documents.length})
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedProposal.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {doc.requirement.name}
                                </span>
                              </div>
                              {getDocumentStatusBadge(doc.status)}
                              {doc.requirement.isRequired && (
                                <Badge variant="outline" className="text-xs">Wajib</Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <p>File: {doc.originalName}</p>
                              {doc.requirement.description && (
                                <p>Deskripsi: {doc.requirement.description}</p>
                              )}
                            </div>
                            
                            {doc.catatan && (
                              <div className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                                <strong>Catatan:</strong> {doc.catatan}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                              <span>Upload: {formatRelativeTime(doc.uploadedAt)}</span>
                              {doc.verifiedAt && (
                                <span>Verifikasi: {formatRelativeTime(doc.verifiedAt)}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Setujui Usulan" : 
                 actionType === "reject" ? "Tolak Usulan" : "Proses Usulan"}
              </DialogTitle>
            </DialogHeader>
            
            {selectedProposal && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-sm">
                    <strong>Pegawai:</strong> {selectedProposal.pegawai.name}<br />
                    <strong>NIP:</strong> {selectedProposal.pegawai.nip}<br />
                    <strong>Unit Kerja:</strong> {selectedProposal.pegawai.unitKerja}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Catatan {actionType === "reject" ? "(Wajib)" : "(Opsional)"}
                  </label>
                  <Textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder={
                      actionType === "approve" ? "Tambahkan catatan persetujuan..." :
                      actionType === "reject" ? "Jelaskan alasan penolakan..." :
                      "Tambahkan catatan pemrosesan..."
                    }
                    rows={4}
                  />
                </div>

                {actionType === "reject" && !actionNote.trim() && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Catatan wajib diisi untuk penolakan</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowActionModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={submitAction}
                disabled={isSubmitting || (actionType === "reject" && !actionNote.trim())}
                className={
                  actionType === "approve" ? "bg-green-600 hover:bg-green-700" :
                  actionType === "reject" ? "bg-red-600 hover:bg-red-700" :
                  "bg-blue-600 hover:bg-blue-700"
                }
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {actionType === "approve" ? <CheckCircle className="h-4 w-4" /> :
                     actionType === "reject" ? <X className="h-4 w-4" /> :
                     <MessageCircle className="h-4 w-4" />}
                    <span>
                      {actionType === "approve" ? "Setujui" :
                       actionType === "reject" ? "Tolak" : "Proses"}
                    </span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
