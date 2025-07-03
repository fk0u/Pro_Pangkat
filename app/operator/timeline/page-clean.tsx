"use client"

import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, FileText, Info, Download, AlertTriangle, CheckCircle,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { safeObjectEntries, safeMapToArray, isValidArray, ensureArray, ensureString } from "@/lib/safe-utils"

interface DocumentRequirement {
  id: string
  name: string
  description: string | null
  isRequired: boolean
  format: string | null
  maxSize: number | null
  category: string | null
}

interface DocumentRequirementsData {
  requirements: DocumentRequirement[]
  groupedByCategory: Record<string, DocumentRequirement[]>
  summary: {
    total: number
    required: number
    optional: number
    categories: number
  }
}

export default function TimelinePage() {
  const [openModal, setOpenModal] = useState(false)
  const [selectedTimeline, setSelectedTimeline] = useState<any>(null)
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirementsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<any>(null)
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true)

  useEffect(() => {
    fetchTimelineData()
  }, [])

  useEffect(() => {
    if (openModal && selectedTimeline) {
      fetchDocumentRequirements()
    }
  }, [openModal, selectedTimeline])

  const fetchTimelineData = async () => {
    try {
      setIsLoadingTimeline(true)
      const response = await fetch('/api/operator/timeline')
      if (response.ok) {
        const result = await response.json()
        setTimelineData(result.data.timelineData || [])
        setCurrentPeriod(result.data.currentPeriod || null)
      } else {
        console.error('Failed to fetch timeline data:', response.status)
        // Set fallback data if API fails
        setTimelineData(fallbackTimelineData)
        setCurrentPeriod({ title: "Periode Agustus 2025" })
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error)
      // Set fallback data if request fails
      setTimelineData(fallbackTimelineData)
      setCurrentPeriod({ title: "Periode Agustus 2025" })
    } finally {
      setIsLoadingTimeline(false)
    }
  }

  const fetchDocumentRequirements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/document-requirements')
      if (response.ok) {
        const result = await response.json()
        setDocumentRequirements(result.data)
      }
    } catch (error) {
      console.error('Error fetching document requirements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback data in case API fails
  const fallbackTimelineData = [
    {
      id: "pelaksana",
      title: "Jabatan Pelaksana",
      total: 0,
      status: "active",
      periods: [
        {
          type: "Waktu Pengusulan",
          startDate: "5 Mei 2025",
          endDate: "19 Mei 2025",
        },
        {
          type: "Waktu Perbaikan",
          startDate: "5 Mei 2025",
          endDate: "28 Mei 2025",
        },
      ],
      pegawai: [],
    },
    {
      id: "struktural",
      title: "Jabatan Struktural",
      total: 0,
      status: "active",
      periods: [
        {
          type: "Waktu Pengusulan",
          startDate: "5 Mei 2025",
          endDate: "19 Mei 2025",
        },
        {
          type: "Waktu Perbaikan",
          startDate: "5 Mei 2025",
          endDate: "28 Mei 2025",
        },
      ],
      pegawai: [],
    },
    {
      id: "fungsional",
      title: "Jabatan Fungsional",
      total: 0,
      status: "active",
      periods: [
        {
          type: "Waktu Pengusulan",
          startDate: "5 Mei 2025",
          endDate: "19 Mei 2025",
        },
        {
          type: "Waktu Perbaikan",
          startDate: "5 Mei 2025",
          endDate: "28 Mei 2025",
        },
      ],
      pegawai: [],
    },
  ]

  const formatFileSize = (sizeInBytes: number | null): string => {
    if (!sizeInBytes) return "Tidak ditentukan"
    const mb = sizeInBytes / (1024 * 1024)
    return `${mb} MB`
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-700">Aktif</Badge>
    ) : null
  }

  if (isLoadingTimeline) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data timeline...</p>
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
              <Calendar className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Timeline Kenaikan Pangkat</h1>
                <p className="text-green-100">{currentPeriod?.title || "Periode Agustus 2025"}</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-green-200" />
                <p className="text-green-100">
                  Pastikan Anda mengikuti timeline yang telah ditetapkan untuk kelancaran proses kenaikan pangkat
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timelineData && timelineData.length > 0 ? timelineData.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{item.title}</CardTitle>
                  {getStatusBadge(item.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-blue-700 mb-1">{item.total || 0}</p>
                  <p className="text-muted-foreground text-sm">Total Usulan</p>
                </div>

                {item.periods && item.periods.length > 0 ? item.periods.map((p: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">{p.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {p.startDate} - {p.endDate}
                    </p>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground">
                    Tidak ada periode yang tersedia
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedTimeline(item)
                    setOpenModal(true)
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" /> Berkas yang Perlu Disiapkan
                </Button>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Tidak ada data timeline yang tersedia</p>
            </div>
          )}
        </div>

        {/* Popup Modal */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Berkas yang Perlu Disiapkan - {selectedTimeline?.title}</DialogTitle>
            </DialogHeader>
            {selectedTimeline && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Info:</strong> Berikut adalah daftar lengkap berkas yang harus disiapkan pegawai untuk pengajuan <strong>{selectedTimeline.title}</strong>.
                  </p>
                </div>

                {!isLoading && documentRequirements && isValidArray(documentRequirements.requirements) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600">{documentRequirements.summary?.total || 0}</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">Total Berkas</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center border border-red-200 dark:border-red-800">
                        <div className="text-2xl font-bold text-red-600">{documentRequirements.summary?.required || 0}</div>
                        <div className="text-sm text-red-700 dark:text-red-300">Berkas Wajib</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-200 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-600">{documentRequirements.summary?.optional || 0}</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Berkas Opsional</div>
                      </div>
                    </div>

                    {documentRequirements.groupedByCategory && safeObjectEntries(documentRequirements.groupedByCategory).map(([category, docs]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            Kategori: {ensureString(category)}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {ensureArray(docs).length} berkas
                          </Badge>
                        </div>
                        <div className="grid gap-3">
                          {safeMapToArray(ensureArray(docs), (doc: any) => (
                            <div key={doc.id || Math.random()} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-gray-200 dark:border-gray-700">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-2 h-2 rounded-full ${doc.isRequired ? 'bg-red-500' : 'bg-green-500'}`} />
                                      <span className="font-medium text-gray-900 dark:text-gray-100 text-base">{ensureString(doc.name)}</span>
                                    </div>
                                    <Badge variant={doc.isRequired ? "destructive" : "secondary"} className="text-xs">
                                      {doc.isRequired ? "WAJIB" : "OPSIONAL"}
                                    </Badge>
                                  </div>
                                  
                                  {doc.description && (
                                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <p className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>Keterangan:</strong> {ensureString(doc.description)}
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    {doc.format && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-500">Format:</span>
                                        <Badge variant="outline" className="text-xs">
                                          {ensureString(doc.format).toUpperCase()}
                                        </Badge>
                                      </div>
                                    )}
                                    {doc.maxSize && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-500">Ukuran maks:</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                          {formatFileSize(doc.maxSize)}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {doc.isRequired && (
                                    <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
                                      <AlertTriangle className="h-4 w-4" />
                                      <span className="font-medium">Berkas ini wajib dilengkapi</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="ml-4">
                                  <Button size="sm" variant="outline" className="text-xs">
                                    <Download className="h-3 w-3 mr-1" />
                                    Template
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Memuat daftar berkas...</p>
                  </div>
                )}

                {selectedTimeline && selectedTimeline.pegawai && selectedTimeline.pegawai.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Progress Pengumpulan Dokumen Pegawai
                    </h4>
                    <div className="grid gap-2">
                      {safeMapToArray(ensureArray(selectedTimeline.pegawai), (p: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{ensureString(p.nama)}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{ensureString(p.dokumen)} dokumen</span>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setOpenModal(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
