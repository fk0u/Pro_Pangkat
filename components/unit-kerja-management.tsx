'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface UnitKerjaData {
  id: string
  nama: string
  npsn?: string
  jenjang?: string
  wilayah: string
  alamat?: string
  kepalaSekolah?: string
  telepon?: string
  email?: string
  website?: string
  _count: {
    users: number
  }
  createdAt: string
}

interface ImportResults {
  total: number
  success: number
  failed: number
  errors?: string[]
  availableWilayah?: string[]
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

const jenjangOptions = [
  'TK/PAUD',
  'SD/MI',
  'SMP/MTs',
  'SMA/MA',
  'SMK',
  'Perguruan Tinggi',
  'Dinas Pendidikan',
  'UPTD'
]

export default function UnitKerjaManagement() {
  const [unitKerja, setUnitKerja] = useState<UnitKerjaData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Search and filter
  const [search, setSearch] = useState('')
  const [selectedWilayah, setSelectedWilayah] = useState('')
  const [selectedJenjang, setSelectedJenjang] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingUnitKerja, setEditingUnitKerja] = useState<UnitKerjaData | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    nama: '',
    npsn: '',
    jenjang: '',
    wilayah: '',
    alamat: '',
    kepalaSekolah: '',
    telepon: '',
    email: '',
    website: ''
  })
  
  // Import
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)

  // Fetch unit kerja data
  const fetchUnitKerja = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search,
        ...(selectedWilayah && { wilayah: selectedWilayah }),
        ...(selectedJenjang && { jenjang: selectedJenjang })
      })

      const response = await fetch(`/api/admin/unit-kerja?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUnitKerja(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        setError(data.error || 'Gagal memuat data unit kerja')
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, selectedWilayah, selectedJenjang, limit])

  useEffect(() => {
    fetchUnitKerja()
  }, [fetchUnitKerja])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const url = editingUnitKerja 
        ? `/api/admin/unit-kerja?id=${editingUnitKerja.id}`
        : '/api/admin/unit-kerja'
      
      const method = editingUnitKerja ? 'PUT' : 'POST'

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
        setEditingUnitKerja(null)
        resetForm()
        fetchUnitKerja()
      } else {
        setError(data.error || 'Terjadi kesalahan')
      }
    } catch {
      setError('Terjadi kesalahan saat menyimpan data')
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus unit kerja ini?')) return

    try {
      const response = await fetch(`/api/admin/unit-kerja?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        fetchUnitKerja()
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

      const response = await fetch('/api/admin/import-unit-kerja', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setImportResults(data.results)
        setSuccess(data.message)
        fetchUnitKerja()
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
      nama: '',
      npsn: '',
      jenjang: '',
      wilayah: '',
      alamat: '',
      kepalaSekolah: '',
      telepon: '',
      email: '',
      website: ''
    })
  }

  // Handle edit
  const handleEdit = (unitKerja: UnitKerjaData) => {
    setEditingUnitKerja(unitKerja)
    setFormData({
      nama: unitKerja.nama,
      npsn: unitKerja.npsn || '',
      jenjang: unitKerja.jenjang || '',
      wilayah: unitKerja.wilayah,
      alamat: unitKerja.alamat || '',
      kepalaSekolah: unitKerja.kepalaSekolah || '',
      telepon: unitKerja.telepon || '',
      email: unitKerja.email || '',
      website: unitKerja.website || ''
    })
    setShowEditDialog(true)
  }

  // Download template
  const downloadTemplate = () => {
    const headers = ['No', 'Nama Unit Kerja', 'NPSN', 'Jenjang', 'Wilayah', 'Alamat', 'Kepala Sekolah', 'Telepon', 'Email', 'Website']
    const csvContent = headers.join(',') + '\n' + 
      '1,SD Negeri 1 Samarinda,12345678,SD/MI,Kota Samarinda,Jl. Contoh No. 1,Contoh Kepala Sekolah,081234567890,contoh@email.com,www.sdn1samarinda.sch.id'
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template-import-unit-kerja.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Unit Kerja</h1>
          <p className="text-muted-foreground">Kelola data unit kerja dan sekolah</p>
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
                <DialogTitle>Import Unit Kerja dari Excel</DialogTitle>
                <DialogDescription>
                  Upload file Excel dengan format yang sesuai untuk import data unit kerja
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Format Excel yang dibutuhkan:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No - Nomor urut</li>
                    <li>• Nama Unit Kerja - Nama lengkap unit kerja/sekolah</li>
                    <li>• NPSN - Nomor Pokok Sekolah Nasional (opsional)</li>
                    <li>• Jenjang - Jenjang pendidikan</li>
                    <li>• Wilayah - Nama wilayah sesuai mapping</li>
                    <li>• Alamat - Alamat lengkap (opsional)</li>
                    <li>• Kepala Sekolah - Nama kepala sekolah (opsional)</li>
                    <li>• Telepon - Nomor telepon (opsional)</li>
                    <li>• Email - Email unit kerja (opsional)</li>
                    <li>• Website - Website unit kerja (opsional)</li>
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
                    {importResults.availableWilayah && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">Wilayah yang tersedia:</span>
                        <ul className="text-sm text-blue-600 mt-1">
                          {importResults.availableWilayah.map((wilayah: string, index: number) => (
                            <li key={index}>• {wilayah}</li>
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
                Tambah Unit Kerja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Unit Kerja Baru</DialogTitle>
                <DialogDescription>
                  Masukkan data unit kerja baru
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nama">Nama Unit Kerja *</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="npsn">NPSN</Label>
                    <Input
                      id="npsn"
                      value={formData.npsn}
                      onChange={(e) => setFormData({...formData, npsn: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jenjang">Jenjang</Label>
                    <Select value={formData.jenjang} onValueChange={(value) => setFormData({...formData, jenjang: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenjang" />
                      </SelectTrigger>
                      <SelectContent>
                        {jenjangOptions.map((jenjang) => (
                          <SelectItem key={jenjang} value={jenjang}>
                            {jenjang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="wilayah">Wilayah *</Label>
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
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input
                    id="alamat"
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kepalaSekolah">Kepala Sekolah</Label>
                    <Input
                      id="kepalaSekolah"
                      value={formData.kepalaSekolah}
                      onChange={(e) => setFormData({...formData, kepalaSekolah: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telepon">Telepon</Label>
                    <Input
                      id="telepon"
                      value={formData.telepon}
                      onChange={(e) => setFormData({...formData, telepon: e.target.value})}
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
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
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
                  placeholder="Nama, NPSN, atau alamat..."
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
              <Label htmlFor="jenjang-filter">Jenjang</Label>
              <Select value={selectedJenjang} onValueChange={setSelectedJenjang}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua jenjang</SelectItem>
                  {jenjangOptions.map((jenjang) => (
                    <SelectItem key={jenjang} value={jenjang}>
                      {jenjang}
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
                  setSelectedJenjang('')
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
          <CardTitle>Data Unit Kerja</CardTitle>
          <CardDescription>
            Total {total} unit kerja
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
                    <TableHead>Nama Unit Kerja</TableHead>
                    <TableHead>NPSN</TableHead>
                    <TableHead>Jenjang</TableHead>
                    <TableHead>Wilayah</TableHead>
                    <TableHead>Kepala Sekolah</TableHead>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitKerja.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.nama}</div>
                          {item.alamat && (
                            <div className="text-sm text-muted-foreground">{item.alamat}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.npsn ? (
                          <span className="font-mono">{item.npsn}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {item.jenjang ? (
                          <Badge variant="outline">{item.jenjang}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {wilayahOptions.find(w => w.value === item.wilayah)?.label || item.wilayah}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.kepalaSekolah || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item._count.users} orang
                        </Badge>
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
                            disabled={item._count.users > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {unitKerja.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data unit kerja
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
            <DialogTitle>Edit Unit Kerja</DialogTitle>
            <DialogDescription>
              Perbarui data unit kerja
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nama">Nama Unit Kerja *</Label>
                <Input
                  id="edit-nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-npsn">NPSN</Label>
                <Input
                  id="edit-npsn"
                  value={formData.npsn}
                  onChange={(e) => setFormData({...formData, npsn: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-jenjang">Jenjang</Label>
                <Select value={formData.jenjang} onValueChange={(value) => setFormData({...formData, jenjang: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenjangOptions.map((jenjang) => (
                      <SelectItem key={jenjang} value={jenjang}>
                        {jenjang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-wilayah">Wilayah *</Label>
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
              <Label htmlFor="edit-alamat">Alamat</Label>
              <Input
                id="edit-alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({...formData, alamat: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-kepalaSekolah">Kepala Sekolah</Label>
                <Input
                  id="edit-kepalaSekolah"
                  value={formData.kepalaSekolah}
                  onChange={(e) => setFormData({...formData, kepalaSekolah: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-telepon">Telepon</Label>
                <Input
                  id="edit-telepon"
                  value={formData.telepon}
                  onChange={(e) => setFormData({...formData, telepon: e.target.value})}
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
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowEditDialog(false)
                setEditingUnitKerja(null)
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
