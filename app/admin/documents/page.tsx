"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Upload, Eye, Trash2, Download } from "lucide-react"
import { motion } from "framer-motion"
import { FolderOpen, Info } from "lucide-react"

const dummyDocuments = [
  {
    id: 1,
    name: "SK Kenaikan Pangkat",
    type: "PDF",
    uploadedAt: "2025-06-20",
    status: "Diterima",
    url: "/files/sk-kenaikan-pangkat.pdf"
  },
  {
    id: 2,
    name: "Ijazah Terakhir",
    type: "JPG",
    uploadedAt: "2025-06-18",
    status: "Ditolak",
    url: "/files/ijazah-terakhir.jpg"
  },
  {
    id: 3,
    name: "SK CPNS",
    type: "PDF",
    uploadedAt: "2025-06-19",
    status: "Menunggu Verifikasi",
    url: "/files/sk-cpns.pdf"
  },
]

export default function KelolaDokumenPage() {
  const [documents, setDocuments] = useState(dummyDocuments)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  const handleDelete = (id) => {
    if (confirm("Yakin ingin menghapus dokumen ini?")) {
      setDocuments(documents.filter((doc) => doc.id !== id))
    }
  }

  const handleDownload = (url) => {
    const link = document.createElement("a")
    link.href = url
    link.download = url.split("/").pop()
    link.click()
  }

  const openDetail = (doc) => {
    setSelectedDoc(doc)
    setShowDetail(true)
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <FolderOpen className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Kelola Dokumen</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk mengelola dokumen kenaikan pangkat.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daftar Dokumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="font-medium text-base">{doc.name}</h4>
                  <p className="text-sm text-muted-foreground">Tipe: {doc.type} | Diunggah: {doc.uploadedAt}</p>
                  <span className={`text-xs font-medium ${
                    doc.status === "Diterima"
                      ? "text-green-600"
                      : doc.status === "Ditolak"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}>{doc.status}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openDetail(doc)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDownload(doc.url)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Modal Detail Dokumen */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent>
            {selectedDoc && (
              <>
                <DialogHeader>
                  <DialogTitle>Detail Dokumen</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <p><strong>Nama:</strong> {selectedDoc.name}</p>
                  <p><strong>Tipe:</strong> {selectedDoc.type}</p>
                  <p><strong>Diunggah:</strong> {selectedDoc.uploadedAt}</p>
                  <p><strong>Status:</strong> {selectedDoc.status}</p>
                  <p><strong>URL:</strong> <a href={selectedDoc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{selectedDoc.url}</a></p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDetail(false)}>Tutup</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
