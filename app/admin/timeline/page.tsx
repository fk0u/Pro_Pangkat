"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar, CalendarDays, Clock, FileText, Pencil, Info, X } from "lucide-react"
import { motion } from "framer-motion"

const initialTimelines = [
  {
    id: 1,
    jabatan: "Jabatan Pelaksana",
    pengusulan: "5 Mei - 19 Mei 2025",
    perbaikan: "5 Mei - 28 Mei 2025",
    status: "Aktif",
  },
  {
    id: 2,
    jabatan: "Jabatan Struktural",
    pengusulan: "5 Mei - 19 Mei 2025",
    perbaikan: "5 Mei - 28 Mei 2025",
    status: "Aktif",
  },
  {
    id: 3,
    jabatan: "Jabatan Fungsional",
    pengusulan: "5 Mei - 19 Mei 2025",
    perbaikan: "5 Mei - 28 Mei 2025",
    status: "Aktif",
  },
]

export default function TimelinePage() {
  const [timelines, setTimelines] = useState(initialTimelines)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("") // "add" or "edit"
  const [selectedTimeline, setSelectedTimeline] = useState(null)
  const [form, setForm] = useState({ jabatan: "", pengusulan: "", perbaikan: "" })

  const openAddModal = () => {
    setModalType("add")
    setForm({ jabatan: "", pengusulan: "", perbaikan: "" })
    setShowModal(true)
  }

  const openEditModal = (timeline) => {
    setModalType("edit")
    setSelectedTimeline(timeline)
    setForm({ jabatan: timeline.jabatan, pengusulan: timeline.pengusulan, perbaikan: timeline.perbaikan })
    setShowModal(true)
  }

  const handleSave = () => {
    if (modalType === "add") {
      const newTimeline = {
        id: timelines.length + 1,
        jabatan: form.jabatan,
        pengusulan: form.pengusulan,
        perbaikan: form.perbaikan,
        status: "Aktif",
      }
      setTimelines([...timelines, newTimeline])
    } else if (modalType === "edit") {
      const updated = timelines.map((t) =>
        t.id === selectedTimeline.id ? { ...t, jabatan: form.jabatan, pengusulan: form.pengusulan, perbaikan: form.perbaikan } : t
      )
      setTimelines(updated)
    }
    setShowModal(false)
  }

  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus timeline ini?")) {
      const updated = timelines.filter((t) => t.id !== selectedTimeline.id)
      setTimelines(updated)
      setShowModal(false)
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
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
                  Ini adalah halaman untuk mengelola timeline kenaikan pangkat.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Periode Kenaikan Pangkat</CardTitle>
              <p className="text-sm text-muted-foreground">Atur waktu pengusulan dan perbaikan untuk setiap jenis jabatan</p>
            </div>
            <Button onClick={openAddModal}>
              + Tambah Timeline
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {timelines.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <h3 className="text-base font-semibold">{item.jabatan}</h3>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex flex-col md:flex-row md:gap-10">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-black">Waktu Pengusulan</div>
                        <div>{item.pengusulan}</div>
                        <div className="text-xs">Periode untuk mengajukan usulan kenaikan pangkat</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-black">Waktu Perbaikan</div>
                        <div>{item.perbaikan}</div>
                        <div className="text-xs">Periode untuk memperbaiki berkas yang dikembalikan</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 text-xs">{item.status}</Badge>
                    <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
                <Button variant="ghost" className="text-sm text-primary flex gap-1 items-center px-0">
                  <FileText className="h-4 w-4" />
                  Berkas yang Perlu Disiapkan
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

     {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6 shadow-lg animate-fadeIn">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
              <h2 className="text-xl font-semibold">
                {modalType === "add" ? "Tambah Timeline" : "Detail Timeline"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jabatan</label>
                <input
                  type="text"
                  value={form.jabatan}
                  onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                  className="w-full border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                  placeholder="Masukkan nama jabatan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Waktu Pengusulan</label>
                <input
                  type="text"
                  value={form.pengusulan}
                  onChange={(e) => setForm({ ...form, pengusulan: e.target.value })}
                  className="w-full border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                  placeholder="cth: 5 Mei - 19 Mei 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Waktu Perbaikan</label>
                <input
                  type="text"
                  value={form.perbaikan}
                  onChange={(e) => setForm({ ...form, perbaikan: e.target.value })}
                  className="w-full border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:ring focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                  placeholder="cth: 5 Mei - 28 Mei 2025"
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end gap-2 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              {modalType === "edit" && (
                <Button variant="destructive" onClick={handleDelete}>
                  Hapus
                </Button>
              )}
              <Button onClick={handleSave}>
                {modalType === "add" ? "Tambah" : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
