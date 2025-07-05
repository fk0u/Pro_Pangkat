"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, AlertTriangle, Info } from "lucide-react"
import TimelineView from "@/components/timeline-view"

interface ApiTimelineItem {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface TimelineEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  status: "upcoming" | "active" | "completed" | "expired"
}

export default function OperatorSekolahTimelinePage() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimelineData()
  }, [])

  const fetchTimelineData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operator-sekolah/timeline')
      if (response.ok) {
        const data = await response.json()
        const formattedData = data.timelines?.map((item: ApiTimelineItem) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          startDate: new Date(item.startDate),
          endDate: new Date(item.endDate),
          isActive: item.isActive,
          status: item.isActive ? 'active' : 
                 new Date(item.endDate) < new Date() ? 'expired' : 
                 new Date(item.startDate) > new Date() ? 'upcoming' : 'completed'
        })) || []
        setTimelineEvents(formattedData)
      } else {
        // Fallback to mock data
        const mockData: TimelineEvent[] = [
          {
            id: "1",
            title: "Periode Pengajuan Kenaikan Pangkat Agustus 2025",
            description: "Periode pengajuan usulan kenaikan pangkat untuk periode Agustus 2025",
            startDate: new Date("2025-01-01"),
            endDate: new Date("2025-03-31"),
            isActive: true,
            status: "active",
          },
          {
            id: "2",
            title: "Verifikasi Dokumen oleh Operator Sekolah",
            description: "Masa verifikasi dokumen usulan oleh operator sekolah",
            startDate: new Date("2025-02-01"),
            endDate: new Date("2025-04-15"),
            isActive: true,
            status: "active",
          },
          {
            id: "3",
            title: "Verifikasi oleh Dinas Pendidikan",
            description: "Verifikasi dan validasi oleh operator Dinas Pendidikan",
            startDate: new Date("2025-04-16"),
            endDate: new Date("2025-05-31"),
            isActive: false,
            status: "upcoming",
          },
        ]
        setTimelineEvents(mockData)
      }
    } catch (error) {
      console.error("Error fetching timeline data:", error)
      // Fallback to mock data
      const mockData: TimelineEvent[] = [
        {
          id: "1",
          title: "Periode Pengajuan Kenaikan Pangkat Agustus 2025",
          description: "Periode pengajuan usulan kenaikan pangkat untuk periode Agustus 2025",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-03-31"),
          isActive: true,
          status: "active",
        },
      ]
      setTimelineEvents(mockData)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Aktif</Badge>
      case "upcoming":
        return <Badge variant="secondary">Akan Datang</Badge>
      case "completed":
        return <Badge className="bg-blue-500">Selesai</Badge>
      case "expired":
        return <Badge variant="destructive">Berakhir</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "upcoming":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case "expired":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getDaysRemaining = (endDate: Date) => {
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat timeline...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator-sekolah">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Timeline Kenaikan Pangkat</h1>
                <p className="text-blue-100">Jadwal dan tahapan proses kenaikan pangkat</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Real-time Timeline */}
        <TimelineView userType="operator-sekolah" />

        {/* Active Timeline Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Periode Pengajuan Sedang Aktif</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Anda dapat mengajukan usulan kenaikan pangkat hingga 31 Maret 2025
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Tahapan Proses Kenaikan Pangkat</CardTitle>
              <CardDescription>Timeline lengkap proses kenaikan pangkat periode Agustus 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                    className="relative"
                  >
                    {/* Timeline Line */}
                    {index < timelineEvents.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200 dark:bg-gray-700"></div>
                    )}

                    <div className="flex items-start space-x-4">
                      {/* Timeline Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        {getStatusIcon(event.status)}
                      </div>

                      {/* Timeline Content */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</h3>
                            {getStatusBadge(event.status)}
                          </div>

                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{event.description}</p>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>
                                  {event.startDate.toLocaleDateString("id-ID")} -{" "}
                                  {event.endDate.toLocaleDateString("id-ID")}
                                </span>
                              </div>
                            </div>

                            {event.status === "active" && (
                              <div className="flex items-center text-green-600">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{getDaysRemaining(event.endDate)} hari tersisa</span>
                              </div>
                            )}

                            {event.status === "upcoming" && (
                              <div className="flex items-center text-blue-600">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>Dimulai {getDaysRemaining(event.startDate)} hari lagi</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800 dark:text-blue-200">
                <Info className="h-5 w-5 mr-2" />
                Catatan Penting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 dark:text-blue-300">
              <ul className="space-y-2 text-sm">
                <li>• Pastikan semua dokumen telah disiapkan sebelum batas waktu pengajuan</li>
                <li>• Verifikasi dokumen oleh operator sekolah harus selesai sebelum dikirim ke Dinas Pendidikan</li>
                <li>• Dokumen yang tidak lengkap akan dikembalikan untuk diperbaiki</li>
                <li>• Pantau status usulan secara berkala melalui sistem</li>
                <li>• Hubungi operator Dinas Pendidikan jika ada pertanyaan terkait proses verifikasi</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
