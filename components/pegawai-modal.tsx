"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, MapPin, GraduationCap, Briefcase, Phone, Mail, FileText, AlertCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface Pegawai {
  id: string
  nip: string
  nama: string
  email?: string
  noHp?: string
  jabatan: string
  unitKerja: string
  golongan: string
  alamat?: string
  statusKepegawaian: string
  jenisKelamin: string
  pendidikanTerakhir?: string
  tanggalLahir?: string
  tempatLahir?: string
  statusPerkawinan?: string
  agama?: string
  tanggalMasukKerja?: string
  masaKerja?: string
  createdAt?: string
  updatedAt?: string
}

interface PegawaiModalProps {
  isOpen: boolean
  onClose: () => void
  pegawai?: Pegawai | null
  mode: 'view' | 'edit' | 'create'
  onSave?: (data: Partial<Pegawai>) => Promise<void>
}

const JABATAN_OPTIONS = [
  "Guru Kelas",
  "Guru Mata Pelajaran",
  "Kepala Sekolah",
  "Wakil Kepala Sekolah",
  "Guru BK",
  "Pustakawan",
  "Laboran",
  "Tenaga Administrasi",
  "Penjaga Sekolah",
  "Tukang Kebun"
]

const GOLONGAN_OPTIONS = [
  "I/A", "I/B", "I/C", "I/D",
  "II/A", "II/B", "II/C", "II/D", 
  "III/A", "III/B", "III/C", "III/D",
  "IV/A", "IV/B", "IV/C", "IV/D", "IV/E"
]

const STATUS_KEPEGAWAIAN_OPTIONS = [
  "PNS",
  "PPPK", 
  "GTT",
  "PTT",
  "Honorer"
]

const JENIS_KELAMIN_OPTIONS = [
  "Laki-laki",
  "Perempuan"
]

const PENDIDIKAN_OPTIONS = [
  "SD",
  "SMP",
  "SMA/SMK",
  "D3",
  "S1",
  "S2",
  "S3"
]

const STATUS_PERKAWINAN_OPTIONS = [
  "Belum Menikah",
  "Menikah",
  "Cerai Hidup",
  "Cerai Mati"
]

const AGAMA_OPTIONS = [
  "Islam",
  "Kristen Protestan",
  "Kristen Katolik",
  "Hindu",
  "Buddha",
  "Konghucu"
]

