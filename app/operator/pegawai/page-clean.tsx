"use client"

import { useState, useEffect } from "react"
import { Eye, Search, Info, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { motion } from "framer-motion"

interface Pegawai {
  id: string
  nama: string
  nip: string
  unitKerja: string
  jabatan: string
  jenisJabatan: string
  golongan: string
  wilayah: string
  email?: string
  phone?: string
  address?: string
  totalProposals: number
  activeProposals: number
  proposalStatus: string
  latestProposal?: {
    id: string
    periode: string
    status: string
    createdAt: string
  }
  createdAt: string
}

export default function ListPegawaiPage() {
  const [data, setData] = useState<Pegawai[]>([])
  const [search, setSearch] = useState("")
  const [unitKerjaFilter, setUnitKerjaFilter] = useState("all")
  const [jabatanFilter, setJabatanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [opdFilter, setOpdFilter] = useState("all")
  const [jenisFilter, setJenisFilter] = useState("all")
  const [golonganFilter, setGolonganFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState({
    totalPegawai: 0,
    pegawaiDenganUsulan: 0,
    totalUsulan: 0,
    usulanAktif: 0
  })
  const [filterOptions, setFilterOptions] = useState({
    unitKerja: [] as string[],
    jabatan: [] as string[],
    status: [] as { value: string, label: string }[]
  })

  const handleShowDetail = (pegawai: Pegawai) => {
    setSelectedPegawai(pegawai)
    setShowModal(true)
  }

  const fetchPegawaiData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
        ...(unitKerjaFilter !== 'all' && { unitKerja: unitKerjaFilter }),
        ...(jabatanFilter !== 'all' && { jabatan: jabatanFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/operator/pegawai?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        setData(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
        setSummary(result.summary || {
          totalPegawai: 0,
          pegawaiDenganUsulan: 0,
          totalUsulan: 0,
          usulanAktif: 0
        })
        setFilterOptions(result.filterOptions || {
          unitKerja: [],
          jabatan: [],
          status: []
        })
      } else {
        console.error('Failed to fetch pegawai data')
        setData([])
      }
    } catch (error) {
      console.error("Error fetching pegawai data:", error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPegawaiData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchPegawaiData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, unitKerjaFilter, jabatanFilter, statusFilter, currentPage])

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Daftar Pegawai</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Berikut adalah daftar pegawai yang telah mengajukan usulan perubahan jabatan.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter & Pencarian */}
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Select onValueChange={setOpdFilter} defaultValue="all">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih OPD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Pilih OPD</SelectItem>
                <SelectItem value="Dinas Pendidikan">Dinas Pendidikan</SelectItem>
                <SelectItem value="Diskominfo">Diskominfo</SelectItem>
                <SelectItem value="Bagian Hukum">Bagian Hukum</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setJenisFilter} defaultValue="all">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Periode KAPE</SelectItem>
                <SelectItem value="Fungsional">Fungsional</SelectItem>
                <SelectItem value="Pelaksana">Pelaksana</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setGolonganFilter} defaultValue="all">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Golongan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Golongan</SelectItem>
                <SelectItem value="Guru">Fungsional</SelectItem>
                <SelectItem value="Analisis">Pelaksana</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-[200px]">
              <Input
                placeholder="Nama / NIP Pegawai"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        {/* Tabel Pegawai */}
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Daftar Pegawai</CardTitle>
            <p className="text-sm text-muted-foreground">
              Menampilkan {data.length} pegawai dengan usulan kenaikan pangkat
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Memuat data...</span>
              </div>
            ) : (
              <table className="min-w-full text-sm border-separate border-spacing-y-2">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th className="px-4">No</th>
                    <th className="px-4">Nama / NIP</th>
                    <th className="px-4">Unit Kerja</th>
                    <th className="px-4">Jabatan</th>
                    <th className="px-4">Jenis Jabatan</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((item, index) => (
                      <tr
                        key={item.id}
                        className="bg-white dark:bg-gray-900 shadow-sm border hover:shadow-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg overflow-hidden"
                      >
                        <td className="px-4 py-3 align-top rounded-l-lg">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.nama}</div>
                          <div className="text-gray-500 text-xs">{item.nip}</div>
                        </td>
                        <td className="px-4 py-3">{item.unitKerja}</td>
                        <td className="px-4 py-3">{item.jabatan}</td>
                        <td className="px-4 py-3">{item.jenisJabatan}</td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              item.proposalStatus === "Perlu Verifikasi"
                                ? "bg-yellow-100 text-yellow-800"
                                : item.proposalStatus === "Proses Verifikasi"
                                ? "bg-blue-100 text-blue-800"
                                : item.proposalStatus === "Belum Ada Usulan"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {item.proposalStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 rounded-r-lg">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowDetail(item)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Detail
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center p-4 text-gray-500">
                        {loading ? "Memuat data..." : "Data tidak ditemukan."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Modal Detail */}
        {showModal && selectedPegawai && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-xl p-6 space-y-4 relative">
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-red-500"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">Detail Pegawai</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nama</p>
                <p className="font-medium">{selectedPegawai.nama}</p>
              </div>
              <div>
                <p className="text-gray-500">NIP</p>
                <p className="font-medium">{selectedPegawai.nip}</p>
              </div>
              <div>
                <p className="text-gray-500">Unit Kerja</p>
                <p className="font-medium">{selectedPegawai.unitKerja}</p>
              </div>
              <div>
                <p className="text-gray-500">Jabatan</p>
                <p className="font-medium">{selectedPegawai.jabatan}</p>
              </div>
              <div>
                <p className="text-gray-500">Jenis Jabatan</p>
                <p className="font-medium">{selectedPegawai.jenisJabatan}</p>
              </div>
              <div>
                <p className="text-gray-500">Status Usulan</p>
                <Badge
                  className={
                    selectedPegawai.proposalStatus === "Perlu Verifikasi"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedPegawai.proposalStatus === "Proses Verifikasi"
                      ? "bg-blue-100 text-blue-800"
                      : selectedPegawai.proposalStatus === "Perlu Perbaikan"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }
                >
                  {selectedPegawai.proposalStatus}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </DashboardLayout>
  )
}
