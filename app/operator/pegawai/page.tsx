"use client"

import { useState, useEffect, useCallback } from "react"
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
  createdAt: string
  updatedAt: string
}

export default function ListPegawaiPage() {
  const [filteredData, setFilteredData] = useState<Pegawai[]>([])
  const [search, setSearch] = useState("")
  const [unitKerjaFilter, setUnitKerjaFilter] = useState("all")
  const [jabatanFilter, setJabatanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState({
    totalPegawai: 0,
    pegawaiDenganUsulan: 0,
    totalUsulan: 0,
    usulanAktif: 0
  })
  const [perPage, setPerPage] = useState(10);
  const [filterOptions, setFilterOptions] = useState({
    unitKerja: [] as string[],
    jabatan: [] as string[],
    status: [] as { value: string, label: string }[]
  })

  const handleShowDetail = (pegawai: Pegawai) => {
    setSelectedPegawai(pegawai)
    setShowModal(true)
  }

  const fetchPegawaiData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: perPage.toString(),
        ...(search && { search }),
        ...(unitKerjaFilter !== 'all' && { unitKerja: unitKerjaFilter }),
        ...(jabatanFilter !== 'all' && { jabatan: jabatanFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      // Add a retry mechanism
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let result;
      let lastError: Error | null = null;
      
      while (attempts < maxAttempts && !success) {
        try {
          attempts++;
          const response = await fetch(`/api/operator/pegawai?${params}`);
          
          if (response.ok) {
            result = await response.json();
            if (result && result.success === true) {
              success = true;
            } else {
              lastError = new Error(result?.message || 'Data tidak valid');
              console.error(`Attempt ${attempts}: Invalid data structure - ${lastError.message}`);
            }
          } else {
            const errorText = await response.text();
            lastError = new Error(`Status ${response.status}: ${errorText || 'Unknown error'}`);
            console.error(`Attempt ${attempts}: Failed to fetch pegawai data - ${lastError.message}`);
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(`Attempt ${attempts}: Error fetching data:`, err);
        }
        
        if (!success && attempts < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s...
          const delay = Math.pow(2, attempts - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (success && result) {
        setFilteredData(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setSummary({
          totalPegawai: result.pagination?.totalCount || 0,
          pegawaiDenganUsulan: result.summary?.pegawaiDenganUsulan || 0,
          totalUsulan: result.summary?.totalUsulan || 0,
          usulanAktif: result.summary?.usulanAktif || 0
        });
        setFilterOptions({
          unitKerja: Object.keys(result.summary?.byUnitKerja || {}) || [],
          jabatan: Object.keys(result.summary?.byJabatan || {}) || [],
          status: [
            { value: 'ada_usulan', label: 'Ada Usulan' },
            { value: 'belum_ada', label: 'Belum Ada Usulan' },
            { value: 'selesai', label: 'Selesai/Ditolak' }
          ]
        });
      } else {
        const errorMessage = lastError instanceof Error ? lastError.message : 'Gagal memuat data pegawai setelah beberapa percobaan';
        setError(errorMessage);
        console.error('Failed to fetch pegawai data after multiple attempts:', errorMessage);
        setFilteredData([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      setError(`Terjadi kesalahan: ${errorMessage}`);
      console.error("Error fetching pegawai data:", error);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, search, unitKerjaFilter, jabatanFilter, statusFilter])

  useEffect(() => {
    fetchPegawaiData()
  }, [fetchPegawaiData])

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-700 dark:to-emerald-800 rounded-2xl p-6 text-white shadow-md">
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

        {/* Statistik Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Total Pegawai</p>
                  <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summary.totalPegawai}</h3>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                  <Users className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Pegawai dengan Usulan</p>
                  <h3 className="text-2xl font-bold text-green-900 dark:text-green-100">{summary.pegawaiDenganUsulan}</h3>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Total Usulan</p>
                  <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">{summary.totalUsulan}</h3>
                </div>
                <div className="p-3 bg-amber-200 dark:bg-amber-800 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-700 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Usulan Aktif</p>
                  <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100">{summary.usulanAktif}</h3>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Pencarian */}
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Select onValueChange={setUnitKerjaFilter} defaultValue="all">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Unit Kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                {filterOptions.unitKerja.map(uk => (
                  <SelectItem key={uk} value={uk}>{uk}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setJabatanFilter} defaultValue="all">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Jabatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jabatan</SelectItem>
                {filterOptions.jabatan.map(jabatan => (
                  <SelectItem key={jabatan} value={jabatan}>{jabatan}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setStatusFilter} defaultValue="all">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {filterOptions.status.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
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

        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl">Daftar Pegawai</CardTitle>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mt-2">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {loading ? "Memuat data..." : 
                error ? "Terjadi kesalahan saat memuat data" :
                `Menampilkan ${(currentPage - 1) * perPage + 1} - ${Math.min(currentPage * perPage, summary.totalPegawai)} dari ${summary.totalPegawai} pegawai${summary.pegawaiDenganUsulan > 0 ? ` (${summary.pegawaiDenganUsulan} dengan usulan)` : ''}`}
              </p>
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-2 rounded-md mt-2 text-sm">
                {error}
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ml-2 text-red-700 dark:text-red-300"
                  onClick={() => fetchPegawaiData()}
                >
                  Coba Lagi
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead className="text-left text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4">No</th>
                  <th className="px-4">Nama / NIP</th>
                  <th className="px-4">Unit Kerja</th>
                  <th className="px-4">Jabatan</th>
                  <th className="px-4">Golongan</th>
                  <th className="px-4">Status Usulan</th>
                  <th className="px-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.id}
                      className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-4 py-3 align-top rounded-l-lg">{(currentPage - 1) * perPage + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.nama}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{item.nip}</div>
                      </td>
                      <td className="px-4 py-3">{item.unitKerja}</td>
                      <td className="px-4 py-3">{item.jabatan}</td>
                      <td className="px-4 py-3">{item.golongan}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            item.proposalStatus === "Belum Ada Usulan"
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                              : item.proposalStatus === "Ada Usulan Aktif"
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300"
                              : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
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
                          className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4 mr-1" /> Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center p-4">
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 dark:border-blue-400 mr-2"></div>
                          <span className="text-gray-500 dark:text-gray-400">Memuat data...</span>
                        </div>
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                          <p>{error || "Data tidak ditemukan."}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => fetchPegawaiData()}
                          >
                            Coba Lagi
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {showModal && selectedPegawai && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-xl p-6 space-y-4 relative border border-gray-200 dark:border-gray-700">
            <button
              className="absolute top-3 right-4 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Detail Pegawai</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Nama</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.nama}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">NIP</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.nip}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Unit Kerja</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.unitKerja}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Jabatan</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.jabatan}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Jenis Jabatan</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.jenisJabatan}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Golongan</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.golongan}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.email || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">No. Telepon</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.phone || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Alamat</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.address || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Usulan</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.totalProposals}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Usulan Aktif</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPegawai.activeProposals}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Status Usulan</p>
                <Badge
                  className={
                    selectedPegawai.proposalStatus === "Belum Ada Usulan"
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      : selectedPegawai.proposalStatus === "Ada Usulan Aktif"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300"
                      : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                  }
                >
                  {selectedPegawai.proposalStatus}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Pagination */}
        {!loading && !error && (
          <div className="mt-4">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300 mb-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div>
                {summary.totalPegawai > 0 ? (
                  <>
                    Menampilkan <span className="font-semibold">{(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, summary.totalPegawai)}</span> dari <span className="font-semibold">{summary.totalPegawai}</span> data
                  </>
                ) : (
                  "Tidak ada data untuk ditampilkan"
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span>Tampilkan:</span>
                <Select 
                  value={perPage.toString()} 
                  onValueChange={(value) => {
                    setPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px] h-8 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <SelectValue placeholder="Jumlah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>data per halaman</span>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    
                    // If current page is > 3, shift the range
                    if (currentPage > 3 && totalPages > 5) {
                      const offset = Math.min(currentPage - 3, totalPages - 5);
                      pageNum += offset;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? 
                          "bg-blue-600 text-white hover:bg-blue-700" : 
                          "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
