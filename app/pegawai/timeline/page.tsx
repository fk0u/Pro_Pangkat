"use client"

import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, FileText, AlertCircle, CheckCircle, Info, Download, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  groupedByType: Record<string, DocumentRequirement[]>
  summary: {
    total: number
    required: number
    optional: number
    hasSimASN: number
  }
}

export default function TimelinePage() {
  const [selectedTimeline, setSelectedTimeline] = useState<any>(null)
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirementsData | null>(null)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDocumentRequirements()
    fetchTimelineData()
  }, [])

  const fetchTimelineData = async () => {
    try {
      const response = await fetch('/api/pegawai/timeline')
      if (response.ok) {
        const result = await response.json()
        // Transform API data to match existing UI structure
        const transformedData = [
          {
            id: 1,
            title: "Jabatan Pelaksana",
            description: "Timeline kenaikan pangkat untuk jabatan pelaksana",
            status: "active",
            category: "Pelaksana",
            periods: [
              {
                type: "Waktu Pengusulan",
                startDate: "5 Mei 2025",
                endDate: "19 Mei 2025",
                status: "active",
                daysLeft: 15,
              },
              {
                type: "Waktu Perbaikan",
                startDate: "5 Mei 2025",
                endDate: "28 Mei 2025",
                status: "upcoming",
                daysLeft: 24,
              },
            ],
            realTimelineData: result.data.timeline || [], // Add real data here
          },
          {
            id: 2,
            title: "Jabatan Struktural",
            description: "Timeline kenaikan pangkat untuk jabatan struktural",
            status: "upcoming",
            category: "Struktural",
            periods: [
              {
                type: "Waktu Pengusulan",
                startDate: "1 Juni 2025",
                endDate: "15 Juni 2025",
                status: "upcoming",
                daysLeft: 45,
              },
            ],
            realTimelineData: result.data.timeline || [],
          },
          {
            id: 3,
            title: "Jabatan Fungsional",
            description: "Timeline kenaikan pangkat untuk jabatan fungsional",
            status: "upcoming",
            category: "Fungsional",
            periods: [
              {
                type: "Waktu Pengusulan",
                startDate: "15 Juni 2025",
                endDate: "30 Juni 2025",
                status: "upcoming",
                daysLeft: 30,
              },
              {
                type: "Waktu Penilaian Kompetensi",
                startDate: "1 Juli 2025",
                endDate: "15 Juli 2025",
                status: "upcoming",
                daysLeft: 45,
              },
            ],
            realTimelineData: result.data.timeline || [],
          },
        ]
        setTimelineData(transformedData)
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error)
      // Fallback to static data
      setTimelineData([
        {
          id: 1,
          title: "Jabatan Pelaksana",
          description: "Timeline kenaikan pangkat untuk jabatan pelaksana",
          status: "active",
          category: "Pelaksana",
          periods: [
            {
              type: "Waktu Pengusulan",
              startDate: "5 Mei 2025",
              endDate: "19 Mei 2025",
              status: "active",
              daysLeft: 15,
            },
            {
              type: "Waktu Perbaikan",
              startDate: "5 Mei 2025",
              endDate: "28 Mei 2025",
              status: "upcoming",
              daysLeft: 24,
            },
          ],
        },
        {
          id: 2,
          title: "Jabatan Struktural",
          description: "Timeline kenaikan pangkat untuk jabatan struktural",
          status: "upcoming",
          category: "Struktural",
          periods: [
            {
              type: "Waktu Pengusulan",
              startDate: "1 Juni 2025",
              endDate: "15 Juni 2025",
              status: "upcoming",
              daysLeft: 45,
            },
          ],
        },
        {
          id: 3,
          title: "Jabatan Fungsional",
          description: "Timeline kenaikan pangkat untuk jabatan fungsional",
          status: "upcoming",
          category: "Fungsional",
          periods: [
            {
              type: "Waktu Pengusulan",
              startDate: "15 Juni 2025",
              endDate: "30 Juni 2025",
              status: "upcoming",
              daysLeft: 30,
            },
            {
              type: "Waktu Penilaian Kompetensi",
              startDate: "1 Juli 2025",
              endDate: "15 Juli 2025",
              status: "upcoming",
              daysLeft: 45,
            },
          ],
        },
      ])
    }
  }

  const fetchDocumentRequirements = async () => {
    try {
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

  const getDocumentsForCategory = (category: string): DocumentRequirement[] => {
    if (!documentRequirements) return []
    
    // Return documents for the specific category, or all documents
    const categoryDocs = documentRequirements.groupedByType[category] || []
    const allDocs = documentRequirements.requirements || []
    
    return categoryDocs.length > 0 ? categoryDocs : allDocs
  }

  const formatFileSize = (sizeInBytes: number | null): string => {
    if (!sizeInBytes) return "Tidak ditentukan"
    const mb = sizeInBytes / (1024 * 1024)
    return `${mb} MB`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "upcoming":
        return "bg-blue-500"
      case "expired":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>
      case "upcoming":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Akan Datang</Badge>
      case "expired":
        return <Badge variant="destructive">Berakhir</Badge>
      default:
        return <Badge variant="secondary">Tidak Aktif</Badge>
    }
  }

  return (
    <DashboardLayout userType="pegawai">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-sky-500 to-teal-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Timeline Kenaikan Pangkat</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Pastikan Anda mengikuti timeline yang telah ditetapkan untuk kelancaran proses kenaikan pangkat
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {timelineData.map((timeline, index) => (
            <motion.div
              key={timeline.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {timeline.title}
                    </CardTitle>
                    {getStatusBadge(timeline.status)}
                  </div>
                  <CardDescription>{timeline.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Timeline Periods */}
                  {timeline.periods.map((period, periodIndex) => (
                    <div key={periodIndex} className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(period.status)}`} />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{period.type}</h4>
                      </div>

                      <div className="ml-6 space-y-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {period.startDate} - {period.endDate}
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2" />
                          <span
                            className={
                              period.status === "active"
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : "text-gray-600 dark:text-gray-400"
                            }
                          >
                            {period.status === "active" ? `${period.daysLeft} hari tersisa` : `${period.daysLeft} hari`}
                          </span>
                        </div>

                        {period.status === "active" && period.daysLeft <= 7 && (
                          <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span className="font-medium">Segera berakhir!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Action Buttons */}
                  <div className="pt-4 space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" onClick={() => setSelectedTimeline(timeline)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Berkas yang Perlu Disiapkan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Berkas yang Perlu Disiapkan - {timeline.title}</DialogTitle>
                          <DialogDescription>
                            Daftar lengkap berkas yang harus disiapkan untuk pengajuan kenaikan pangkat {timeline.title.toLowerCase()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center mb-2">
                              <Info className="h-5 w-5 text-amber-600 mr-2" />
                              <h4 className="font-semibold text-amber-900 dark:text-amber-100">Panduan Persiapan Berkas</h4>
                            </div>
                            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                              <p>• Siapkan semua berkas wajib sebelum melakukan pengajuan usulan</p>
                              <p>• Berkas opsional dapat dilengkapi untuk memperkuat usulan Anda</p>
                              <p>• Pastikan format dan ukuran file sesuai ketentuan yang berlaku</p>
                              <p>• Scan dokumen dengan kualitas yang jelas dan dapat dibaca</p>
                            </div>
                          </div>

                          {!isLoading && documentRequirements && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                                  <div className="text-2xl font-bold text-blue-600">{documentRequirements.summary.total}</div>
                                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Berkas</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center border border-red-200 dark:border-red-800">
                                  <div className="text-2xl font-bold text-red-600">{documentRequirements.summary.required}</div>
                                  <div className="text-sm text-red-700 dark:text-red-300">Berkas Wajib</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-200 dark:border-green-800">
                                  <div className="text-2xl font-bold text-green-600">{documentRequirements.summary.optional}</div>
                                  <div className="text-sm text-green-700 dark:text-green-300">Berkas Opsional</div>
                                </div>
                              </div>

                              {Object.entries(documentRequirements.groupedByType).map(([category, docs]) => (
                                <div key={category} className="space-y-3">
                                  <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                      Kategori: {category}
                                    </h4>
                                    <Badge variant="outline" className="text-xs">
                                      {docs.length} berkas
                                    </Badge>
                                  </div>
                                  <div className="grid gap-3">
                                    {docs.map((doc, index) => (
                                      <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-gray-200 dark:border-gray-700">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                              <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${doc.isRequired ? 'bg-red-500' : 'bg-green-500'}`} />
                                                <span className="font-medium text-gray-900 dark:text-gray-100 text-base">{doc.name}</span>
                                              </div>
                                              <Badge variant={doc.isRequired ? "destructive" : "secondary"} className="text-xs">
                                                {doc.isRequired ? "WAJIB" : "OPSIONAL"}
                                              </Badge>
                                            </div>
                                            
                                            {doc.description && (
                                              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                                  <strong>Keterangan:</strong> {doc.description}
                                                </p>
                                              </div>
                                            )}
                                            
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                              {doc.format && (
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-gray-500">Format:</span>
                                                  <Badge variant="outline" className="text-xs">
                                                    {doc.format.toUpperCase()}
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

                              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center">
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  Tips Persiapan Berkas
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-800 dark:text-green-200">
                                  <div>
                                    <strong>Kualitas Dokumen:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                      <li>Scan dengan resolusi minimal 300 DPI</li>
                                      <li>Pastikan teks dapat dibaca dengan jelas</li>
                                      <li>Hindari bayangan atau lipatan pada dokumen</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <strong>Format & Ukuran:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                      <li>Simpan dalam format PDF untuk dokumen utama</li>
                                      <li>Kompres file jika ukuran terlalu besar</li>
                                      <li>Gunakan nama file yang deskriptif</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {isLoading && (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="mt-2 text-gray-600">Memuat daftar berkas...</p>
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex space-x-3">
                              <Button className="flex-1" onClick={() => (window.location.href = "/pegawai/input-usulan")}>
                                <FileText className="h-4 w-4 mr-2" />
                                Mulai Input Usulan
                              </Button>
                              <Button variant="outline" className="px-6">
                                <Download className="h-4 w-4 mr-2" />
                                Unduh Checklist
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {timeline.status === "active" && (
                      <Button
                        className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600"
                        onClick={() => (window.location.href = "/pegawai/input-usulan")}
                      >
                        Ajukan Sekarang
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                Informasi Penting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Ketentuan Umum:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Pengajuan hanya dapat dilakukan pada periode yang telah ditentukan</li>
                    <li>• Semua dokumen harus dalam format PDF dengan ukuran maksimal 5MB</li>
                    <li>• Dokumen yang tidak sesuai akan dikembalikan untuk perbaikan</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Kontak Bantuan:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Email: bkpsdm@kaltimprov.go.id</li>
                    <li>• Telepon: (0541) 123456</li>
                    <li>• WhatsApp: 08123456789</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
