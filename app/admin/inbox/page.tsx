"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Eye, CheckCircle, XCircle, Info, Mail } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"

const sampleInbox = [
  {
    id: 1,
    name: "Dr. Ahmad Wijaya",
    nip: "198501012010011001",
    jabatan: "Guru Madya",
    instansi: "Dinas Pendidikan",
    status: "Menunggu",
    date: "2025-06-21 10:23",
  },
  {
    id: 2,
    name: "Siti Nurhaliza",
    nip: "199203152015032002",
    jabatan: "Analis Data",
    instansi: "Diskominfo",
    status: "Disetujui",
    date: "2025-06-20 09:10",
  },
  {
    id: 3,
    name: "Budi Santoso",
    nip: "198712102012011003",
    jabatan: "Kepala Bidang",
    instansi: "BKPSDM",
    status: "Ditolak",
    date: "2025-06-19 14:35",
  },
]

export default function InboxUsulanPage() {
  const [inbox, setInbox] = useState(sampleInbox)
  const [selected, setSelected] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)

  const handleLihat = (item) => {
    setSelected(item)
    setOpenDialog(true)
  }

  const handleSetujui = () => {
    if (selected) {
      const updated = inbox.map((item) =>
        item.id === selected.id ? { ...item, status: "Disetujui" } : item
      )
      setInbox(updated)
      setOpenDialog(false)
    }
  }

  const handleTolak = () => {
    if (selected) {
      const updated = inbox.map((item) =>
        item.id === selected.id ? { ...item, status: "Ditolak" } : item
      )
      setInbox(updated)
      setOpenDialog(false)
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Mail className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Inbox Usulan</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk mengelola usulan kenaikan pangkat.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          {inbox.map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{item.name}</p>
                  <p className="text-sm text-muted-foreground">NIP: {item.nip}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.jabatan} • {item.instansi}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Dikirim: {item.date}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    className={
                      item.status === "Menunggu"
                        ? "bg-yellow-100 text-yellow-800"
                        : item.status === "Disetujui"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {item.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleLihat(item)}>
                      <Eye className="w-4 h-4 mr-1" /> Lihat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal Detail */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle>Detail Usulan</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <p><strong>Nama:</strong> {selected.name}</p>
                  <p><strong>NIP:</strong> {selected.nip}</p>
                  <p><strong>Jabatan:</strong> {selected.jabatan}</p>
                  <p><strong>Instansi:</strong> {selected.instansi}</p>
                  <p><strong>Tanggal Kirim:</strong> {selected.date}</p>
                  <p><strong>Status:</strong> {selected.status}</p>
                  <Textarea placeholder="Catatan verifikasi..." className="mt-2" />
                  <div className="flex gap-2 mt-4">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleSetujui}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Setujui
                    </Button>
                    <Button variant="destructive" onClick={handleTolak}>
                      <XCircle className="w-4 h-4 mr-1" /> Tolak
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
