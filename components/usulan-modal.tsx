"use client"

import React, { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, MapPin, GraduationCap, Briefcase, Phone, Mail, FileText, AlertCircle, Upload, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface Usulan {
  id: string
  pegawaiId: string
  pegawai?: {
    nip: string
    nama: string
    jabatan: string
    golongan: string
    unitKerja: string
    statusKepegawaian: string
  }
  periode: string
  jenisUsulan: string
  golonganTujuan: string
  statusVerifikasi: string
  keterangan?: string
  tanggalUsulan: string
  tanggalVerifikasi?: string
  verifikasiOleh?: string
  documents?: Array<{
    id: string
    nama: string
    jenis: string
    ukuran: string
    url: string
  }>
  createdAt?: string
  updatedAt?: string
}

interface UsulanModalProps {
  isOpen: boolean
  onClose: () => void
  usulan?: Usulan | null
  mode: 'view' | 'edit' | 'create'
  onSave?: (data: Partial<Usulan>, files?: FileList | null) => Promise<void>
  pegawaiOptions?: Array<{ id: string; nip: string; nama: string; jabatan: string; golongan: string }>
}

const JENIS_USULAN_OPTIONS = [
  "Kenaikan Pangkat Reguler",
  "Kenaikan Pangkat Pilihan", 
  "Kenaikan Pangkat Anumerta",
  "Kenaikan Pangkat Istimewa"
]

const GOLONGAN_OPTIONS = [
  "I/A", "I/B", "I/C", "I/D",
  "II/A", "II/B", "II/C", "II/D", 
  "III/A", "III/B", "III/C", "III/D",
  "IV/A", "IV/B", "IV/C", "IV/D", "IV/E"
]

const STATUS_VERIFIKASI_OPTIONS = [
  "DRAFT",
  "DIAJUKAN", 
  "DIVERIFIKASI",
  "DIKEMBALIKAN",
  "DISETUJUI",
  "DITOLAK"
]

const JENIS_DOKUMEN_OPTIONS = [
  "SK Pangkat Terakhir",
  "SK Jabatan Terakhir", 
  "Ijazah Pendidikan Terakhir",
  "Transkrip Nilai",
  "SKP/Penilaian Prestasi Kerja",
  "Surat Keterangan Sehat",
  "Kartu Pegawai",
  "Pas Foto",
  "Surat Pernyataan",
  "Dokumen Pendukung Lainnya"
]

export function UsulanModal({ isOpen, onClose, usulan, mode, onSave, pegawaiOptions = [] }: UsulanModalProps) {
  const [formData, setFormData] = useState<Partial<Usulan>>({})
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.pegawaiId?.trim()) {
      newErrors.pegawaiId = 'Pegawai wajib dipilih'
    }
    if (!formData.periode?.trim()) {
      newErrors.periode = 'Periode wajib diisi'
    }
    if (!formData.jenisUsulan?.trim()) {
      newErrors.jenisUsulan = 'Jenis usulan wajib dipilih'
    }
    if (!formData.golonganTujuan?.trim()) {
      newErrors.golonganTujuan = 'Golongan tujuan wajib dipilih'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      
      // Convert selected files to FileList-like object
      const fileList = selectedFiles.length > 0 ? {
        length: selectedFiles.length,
        item: (index: number) => selectedFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i)
          }
        }
      } as unknown as FileList : null

      await onSave?.(formData, fileList)
      onClose()
    } catch (error) {
      console.error('Error saving usulan:', error)
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'DRAFT': 'outline',
      'DIAJUKAN': 'secondary',
      'DIVERIFIKASI': 'default',
      'DIKEMBALIKAN': 'destructive',
      'DISETUJUI': 'default',
      'DITOLAK': 'destructive'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Initialize form data when modal opens
  React.useEffect(() => {
    if (usulan && (mode === 'view' || mode === 'edit')) {
      setFormData(usulan)
    } else if (mode === 'create') {
      setFormData({
        statusVerifikasi: 'DRAFT',
        tanggalUsulan: new Date().toISOString().split('T')[0]
      })
    }
    setSelectedFiles([])
    setErrors({})
  }, [usulan, mode, isOpen])

  if (mode === 'view') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detail Usulan Kenaikan Pangkat
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap usulan kenaikan pangkat
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Usulan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Usulan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Periode</Label>
                    <p className="font-medium">{usulan?.periode || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Jenis Usulan</Label>
                    <p>{usulan?.jenisUsulan || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Golongan Tujuan</Label>
                    <p className="font-mono font-medium">{usulan?.golonganTujuan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div>{usulan?.statusVerifikasi ? getStatusBadge(usulan.statusVerifikasi) : '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tanggal Usulan</Label>
                    <p>{formatDate(usulan?.tanggalUsulan)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tanggal Verifikasi</Label>
                    <p>{formatDate(usulan?.tanggalVerifikasi)}</p>
                  </div>
                </div>

                {usulan?.keterangan && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Keterangan</Label>
                    <p className="text-sm">{usulan.keterangan}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Pegawai */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Pegawai</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">NIP</Label>
                    <p className="font-mono text-sm">{usulan?.pegawai?.nip || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nama</Label>
                    <p className="font-medium">{usulan?.pegawai?.nama || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Jabatan</Label>
                    <p>{usulan?.pegawai?.jabatan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Golongan Saat Ini</Label>
                    <p className="font-mono">{usulan?.pegawai?.golongan || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Unit Kerja</Label>
                    <p>{usulan?.pegawai?.unitKerja || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status Kepegawaian</Label>
                    <p>{usulan?.pegawai?.statusKepegawaian || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dokumen Pendukung */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Dokumen Pendukung</CardTitle>
              </CardHeader>
              <CardContent>
                {usulan?.documents && usulan.documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {usulan.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{doc.nama}</p>
                            <p className="text-xs text-muted-foreground">{doc.jenis}</p>
                            <p className="text-xs text-muted-foreground">{doc.ukuran}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada dokumen yang diupload
                  </div>
                )}
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
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Tambah Usulan Baru' : 'Edit Usulan'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Buat usulan kenaikan pangkat baru' 
              : 'Ubah informasi usulan'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Usulan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Usulan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pegawai *</Label>
                <Select 
                  value={formData.pegawaiId || ''} 
                  onValueChange={(value) => handleInputChange('pegawaiId', value)}
                  disabled={mode === 'edit'}
                >
                  <SelectTrigger className={errors.pegawaiId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih pegawai" />
                  </SelectTrigger>
                  <SelectContent>
                    {pegawaiOptions.map(pegawai => (
                      <SelectItem key={pegawai.id} value={pegawai.id}>
                        {pegawai.nip} - {pegawai.nama} ({pegawai.golongan})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pegawaiId && <p className="text-sm text-red-500">{errors.pegawaiId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periode">Periode *</Label>
                  <Input
                    id="periode"
                    value={formData.periode || ''}
                    onChange={(e) => handleInputChange('periode', e.target.value)}
                    placeholder="Contoh: Agustus 2025"
                    className={errors.periode ? 'border-red-500' : ''}
                  />
                  {errors.periode && <p className="text-sm text-red-500">{errors.periode}</p>}
                </div>
                <div>
                  <Label>Jenis Usulan *</Label>
                  <Select 
                    value={formData.jenisUsulan || ''} 
                    onValueChange={(value) => handleInputChange('jenisUsulan', value)}
                  >
                    <SelectTrigger className={errors.jenisUsulan ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih jenis usulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_USULAN_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jenisUsulan && <p className="text-sm text-red-500">{errors.jenisUsulan}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Golongan Tujuan *</Label>
                  <Select 
                    value={formData.golonganTujuan || ''} 
                    onValueChange={(value) => handleInputChange('golonganTujuan', value)}
                  >
                    <SelectTrigger className={errors.golonganTujuan ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih golongan tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOLONGAN_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.golonganTujuan && <p className="text-sm text-red-500">{errors.golonganTujuan}</p>}
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={formData.statusVerifikasi || ''} 
                    onValueChange={(value) => handleInputChange('statusVerifikasi', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_VERIFIKASI_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="tanggalUsulan">Tanggal Usulan</Label>
                <Input
                  id="tanggalUsulan"
                  type="date"
                  value={formData.tanggalUsulan ? new Date(formData.tanggalUsulan).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('tanggalUsulan', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan || ''}
                  onChange={(e) => handleInputChange('keterangan', e.target.value)}
                  placeholder="Keterangan tambahan (opsional)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload Dokumen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dokumen Pendukung</CardTitle>
              <CardDescription>
                Upload dokumen yang diperlukan untuk usulan kenaikan pangkat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Pilih File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload dokumen pendukung"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Format yang didukung: PDF, DOC, DOCX, JPG, PNG (Maks. 5MB per file)
                </p>
              </div>

              {/* File List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">File yang dipilih:</Label>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Documents (for edit mode) */}
              {mode === 'edit' && usulan?.documents && usulan.documents.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dokumen yang sudah ada:</Label>
                  {usulan.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.nama}</p>
                          <p className="text-xs text-muted-foreground">{doc.jenis} - {doc.ukuran}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Document Requirements */}
              <div className="mt-4">
                <Label className="text-sm font-medium">Dokumen yang diperlukan:</Label>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  {JENIS_DOKUMEN_OPTIONS.map(doc => (
                    <li key={doc}>• {doc}</li>
                  ))}
                </ul>
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
