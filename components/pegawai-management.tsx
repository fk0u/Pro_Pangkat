'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Download, Upload, Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCallback } from 'react'

interface PegawaiData {
  id: string
  nip: string
  name: string
  email?: string
  golongan?: string
  jabatan?: string
  tmtJabatan?: string
  phone?: string
  address?: string
  unitKerja?: {
    id: string
    nama: string
    jenjang?: string
    wilayah: string
  }
  wilayah?: string
  createdAt: string
}

interface UnitKerjaOption {
  id: string
  nama: string
  jenjang?: string
  wilayah: string
}

interface ImportResults {
  total: number
  success: number
  failed: number
  errors?: string[]
}

const wilayahOptions = [
  { value: 'BALIKPAPAN_PPU', label: 'Balikpapan & Penajam Paser Utara' },
  { value: 'KUTIM_BONTANG', label: 'Kutai Timur & Bontang' },
  { value: 'KUKAR', label: 'Kutai Kartanegara' },
  { value: 'KUBAR_MAHULU', label: 'Kutai Barat & Mahakam Ulu' },
  { value: 'PASER', label: 'Paser' },
  { value: 'BERAU', label: 'Berau' },
  { value: 'SAMARINDA', label: 'Samarinda' }
]

export default function PegawaiManagement() {
  const [pegawai, setPegawai] = useState<PegawaiData[]>([])
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerjaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Search and filter
  const [search, setSearch] = useState('')
  const [selectedWilayah, setSelectedWilayah] = useState('')
  const [selectedUnitKerja, setSelectedUnitKerja] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingPegawai, setEditingPegawai] = useState<PegawaiData | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    email: '',
    golongan: '',
    jabatan: '',
    tmtJabatan: '',
    unitKerjaId: '',
    wilayah: '',
    phone: '',
    address: ''
  })
  
  // Import
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)

  // Fetch pegawai data
  const fetchPegawai = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search,
        ...(selectedWilayah && { wilayah: selectedWilayah }),
        ...(selectedUnitKerja && { unitKerjaId: selectedUnitKerja })
      })

      const response = await fetch(`/api/admin/pegawai?${params}`)
      const data = await response.json()

      if (response.ok) {
        setPegawai(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        setError(data.error || 'Gagal memuat data pegawai')
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, selectedWilayah, selectedUnitKerja, limit])

  // Fetch unit kerja list
  const fetchUnitKerja = async () => {
    try {
      const response = await fetch('/api/admin/unit-kerja?limit=1000')
      const data = await response.json()

      if (response.ok) {
        setUnitKerjaList(data.data)
      }
    } catch {
      console.error('Error fetching unit kerja')
    }
  }

  useEffect(() => {
    fetchPegawai()
  }, [fetchPegawai])

  useEffect(() => {
    fetchUnitKerja()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const url = editingPegawai 
        ? `/api/admin/pegawai?id=${editingPegawai.id}`
        : '/api/admin/pegawai'
      
      const method = editingPegawai ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setShowAddDialog(false)
        setShowEditDialog(false)
        setEditingPegawai(null)
        resetForm()
        fetchPegawai()
      } else {
        setError(data.error || 'Terjadi kesalahan')
      }
    } catch {
      setError('Terjadi kesalahan saat menyimpan data')
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pegawai ini?')) return

    try {
      const response = await fetch(`/api/admin/pegawai?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchPegawai()
      } else {
        setError(data.error || 'Terjadi kesalahan')
      }
    } catch {
      setError('Terjadi kesalahan saat menghapus data')
    }
  }

  // Handle import
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return

    setImporting(true)
    setError('')
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/admin/import-pegawai', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setImportResults(data.results)
        setSuccess(data.message)
        fetchPegawai()
      } else {
        setError(data.error || 'Terjadi kesalahan saat import')
      }
    } catch {
      setError('Terjadi kesalahan saat import data')
    } finally {
      setImporting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      nip: '',
      name: '',
      email: '',
      golongan: '',
      jabatan: '',
      tmtJabatan: '',
      unitKerjaId: '',
      wilayah: '',
      phone: '',
      address: ''
    })
  }

  // Handle edit
  const handleEdit = (pegawai: PegawaiData) => {
    setEditingPegawai(pegawai)
    setFormData({
      nip: pegawai.nip,
      name: pegawai.name,
      email: pegawai.email || '',
      golongan: pegawai.golongan || '',
      jabatan: pegawai.jabatan || '',
      tmtJabatan: pegawai.tmtJabatan ? pegawai.tmtJabatan.split('T')[0] : '',
      unitKerjaId: pegawai.unitKerja?.id || '',
      wilayah: pegawai.wilayah || '',
      phone: pegawai.phone || '',
      address: pegawai.address || ''
    })
    setShowEditDialog(true)
  }

  // Download template
  const downloadTemplate = () => {
    const headers = ['No', 'Nama', 'NIP', 'Golongan', 'Jabatan', 'TMT Jabatan', 'Unit Kerja', 'Cabang Dinas']
    const csvContent = headers.join(',') + '\n' + 
      '1,Budi Santoso,196501010123456001,III/a,Guru,2023-01-01,SD Negeri 1,Kota Samarinda\n' +
      '2,Siti Aminah,197202150123456002,III/b,Guru,2023-02-01,SMP Negeri 2,Kabupaten Kutai Kartanegara\n' +
      '3,Ahmad Rahman,198305220123456003,IV/a,Kepala Sekolah,2022-08-01,SMA Negeri 1,Kabupaten Berau'
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template-import-pegawai.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Pegawai</h1>
          <p className="text-muted-foreground">Kelola data pegawai dan import dari Excel</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Pegawai dari Excel</DialogTitle>
                <DialogDescription>
                  Upload file Excel dengan format yang sesuai untuk import data pegawai
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Format Excel yang dibutuhkan:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No - Nomor urut</li>
                    <li>• Nama - Nama lengkap pegawai</li>
                    <li>• NIP - Nomor Induk Pegawai (18 digit)</li>
                    <li>• Golongan - Golongan kepegawaian</li>
                    <li>• Jabatan - Jabatan pegawai</li>
                    <li>• TMT Jabatan - Tanggal TMT Jabatan (YYYY-MM-DD)</li>
                    <li>• Unit Kerja - Nama unit kerja</li>
                    <li>• Cabang Dinas - Wilayah/Cabang Dinas</li>
                  </ul>
                  <Button variant="link" className="p-0 h-auto" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-1" />
                    Download Template
                  </Button>
                </div>

                <form onSubmit={handleImport} className="space-y-4">
                  <div>
                    <Label htmlFor="import-file">File Excel</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowImportDialog(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={importing || !importFile}>
                      {importing ? 'Importing...' : 'Import'}
                    </Button>
                  </DialogFooter>
                </form>

                {importResults && (
                  <div className="mt-4 p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Hasil Import:</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <div className="font-medium">{importResults.total}</div>
                      </div>
                      <div>
                        <span className="text-green-600">Berhasil:</span>
                        <div className="font-medium text-green-600">{importResults.success}</div>
                      </div>
                      <div>
                        <span className="text-red-600">Gagal:</span>
                        <div className="font-medium text-red-600">{importResults.failed}</div>
                      </div>
                    </div>
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">Error:</span>
                        <ul className="text-sm text-red-600 mt-1">
                          {importResults.errors.map((error: string, index: number) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pegawai
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Pegawai Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data pegawai baru
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nip">NIP *</Label>
                    <Input
                      id="nip"
                      value={formData.nip}
                      onChange={(e) => setFormData({...formData, nip: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nama *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="golongan">Golongan</Label>
                    <Input
                      id="golongan"
                      value={formData.golongan}
                      onChange={(e) => setFormData({...formData, golongan: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jabatan">Jabatan</Label>
                    <Input
                      id="jabatan"
                      value={formData.jabatan}
                      onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tmtJabatan">TMT Jabatan</Label>
                    <Input
                      id="tmtJabatan"
                      type="date"
                      value={formData.tmtJabatan}
                      onChange={(e) => setFormData({...formData, tmtJabatan: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wilayah">Wilayah</Label>
                    <Select value={formData.wilayah} onValueChange={(value) => setFormData({...formData, wilayah: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih wilayah" />
                      </SelectTrigger>
                      <SelectContent>
                        {wilayahOptions.map((wilayah) => (
                          <SelectItem key={wilayah.value} value={wilayah.value}>
                            {wilayah.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="unitKerjaId">Unit Kerja</Label>
                  <Select value={formData.unitKerjaId} onValueChange={(value) => setFormData({...formData, unitKerjaId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitKerjaList.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nama} - {unit.jenjang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddDialog(false)
                    resetForm()
                  }}>
                    Batal
                  </Button>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nama, NIP, atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="wilayah-filter">Wilayah</Label>
              <Select value={selectedWilayah} onValueChange={setSelectedWilayah}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua wilayah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua wilayah</SelectItem>
                  {wilayahOptions.map((wilayah) => (
                    <SelectItem key={wilayah.value} value={wilayah.value}>
                      {wilayah.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit-kerja-filter">Unit Kerja</Label>
              <Select value={selectedUnitKerja} onValueChange={setSelectedUnitKerja}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua unit kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua unit kerja</SelectItem>
                  {unitKerjaList.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setSelectedWilayah('')
                  setSelectedUnitKerja('')
                  setCurrentPage(1)
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Pegawai</CardTitle>
          <CardDescription>
            Total {total} pegawai
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Golongan</TableHead>
                    <TableHead>Wilayah</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pegawai.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.nip}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.email && (
                            <div className="text-sm text-muted-foreground">{item.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.unitKerja ? (
                          <div>
                            <div className="font-medium">{item.unitKerja.nama}</div>
                            {item.unitKerja.jenjang && (
                              <Badge variant="outline" className="text-xs">
                                {item.unitKerja.jenjang}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{item.jabatan || '-'}</TableCell>
                      <TableCell>{item.golongan || '-'}</TableCell>
                      <TableCell>
                        {item.wilayah && (
                          <Badge variant="secondary">
                            {wilayahOptions.find(w => w.value === item.wilayah)?.label || item.wilayah}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pegawai.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data pegawai
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pegawai</DialogTitle>
            <DialogDescription>
              Perbarui data pegawai
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nip">NIP *</Label>
                <Input
                  id="edit-nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Nama *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telepon</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-golongan">Golongan</Label>
                <Input
                  id="edit-golongan"
                  value={formData.golongan}
                  onChange={(e) => setFormData({...formData, golongan: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-jabatan">Jabatan</Label>
                <Input
                  id="edit-jabatan"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tmtJabatan">TMT Jabatan</Label>
                <Input
                  id="edit-tmtJabatan"
                  type="date"
                  value={formData.tmtJabatan}
                  onChange={(e) => setFormData({...formData, tmtJabatan: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-wilayah">Wilayah</Label>
                <Select value={formData.wilayah} onValueChange={(value) => setFormData({...formData, wilayah: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayahOptions.map((wilayah) => (
                      <SelectItem key={wilayah.value} value={wilayah.value}>
                        {wilayah.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-unitKerjaId">Unit Kerja</Label>
              <Select value={formData.unitKerjaId} onValueChange={(value) => setFormData({...formData, unitKerjaId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit kerja" />
                </SelectTrigger>
                <SelectContent>
                  {unitKerjaList.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.nama} - {unit.jenjang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-address">Alamat</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowEditDialog(false)
                setEditingPegawai(null)
                resetForm()
              }}>
                Batal
              </Button>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
