"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Search, Eye, Edit, Download, Filter, Plus, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Usulan {
  id: number
  pegawaiId: number
  pegawaiNama: string
  pegawaiNip: string
  golonganAsal: string
  golonganTujuan: string
  status: string
  tanggalDiajukan: string
  catatan?: string
}

export default function OperatorSekolahUsulanPage() {
  const [usulanData, setUsulanData] = useState<Usulan[]>([])
  const [filteredData, setFilteredData] = useState<Usulan[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsulanData()
  }, [])

  useEffect(() => {
    filterData()
  }, [search, statusFilter, usulanData])

  const fetchUsulanData = async () => {
    try {
      const response = await fetch('/api/operator-sekolah/usulan')
      if (response.ok) {
        const data = await response.json()
        setUsulanData(data.usulan || [])
      } else {
        // Mock data for school proposals
        const mockData: Usulan[] = [
          {
            id: 1,
            pegawaiId: 1,
            pegawaiNama: "Dr. Siti Aminah, S.Pd",
            pegawaiNip: "198501012010012001",
            golonganAsal: "IV/a",
            golonganTujuan: "IV/b",
            status: "Menunggu Verifikasi Sekolah",
            tanggalDiajukan: "2025-01-15",
            catatan: "Usulan kenaikan pangkat reguler periode Agustus 2025",
          },
          {
            id: 2,
            pegawaiId: 2,
            pegawaiNama: "Ahmad Wijaya, S.Pd",
            pegawaiNip: "199203152015031002",
            golonganAsal: "III/c",
            golonganTujuan: "III/d",
            status: "Sedang Diproses Operator",
            tanggalDiajukan: "2025-01-10",
            catatan: "Dokumen telah lengkap, sedang dalam proses verifikasi",
          },
          {
            id: 3,
            pegawaiId: 3,
            pegawaiNama: "Dra. Fatimah, M.Pd",
            pegawaiNip: "198012102008012003",
            golonganAsal: "IV/b",
            golonganTujuan: "IV/c",
            status: "Disetujui",
            tanggalDiajukan: "2024-12-01",
            catatan: "Usulan telah disetujui dan diterbitkan SK",
          },
          {
            id: 4,
            pegawaiId: 4,
            pegawaiNama: "Muhammad Rizki, S.Kom",
            pegawaiNip: "199505202020121004",
            golonganAsal: "III/a",
            golonganTujuan: "III/b",
            status: "Perlu Perbaikan",
            tanggalDiajukan: "2025-01-05",
            catatan: "Dokumen PAK perlu dilengkapi, mohon diperbaiki",
          },
        ]
        setUsulanData(mockData)
      }
    } catch (error) {
      console.error("Error fetching usulan data:", error)
      // Fallback to mock data
      const mockData: Usulan[] = [
        {
          id: 1,
          pegawaiId: 1,
          pegawaiNama: "Dr. Siti Aminah, S.Pd",
          pegawaiNip: "198501012010012001",
          golonganAsal: "IV/a",
          golonganTujuan: "IV/b",
          status: "Menunggu Verifikasi",
          tanggalDiajukan: "2025-01-15",
          catatan: "Dokumen lengkap, siap diverifikasi",
        },
      ]
      setUsulanData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let filtered = usulanData

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (usulan) =>
          usulan.pegawaiNama.toLowerCase().includes(search.toLowerCase()) || usulan.pegawaiNip.includes(search),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((usulan) => usulan.status === statusFilter)
    }

    setFilteredData(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Menunggu Verifikasi":
        return <Badge variant="destructive">{status}</Badge>
      case "Sedang Diproses":
        return <Badge variant="secondary">{status}</Badge>
      case "Disetujui":
        return <Badge variant="default">{status}</Badge>
      case "Ditolak":
        return <Badge variant="outline">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Menunggu Verifikasi":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "Sedang Diproses":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "Disetujui":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const handleExport = () => {
    console.log("Exporting usulan data...")
  }

  if (loading) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data usulan...</p>
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
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-8 w-8 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold">Kelola Usulan Kenaikan Pangkat</h1>
                  <p className="text-emerald-100">SMA Negeri 1 Balikpapan</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleExport}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Link href="/operator-sekolah/usulan/tambah">
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Usulan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usulan</p>
                  <p className="text-2xl font-bold">{usulanData.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Menunggu Verifikasi</p>
                  <p className="text-2xl font-bold">
                    {usulanData.filter((u) => u.status === "Menunggu Verifikasi").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sedang Diproses</p>
                  <p className="text-2xl font-bold">
                    {usulanData.filter((u) => u.status === "Sedang Diproses").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disetujui</p>
                  <p className="text-2xl font-bold">{usulanData.filter((u) => u.status === "Disetujui").length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filter & Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Cari nama atau NIP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Menunggu Verifikasi">Menunggu Verifikasi</SelectItem>
                    <SelectItem value="Sedang Diproses">Sedang Diproses</SelectItem>
                    <SelectItem value="Disetujui">Disetujui</SelectItem>
                    <SelectItem value="Ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Data Usulan Kenaikan Pangkat
                </div>
                <Badge variant="secondary">{filteredData.length} usulan</Badge>
              </CardTitle>
              <CardDescription>Daftar usulan kenaikan pangkat pegawai sekolah</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Nama Pegawai</TableHead>
                      <TableHead>Golongan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Diajukan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((usulan, index) => (
                        <TableRow key={usulan.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{usulan.pegawaiNip}</TableCell>
                          <TableCell className="font-medium">{usulan.pegawaiNama}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{usulan.golonganAsal}</Badge>
                              <span>→</span>
                              <Badge variant="secondary">{usulan.golonganTujuan}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(usulan.status)}
                              {getStatusBadge(usulan.status)}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(usulan.tanggalDiajukan).toLocaleDateString("id-ID")}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Tidak ada data usulan yang ditemukan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
