"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, UserPlus, Info } from "lucide-react"

type PegawaiData = {
  nip: string
  name: string
  email: string
  unitKerja: string
  wilayah: string
}

export default function ImportPegawaiPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [pegawaiData, setPegawaiData] = useState<PegawaiData[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseExcel(selectedFile)
    }
  }

  const parseExcel = (fileToParse: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: "binary" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet) as any[]

      const formattedData: PegawaiData[] = json.map((row) => ({
        nip: String(row.NIP || ""),
        name: String(row.Nama || ""),
        email: String(row.Email || ""),
        unitKerja: String(row["Unit Kerja"] || ""),
        wilayah: String(row.Wilayah || ""),
      }))
      setPegawaiData(formattedData)
    }
    reader.readAsBinaryString(fileToParse)
  }

  const handleUpload = async () => {
    if (pegawaiData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Pilih file Excel yang valid untuk diimpor.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    toast({
      title: "Mengimpor data...",
      description: `Mengimpor ${pegawaiData.length} data pegawai.`,
    })

    // In a real app, you would send this to an API endpoint
    // For example: await fetch('/api/admin/users/import', { method: 'POST', body: JSON.stringify(pegawaiData) })
    setTimeout(() => {
      setIsUploading(false)
      toast({
        title: "Impor Berhasil!",
        description: `${pegawaiData.length} data pegawai berhasil diimpor.`,
      })
      setPegawaiData([])
      setFile(null)
    }, 2000)
  }

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        NIP: "199001012020121001",
        Nama: "Budi Gunawan",
        Email: "budi.g@example.com",
        "Unit Kerja": "SMA Negeri 2 Balikpapan",
        Wilayah: "BALIKPAPAN_PPU",
      },
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template Pegawai")
    XLSX.writeFile(wb, "template_import_pegawai.xlsx")
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <UserPlus className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Impor Data Pegawai</h1>
                <p className="text-sky-100">Impor data pegawai secara massal menggunakan file Excel.</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">Pastikan file Excel Anda sesuai dengan format template yang disediakan.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Upload File Excel</CardTitle>
            <CardDescription>Pilih file .xlsx atau .xls untuk mengimpor data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-full p-6 border-2 border-dashed rounded-lg text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <span>Upload a file</span>
                  <Input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                  />
                </label>
                <p className="text-xs text-gray-500">XLSX, XLS up to 10MB</p>
                {file && <p className="mt-2 text-sm text-gray-600">{file.name}</p>}
              </div>
              <div className="flex-shrink-0 space-y-2">
                <Button onClick={handleDownloadTemplate} variant="outline" className="w-full bg-transparent">
                  <FileText className="mr-2 h-4 w-4" /> Download Template
                </Button>
                <Button onClick={handleUpload} disabled={isUploading || pegawaiData.length === 0} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" /> {isUploading ? "Mengimpor..." : "Impor Data"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {pegawaiData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pratinjau Data</CardTitle>
              <CardDescription>Berikut adalah data yang akan diimpor dari file Excel Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIP</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Wilayah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pegawaiData.map((pegawai, index) => (
                      <TableRow key={index}>
                        <TableCell>{pegawai.nip}</TableCell>
                        <TableCell>{pegawai.name}</TableCell>
                        <TableCell>{pegawai.email}</TableCell>
                        <TableCell>{pegawai.unitKerja}</TableCell>
                        <TableCell>{pegawai.wilayah}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
