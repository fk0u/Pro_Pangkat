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
import { User, Mail } from "lucide-react"

interface Pegawai {
  id: string
  nip: string
  nama: string
  email?: string
  jabatan: string
  unitKerja: string
  golongan: string
  tmtJabatan?: string
  status?: string
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
    } else if (formData.nip.length !== 18) {
      newErrors.nip = 'NIP harus 18 digit'
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
      'AKTIF': 'default',
      'TIDAK_AKTIF': 'destructive'
    }
    return <Badge variant={variants[status] || 'outline'}>{status === 'AKTIF' ? 'Aktif' : 'Tidak Aktif'}</Badge>
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
            {/* Data Pegawai */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pegawai</CardTitle>
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
                    <Label className="text-sm font-medium text-muted-foreground">TMT Jabatan</Label>
                    <p>{formatDate(pegawai?.tmtJabatan)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div>{pegawai?.status ? getStatusBadge(pegawai.status) : '-'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Data Kontak */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Kontak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p>{pegawai?.email || '-'}</p>
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
          {/* Data Utama */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Utama</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nip">NIP * (18 digit)</Label>
                <Input
                  id="nip"
                  value={formData.nip || ''}
                  onChange={(e) => handleInputChange('nip', e.target.value)}
                  placeholder="Masukkan NIP 18 digit"
                  maxLength={18}
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
            </CardContent>
          </Card>

          {/* Data Jabatan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Jabatan</CardTitle>
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

              <div>
                <Label htmlFor="tmtJabatan">TMT Jabatan</Label>
                <Input
                  id="tmtJabatan"
                  type="date"
                  value={formData.tmtJabatan ? new Date(formData.tmtJabatan).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('tmtJabatan', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="unitKerja">Unit Kerja</Label>
                <Input
                  id="unitKerja"
                  value={formData.unitKerja || ''}
                  onChange={(e) => handleInputChange('unitKerja', e.target.value)}
                  placeholder="Masukkan nama unit kerja"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Kontak */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Kontak</CardTitle>
            </CardHeader>
            <CardContent>
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
                <p className="text-sm text-muted-foreground mt-1">
                  Jika kosong, email akan dibuat otomatis dari NIP
                </p>
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