export function PegawaiModal({ isOpen, onClose, pegawai, mode, onSave }: PegawaiModalProps) {
  const [formData, setFormData] = useState<Partial<Pegawai>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (pegawai && (mode === 'view' || mode === 'edit')) {
      setFormData(pegawai)
    } else if (mode === 'create') {
      setFormData({})
    }
    setErrors({})
  }, [pegawai, mode, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nip?.trim()) {
      newErrors.nip = 'NIP wajib diisi'
    }
    if (!formData.nama?.trim()) {
      newErrors.nama = 'Nama wajib diisi'
    }
    if (!formData.jabatan?.trim()) {
      newErrors.jabatan = 'Jabatan wajib diisi'
    }
    if (!formData.golongan?.trim()) {
      newErrors.golongan = 'Golongan wajib diisi'
    }
    if (!formData.statusKepegawaian?.trim()) {
      newErrors.statusKepegawaian = 'Status kepegawaian wajib diisi'
    }
    if (!formData.jenisKelamin?.trim()) {
      newErrors.jenisKelamin = 'Jenis kelamin wajib diisi'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      await onSave?.(formData)
      onClose()
    } catch (error) {
      console.error('Error saving pegawai:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PNS': 'default',
      'PPPK': 'secondary',
      'GTT': 'outline',
      'PTT': 'outline',
      'Honorer': 'destructive'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  if (mode === 'view') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detail Pegawai
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap pegawai
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Pribadi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Pribadi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">NIP</Label>
                    <p className="font-mono text-sm">{pegawai?.nip || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nama Lengkap</Label>
                    <p className="font-medium">{pegawai?.nama || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Jenis Kelamin</Label>
                    <p>{pegawai?.jenisKelamin || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tempat, Tanggal Lahir</Label>
                    <p>{pegawai?.tempatLahir ? `${pegawai.tempatLahir}, ${formatDate(pegawai.tanggalLahir)}` : '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status Perkawinan</Label>
                    <p>{pegawai?.statusPerkawinan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Agama</Label>
                    <p>{pegawai?.agama || '-'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Alamat</Label>
                  <p className="text-sm">{pegawai?.alamat || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Data Kepegawaian */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Kepegawaian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Jabatan</Label>
                    <p className="font-medium">{pegawai?.jabatan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Unit Kerja</Label>
                    <p>{pegawai?.unitKerja || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Golongan</Label>
                    <p className="font-mono font-medium">{pegawai?.golongan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status Kepegawaian</Label>
                    <div>{pegawai?.statusKepegawaian ? getStatusBadge(pegawai.statusKepegawaian) : '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">TMT</Label>
                    <p>{formatDate(pegawai?.tanggalMasukKerja)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Masa Kerja</Label>
                    <p>{pegawai?.masaKerja || '-'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Pendidikan Terakhir</Label>
                  <p>{pegawai?.pendidikanTerakhir || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Data Kontak */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Informasi Kontak</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p>{pegawai?.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    No. HP
                  </Label>
                  <p>{pegawai?.noHp || '-'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'create' ? 'Tambah Pegawai Baru' : 'Edit Data Pegawai'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Masukkan data pegawai baru' 
              : 'Ubah informasi pegawai'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Pribadi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Pribadi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nip">NIP *</Label>
                  <Input
                    id="nip"
                    value={formData.nip || ''}
                    onChange={(e) => handleInputChange('nip', e.target.value)}
                    placeholder="Masukkan NIP"
                    className={errors.nip ? 'border-red-500' : ''}
                  />
                  {errors.nip && <p className="text-sm text-red-500">{errors.nip}</p>}
                </div>
                <div>
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    value={formData.nama || ''}
                    onChange={(e) => handleInputChange('nama', e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className={errors.nama ? 'border-red-500' : ''}
                  />
                  {errors.nama && <p className="text-sm text-red-500">{errors.nama}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jenis Kelamin *</Label>
                  <Select 
                    value={formData.jenisKelamin || ''} 
                    onValueChange={(value) => handleInputChange('jenisKelamin', value)}
                  >
                    <SelectTrigger className={errors.jenisKelamin ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_KELAMIN_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jenisKelamin && <p className="text-sm text-red-500">{errors.jenisKelamin}</p>}
                </div>
                <div>
                  <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                  <Input
                    id="tempatLahir"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => handleInputChange('tempatLahir', e.target.value)}
                    placeholder="Masukkan tempat lahir"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                  <Input
                    id="tanggalLahir"
                    type="date"
                    value={formData.tanggalLahir ? new Date(formData.tanggalLahir).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('tanggalLahir', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Status Perkawinan</Label>
                  <Select 
                    value={formData.statusPerkawinan || ''} 
                    onValueChange={(value) => handleInputChange('statusPerkawinan', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status perkawinan" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_PERKAWINAN_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Agama</Label>
                <Select 
                  value={formData.agama || ''} 
                  onValueChange={(value) => handleInputChange('agama', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih agama" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGAMA_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea
                  id="alamat"
                  value={formData.alamat || ''}
                  onChange={(e) => handleInputChange('alamat', e.target.value)}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Kepegawaian */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Kepegawaian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Jabatan *</Label>
                <Select 
                  value={formData.jabatan || ''} 
                  onValueChange={(value) => handleInputChange('jabatan', value)}
                >
                  <SelectTrigger className={errors.jabatan ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {JABATAN_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jabatan && <p className="text-sm text-red-500">{errors.jabatan}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Golongan *</Label>
                  <Select 
                    value={formData.golongan || ''} 
                    onValueChange={(value) => handleInputChange('golongan', value)}
                  >
                    <SelectTrigger className={errors.golongan ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih golongan" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOLONGAN_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.golongan && <p className="text-sm text-red-500">{errors.golongan}</p>}
                </div>
                <div>
                  <Label>Status Kepegawaian *</Label>
                  <Select 
                    value={formData.statusKepegawaian || ''} 
                    onValueChange={(value) => handleInputChange('statusKepegawaian', value)}
                  >
                    <SelectTrigger className={errors.statusKepegawaian ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_KEPEGAWAIAN_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.statusKepegawaian && <p className="text-sm text-red-500">{errors.statusKepegawaian}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="tanggalMasukKerja">TMT (Tanggal Masuk Kerja)</Label>
                <Input
                  id="tanggalMasukKerja"
                  type="date"
                  value={formData.tanggalMasukKerja ? new Date(formData.tanggalMasukKerja).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('tanggalMasukKerja', e.target.value)}
                />
              </div>

              <div>
                <Label>Pendidikan Terakhir</Label>
                <Select 
                  value={formData.pendidikanTerakhir || ''} 
                  onValueChange={(value) => handleInputChange('pendidikanTerakhir', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {PENDIDIKAN_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Kontak */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Kontak</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contoh@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="noHp">No. HP</Label>
                <Input
                  id="noHp"
                  value={formData.noHp || ''}
                  onChange={(e) => handleInputChange('noHp', e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
