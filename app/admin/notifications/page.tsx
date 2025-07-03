"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Bell, Eye, Info } from "lucide-react"
import { motion } from "framer-motion"

export default function NotifikasiGlobalPage() {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Perpanjangan Masa Pengusulan KAPE",
      target: "Semua Pengguna",
      content: "Perpanjangan masa pengusulan KAPE hingga 10 Januari 2025.",
      datetime: "2025-01-08 10:00",
      status: "Terkirim",
    },
    {
      id: 2,
      title: "Perubahan Syarat Dokumen PAK",
      target: "Pegawai",
      content: "Terdapat perubahan persyaratan dokumen PAK terbaru.",
      datetime: "2025-01-05 14:30",
      status: "Terkirim",
    },
    {
      id: 3,
      title: "Maintenance Sistem Terjadwal",
      target: "Semua Pengguna",
      content: "Sistem akan maintenance pada 5 Januari 2025 pukul 22.00-23.59.",
      datetime: "2025-01-03 16:00",
      status: "Terkirim",
    },
  ])

  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [content, setContent] = useState("")
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleSend = () => {
    if (!title || !target || !content) {
      alert("Lengkapi semua field sebelum mengirim pengumuman.")
      return
    }

    const newAnnouncement = {
      id: announcements.length + 1,
      title,
      target: target === "semua" ? "Semua Pengguna" : target.charAt(0).toUpperCase() + target.slice(1),
      content,
      datetime: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "Terkirim",
    }

    setAnnouncements([newAnnouncement, ...announcements])
    setTitle("")
    setTarget("")
    setContent("")
  }

  const handleView = (announcement) => {
    setSelectedAnnouncement(announcement)
    setIsDetailOpen(true)
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Bell className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Notifikasi Global</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk membuat pengumuman terkait kenaikan pangkat.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kirim Pengumuman Baru</CardTitle>
            <p className="text-muted-foreground text-sm">Buat dan kirim notifikasi ke pengguna</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Contoh: Perpanjangan Masa Pengusulan KAPE"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Select value={target} onValueChange={(value) => setTarget(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih target penerima" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Pengguna</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="pegawai">Pegawai</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Tulis isi pengumuman di sini..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex gap-2">
              <Button className="flex items-center gap-2" onClick={handleSend}>
                <Bell className="h-4 w-4" /> Kirim Sekarang
              </Button>
              <Button variant="outline">Simpan Draft</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Pengumuman</CardTitle>
            <p className="text-muted-foreground text-sm">Pengumuman yang pernah dikirim</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="border p-4 rounded-lg flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="font-semibold text-sm mb-1">{item.title}</div>
                  <div className="text-xs text-muted-foreground">Target: {item.target}</div>
                  <div className="text-xs text-muted-foreground">{item.datetime}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm font-medium">{item.status}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Modal Detail */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAnnouncement.title}</DialogTitle>
                <DialogDescription>
                  Target: {selectedAnnouncement.target}
                  <br />
                  Waktu: {selectedAnnouncement.datetime}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <p>{selectedAnnouncement.content}</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsDetailOpen(false)}>Tutup</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
