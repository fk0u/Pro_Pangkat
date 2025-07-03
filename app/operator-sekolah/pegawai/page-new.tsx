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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Users, Search, Plus, Eye, Edit, Download, Filter, GraduationCap, Loader2 } from "lucide-react"
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPegawai, setNewPegawai] = useState({
    nip: "",
    name: "",
    email: "",
    jabatan: "",
    jenisJabatan: "",
    golongan: "",
    tmtGolongan: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPegawaiData()
  }, [])

  useEffect(() => {
    filterData()
  }, [search, jabatanFilter, golonganFilter, pegawaiData])

  const fetchPegawaiData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operator-sekolah/pegawai')
      if (response.ok) {
        const data = await response.json()
        const formattedData = data.pegawai.map((p: any) => ({
          id: p.id,
          nip: p.nip,
          name: p.name,
          jabatan: p.jabatan || 'Belum diatur',
          jenisJabatan: p.jenisJabatan || 'Belum diatur',
          golongan: p.golongan || 'Belum diatur',
          email: p.email,
          tmtGolongan: p.tmtGolongan,
          unitKerja: p.unitKerja,
          createdAt: p.createdAt
        }))
        setPegawaiData(formattedData)
      } else {
        console.error('Failed to fetch pegawai data')
        setPegawaiData([])
      }
    } catch (error) {
      console.error('Error fetching pegawai data:', error)
      setPegawaiData([])
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let filtered = pegawaiData

    if (search) {
      filtered = filtered.filter(
        (pegawai) =>
          pegawai.name.toLowerCase().includes(search.toLowerCase()) ||
          pegawai.nip.includes(search) ||
          pegawai.jabatan.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (jabatanFilter !== "all") {
      filtered = filtered.filter((pegawai) => pegawai.jenisJabatan === jabatanFilter)
    }

    if (golonganFilter !== "all") {
      filtered = filtered.filter((pegawai) => pegawai.golongan.startsWith(golonganFilter))
    }

    setFilteredData(filtered)
  }

  const handleAddPegawai = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/operator-sekolah/pegawai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPegawai),
      })

      if (response.ok) {
        await fetchPegawaiData()
        setIsAddDialogOpen(false)
        setNewPegawai({
          nip: "",
          name: "",
          email: "",
          jabatan: "",
          jenisJabatan: "",
          golongan: "",
          tmtGolongan: ""
        })
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error adding pegawai:', error)
      alert('Terjadi kesalahan saat menambah pegawai')
    } finally {
      setIsSubmitting(false)
    }
  }

  const jenisJabatanOptions = ["Guru", "Tenaga Kependidikan", "Struktural"]
  const golonganOptions = ["I", "II", "III", "IV"]

  return (
    <DashboardLayout userType="operator-sekolah">
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <GraduationCap className="h-6 w-6 mr-3 text-purple-600" />
                  <div>
                    <CardTitle className="text-2xl">Manajemen Pegawai</CardTitle>
                    <CardDescription>Kelola data pegawai di sekolah Anda</CardDescription>
                  </div>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Pegawai
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Tambah Pegawai Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nip">NIP</Label>
                        <Input
                          id="nip"
                          value={newPegawai.nip}
                          onChange={(e) => setNewPegawai({...newPegawai, nip: e.target.value})}
                          placeholder="18 digit NIP"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                          id="name"
                          value={newPegawai.name}
                          onChange={(e) => setNewPegawai({...newPegawai, name: e.target.value})}
                          placeholder="Nama pegawai"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newPegawai.email}
                          onChange={(e) => setNewPegawai({...newPegawai, email: e.target.value})}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jabatan">Jabatan</Label>
                        <Input
                          id="jabatan"
                          value={newPegawai.jabatan}
                          onChange={(e) => setNewPegawai({...newPegawai, jabatan: e.target.value})}
                          placeholder="Jabatan pegawai"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jenisJabatan">Jenis Jabatan</Label>
                        <Select 
                          value={newPegawai.jenisJabatan} 
                          onValueChange={(value) => setNewPegawai({...newPegawai, jenisJabatan: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis jabatan" />
                          </SelectTrigger>
                          <SelectContent>
                            {jenisJabatanOptions.map((jenis) => (
                              <SelectItem key={jenis} value={jenis}>
                                {jenis}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="golongan">Golongan</Label>
                        <Input
                          id="golongan"
                          value={newPegawai.golongan}
                          onChange={(e) => setNewPegawai({...newPegawai, golongan: e.target.value})}
                          placeholder="Contoh: III/c"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tmtGolongan">TMT Golongan</Label>
                        <Input
                          id="tmtGolongan"
                          type="date"
                          value={newPegawai.tmtGolongan}
                          onChange={(e) => setNewPegawai({...newPegawai, tmtGolongan: e.target.value})}
                        />
                      </div>
                      <Button 
                        onClick={handleAddPegawai} 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          'Simpan'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari pegawai (nama, NIP, jabatan)..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={jabatanFilter} onValueChange={setJabatanFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Jenis Jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      {jenisJabatanOptions.map((jenis) => (
                        <SelectItem key={jenis} value={jenis}>
                          {jenis}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={golonganFilter} onValueChange={setGolonganFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Golongan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {golonganOptions.map((gol) => (
                        <SelectItem key={gol} value={gol}>
                          Golongan {gol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Data Pegawai</CardTitle>
                <Badge variant="secondary">
                  {filteredData.length} dari {pegawaiData.length} pegawai
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2">Memuat data pegawai...</span>
                </div>
              ) : filteredData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NIP</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Golongan</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>TMT Golongan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((pegawai, index) => (
                        <motion.tr
                          key={pegawai.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.3 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <TableCell className="font-mono text-sm">{pegawai.nip}</TableCell>
                          <TableCell className="font-medium">{pegawai.name}</TableCell>
                          <TableCell>{pegawai.jabatan}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {pegawai.jenisJabatan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {pegawai.golongan}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {pegawai.email || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {pegawai.tmtGolongan 
                              ? new Date(pegawai.tmtGolongan).toLocaleDateString('id-ID')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Tidak ada data pegawai
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {search || jabatanFilter !== "all" || golonganFilter !== "all"
                      ? "Tidak ada pegawai yang sesuai dengan filter"
                      : "Belum ada pegawai yang terdaftar"}
                  </p>
                  {!search && jabatanFilter === "all" && golonganFilter === "all" && (
                    <Button onClick={() => setIsAddDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Pegawai Pertama
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
