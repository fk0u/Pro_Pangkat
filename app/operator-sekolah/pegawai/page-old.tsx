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
import { Users, Search, Plus, Eye, Edit, Download, Filter, GraduationCap } from "lucide-react"
import Link from "next/link"

interface Pegawai {
  id: string
  nip: string
  name: string
  jabatan: string
  jenisJabatan: string
  golongan: string
  email?: string
  tmtGolongan?: string
  unitKerja?: string
  createdAt: string
}

export default function OperatorSekolahPegawaiPage() {
  const [pegawaiData, setPegawaiData] = useState<Pegawai[]>([])
  const [filteredData, setFilteredData] = useState<Pegawai[]>([])
  const [search, setSearch] = useState("")
  const [jabatanFilter, setJabatanFilter] = useState("all")
  const [golonganFilter, setGolonganFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPegawaiData()
  }, [])

  useEffect(() => {
    filterData()
  }, [search, jabatanFilter, golonganFilter, pegawaiData])

  const fetchPegawaiData = async () => {
    try {
      const response = await fetch('/api/operator-sekolah/pegawai')
      if (response.ok) {
        const data = await response.json()
        setPegawaiData(data.pegawai || [])
      } else {
        // Fallback to mock data if API not available
        const mockData: Pegawai[] = [
          {
            id: 1,
            nip: "198501012010012001",
            nama: "Dr. Siti Aminah, S.Pd",
            jabatan: "Guru Madya",
            jenisJabatan: "Guru",
            golongan: "IV/a",
            status: "Aktif",
            email: "siti.aminah@smanegeri1balikpapan.sch.id",
            phone: "0812-3456-7890",
          },
          {
            id: 2,
            nip: "199203152015031002",
            nama: "Ahmad Wijaya, S.Pd",
            jabatan: "Guru Muda",
            jenisJabatan: "Guru",
            golongan: "III/c",
            status: "Aktif",
            email: "ahmad.wijaya@smanegeri1balikpapan.sch.id",
            phone: "0813-4567-8901",
          },
          {
            id: 3,
            nip: "198012102008012003",
            nama: "Dra. Fatimah, M.Pd",
            jabatan: "Wakil Kepala Sekolah",
            jenisJabatan: "Struktural",
            golongan: "IV/b",
            status: "Aktif",
            email: "fatimah.wakasek@smanegeri1balikpapan.sch.id",
            phone: "0814-5678-9012",
          },
          {
            id: 4,
            nip: "199505202020121004",
            nama: "Muhammad Rizki, S.Kom",
            jabatan: "Operator Sekolah",
            jenisJabatan: "Fungsional",
            golongan: "III/a",
            status: "Aktif",
            email: "rizki.operator@smanegeri1balikpapan.sch.id",
            phone: "0815-6789-0123",
          },
          {
            id: 5,
            nip: "197803051999032005",
            nama: "Drs. Bambang Supriyanto",
            jabatan: "Kepala Sekolah",
            jenisJabatan: "Struktural",
            golongan: "IV/c",
            status: "Aktif",
            email: "bambang.kepsek@smanegeri1balikpapan.sch.id",
            phone: "0816-7890-1234",
          },
        ]
        setPegawaiData(mockData)
      }
    } catch (error) {
      console.error("Error fetching pegawai data:", error)
      // Fallback to mock data
      const mockData: Pegawai[] = [
        {
          id: 1,
          nip: "198501012010012001",
          nama: "Dr. Siti Aminah, S.Pd",
          jabatan: "Guru Madya",
          jenisJabatan: "Guru",
          golongan: "IV/a",
          status: "Aktif",
          email: "siti.aminah@smanegeri1balikpapan.sch.id",
          phone: "0812-3456-7890",
        },
        {
          id: 2,
          nip: "199203152015031002",
          nama: "Ahmad Wijaya, S.Pd",
          jabatan: "Guru Muda",
          jenisJabatan: "Guru",
          golongan: "III/c",
          status: "Aktif",
          email: "ahmad.wijaya@smanegeri1balikpapan.sch.id",
          phone: "0813-4567-8901",
        },
        {
          id: 3,
          nip: "198012102008012003",
          nama: "Dra. Fatimah, M.Pd",
          jabatan: "Wakil Kepala Sekolah",
          jenisJabatan: "Struktural",
          golongan: "IV/b",
          status: "Aktif",
          email: "fatimah.wakasek@smanegeri1balikpapan.sch.id",
          phone: "0814-5678-9012",
        },
        {
          id: 4,
          nip: "199505202020121004",
          nama: "Muhammad Rizki, S.Kom",
          jabatan: "Operator Sekolah",
          jenisJabatan: "Fungsional",
          golongan: "III/a",
          status: "Aktif",
          email: "rizki.operator@smanegeri1balikpapan.sch.id",
          phone: "0815-6789-0123",
        },
        {
          id: 5,
          nip: "197803051999032005",
          nama: "Drs. Bambang Supriyanto",
          jabatan: "Kepala Sekolah",
          jenisJabatan: "Struktural",
          golongan: "IV/c",
          status: "Aktif",
          email: "bambang.kepsek@smanegeri1balikpapan.sch.id",
          phone: "0816-7890-1234",
        },
      ]
      setPegawaiData(mockData)
    } finally {
      setLoading(false)
    }
  }
          jabatan: "Guru Madya",
          jenisJabatan: "Guru",
          golongan: "IV/a",
          status: "Aktif",
          email: "siti.aminah@sman1balikpapan.sch.id",
          phone: "081234567890",
        },
        {
          id: 2,
          nip: "199203152015031002",
          nama: "Ahmad Wijaya, S.Pd",
          jabatan: "Guru Muda",
          jenisJabatan: "Guru",
          golongan: "III/c",
          status: "Aktif",
          email: "ahmad.wijaya@sman1balikpapan.sch.id",
          phone: "081234567891",
        },
        {
          id: 3,
          nip: "197812101998032001",
          nama: "Maya Sari, S.Pd",
          jabatan: "Kepala Sekolah",
          jenisJabatan: "Struktural",
          golongan: "IV/c",
          status: "Aktif",
          email: "maya.sari@sman1balikpapan.sch.id",
          phone: "081234567892",
        },
        {
          id: 4,
          nip: "199105082016032002",
          nama: "Budi Santoso, S.Pd",
          jabatan: "Wakil Kepala Sekolah",
          jenisJabatan: "Struktural",
          golongan: "IV/a",
          status: "Aktif",
          email: "budi.santoso@sman1balikpapan.sch.id",
          phone: "081234567893",
        },
        {
          id: 5,
          nip: "198907152014032001",
          nama: "Rina Wati, S.Pd",
          jabatan: "Pustakawan Muda",
          jenisJabatan: "Tenaga Kependidikan",
          golongan: "III/b",
          status: "Aktif",
          email: "rina.wati@sman1balikpapan.sch.id",
          phone: "081234567894",
        },
      ]

      setPegawaiData(mockData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching pegawai data:", error)
      setLoading(false)
    }
  }

  const filterData = () => {
    let filtered = pegawaiData

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (pegawai) => pegawai.nama.toLowerCase().includes(search.toLowerCase()) || pegawai.nip.includes(search),
      )
    }

    // Jabatan filter
    if (jabatanFilter !== "all") {
      filtered = filtered.filter((pegawai) => pegawai.jenisJabatan === jabatanFilter)
    }

    // Golongan filter
    if (golonganFilter !== "all") {
      filtered = filtered.filter((pegawai) => pegawai.golongan === golonganFilter)
    }

    setFilteredData(filtered)
  }

  const handleExport = () => {
    // In real implementation, this would call export API
    console.log("Exporting pegawai data...")
  }

  if (loading) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat data pegawai...</p>
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
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-8 w-8 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold">Manajemen Pegawai</h1>
                  <p className="text-blue-100">SMA Negeri 1 Balikpapan</p>
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
                <Link href="/operator-sekolah/pegawai/tambah">
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pegawai
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
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

                <Select value={jabatanFilter} onValueChange={setJabatanFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Jenis Jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jabatan</SelectItem>
                    <SelectItem value="Guru">Guru</SelectItem>
                    <SelectItem value="Tenaga Kependidikan">Tenaga Kependidikan</SelectItem>
                    <SelectItem value="Struktural">Struktural</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={golonganFilter} onValueChange={setGolonganFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Golongan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Golongan</SelectItem>
                    <SelectItem value="III/a">III/a</SelectItem>
                    <SelectItem value="III/b">III/b</SelectItem>
                    <SelectItem value="III/c">III/c</SelectItem>
                    <SelectItem value="III/d">III/d</SelectItem>
                    <SelectItem value="IV/a">IV/a</SelectItem>
                    <SelectItem value="IV/b">IV/b</SelectItem>
                    <SelectItem value="IV/c">IV/c</SelectItem>
                    <SelectItem value="IV/d">IV/d</SelectItem>
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
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Data Pegawai
                </div>
                <Badge variant="secondary">{filteredData.length} pegawai</Badge>
              </CardTitle>
              <CardDescription>Daftar pegawai di SMA Negeri 1 Balikpapan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Jenis Jabatan</TableHead>
                      <TableHead>Golongan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((pegawai, index) => (
                        <TableRow key={pegawai.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{pegawai.nip}</TableCell>
                          <TableCell className="font-medium">{pegawai.nama}</TableCell>
                          <TableCell>{pegawai.jabatan}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{pegawai.jenisJabatan}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{pegawai.golongan}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pegawai.status === "Aktif" ? "default" : "destructive"}>
                              {pegawai.status}
                            </Badge>
                          </TableCell>
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
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Tidak ada data pegawai yang ditemukan
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
