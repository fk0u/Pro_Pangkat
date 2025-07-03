"use client"

import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Info, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"

const data = [
  {
    nama: "Dr. Ahmad Wijaya",
    dokumen: "SK Kenaikan Pangkat",
    tanggal: "2025-01-08",
    status: "Disetujui"
  },
  {
    nama: "Siti Nurhaliza",
    dokumen: "Surat Pernyataan",
    tanggal: "2025-01-07",
    status: "Diproses"
  },
  {
    nama: "Budi Santoso",
    dokumen: "Dokumen PAK",
    tanggal: "2025-01-06",
    status: "Ditolak"
  },
  {
    nama: "Maya Sari",
    dokumen: "SK Pensiun",
    tanggal: "2025-01-06",
    status: "Disetujui"
  }
]

export default function ReportExportPage() {

  const exportExcel = () => {
    const worksheetData = [
      ["Nama Pegawai", "Dokumen", "Tanggal", "Status"],
      ...data.map(item => [item.nama, item.dokumen, item.tanggal, item.status])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Dokumen")

    XLSX.writeFile(workbook, "laporan-dokumen.xlsx")
  }

  const total = data.length
  const disetujui = data.filter((d) => d.status === "Disetujui").length
  const diproses = data.filter((d) => d.status === "Diproses").length
  const ditolak = data.filter((d) => d.status === "Ditolak").length

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Laporan & Ekspor</h1>
                <p className="text-indigo-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-indigo-200" />
                <p className="text-indigo-100">
                  Halaman ini menampilkan laporan dan ekspor data kenaikan pangkat.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-sm">Total Dokumen</p>
              <p className="text-2xl font-bold">{total}</p>
            </CardContent>
          </Card>
          <Card className="shadow">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-sm">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">{disetujui}</p>
            </CardContent>
          </Card>
          <Card className="shadow">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-sm">Diproses</p>
              <p className="text-2xl font-bold text-yellow-500">{diproses}</p>
            </CardContent>
          </Card>
          <Card className="shadow">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-sm">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{ditolak}</p>
            </CardContent>
          </Card>
        </div>

        {/* Riwayat Dokumen */}
        <Card className="shadow">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-lg">Riwayat Dokumen</CardTitle>
              <p className="text-sm text-muted-foreground">Data dokumen pengajuan pegawai</p>
            </div>
            <Button onClick={exportExcel} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Export ke Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-separate border-spacing-y-2 transition-colors duration-300">
                <thead className="text-left bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2">Nama Pegawai</th>
                    <th className="px-4 py-2">Dokumen</th>
                    <th className="px-4 py-2">Tanggal</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr
                      key={index}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm border rounded-lg transition-colors duration-300"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{item.nama}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.dokumen}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{item.tanggal}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.status === "Disetujui"
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                              : item.status === "Diproses"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
