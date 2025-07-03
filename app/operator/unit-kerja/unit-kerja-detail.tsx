"use client"

import { useState } from "react"
import { 
  Building, School, MapPin, Phone, Mail, Globe, User, Calendar, 
  RefreshCw, Database, CheckCircle, X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelativeTime } from "@/lib/date-utils"
import { SchoolDataSync } from "@/components/school-data-sync"
import { useToast } from "@/hooks/use-toast"

interface WilayahMaster {
  id: string
  kode: string
  nama: string
  namaLengkap: string
  ibukota: string
}

interface UnitKerja {
  id: string
  nama: string
  npsn: string | null
  jenjang: string
  alamat: string | null
  kecamatan: string | null
  kabupaten: string | null
  provinsi: string | null
  latitude: number | null
  longitude: number | null
  bentukSekolah: string | null
  statusSekolah: string | null
  lastSyncedAt: string | null
  status: string
  kepalaSekolah: string | null
  phone: string | null
  email: string | null
  website: string | null
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
  wilayahNama: string
  jumlahPegawai: number
  createdAt: string
  updatedAt: string
}

interface UnitKerjaDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unitKerja: UnitKerja | null
  onRefresh: () => void
}

export function UnitKerjaDetail({
  open,
  onOpenChange,
  unitKerja,
  onRefresh
}: UnitKerjaDetailProps) {
  const [activeTab, setActiveTab] = useState("info")
  const { toast } = useToast()

  const handleSyncComplete = () => {
    toast({
      title: "Sinkronisasi Berhasil",
      description: "Data sekolah telah diperbarui dari API eksternal",
    })
    onRefresh()
  }

  const getStatusBentukSekolah = () => {
    if (!unitKerja?.bentukSekolah) return null
    
    const colorMap: Record<string, string> = {
      'SD': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800',
      'SMP': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800',
      'SMA': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800',
      'SMK': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800',
    }
    
    const defaultClass = 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    const className = colorMap[unitKerja.bentukSekolah] || defaultClass
    
    return (
      <Badge variant="outline" className={className}>
        {unitKerja.bentukSekolah}
      </Badge>
    )
  }

  const renderLastSyncInfo = () => {
    if (!unitKerja) return null
    
    if (!unitKerja.lastSyncedAt) {
      return (
        <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-sm mt-1">
          <X className="h-4 w-4 mr-1" />
          Belum pernah disinkronkan
        </div>
      )
    }
    
    return (
      <div className="flex items-center text-green-600 dark:text-green-400 text-sm mt-1">
        <CheckCircle className="h-4 w-4 mr-1" />
        Terakhir diperbarui {formatRelativeTime(new Date(unitKerja.lastSyncedAt))}
      </div>
    )
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Detail Unit Kerja
          </DialogTitle>
        </DialogHeader>
        
        {!unitKerja ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <School className="h-12 w-12 text-green-600 dark:text-green-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{unitKerja.nama}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {unitKerja.jenjang}
                  </Badge>
                  {getStatusBentukSekolah()}
                  <Badge variant={unitKerja.status === "Aktif" ? "default" : "destructive"}>
                    {unitKerja.status}
                  </Badge>
                </div>
                {renderLastSyncInfo()}
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informasi Dasar</TabsTrigger>
                <TabsTrigger value="api">Data API Sekolah</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                      <Building className="mr-2 h-5 w-5" /> Informasi Sekolah
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">NPSN</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.npsn || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Jenjang</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.jenjang}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.status}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Wilayah</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.wilayahNama}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Kecamatan</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.kecamatan || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                      <Mail className="mr-2 h-5 w-5" /> Kontak & Pegawai
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Kepala Sekolah</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.kepalaSekolah || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Email</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.email || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Telepon</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Website</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.website || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Jumlah Pegawai</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.jumlahPegawai || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                    <MapPin className="mr-2 h-5 w-5" /> Alamat Lengkap
                  </h3>
                  <p className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                    {unitKerja.alamat || 'Alamat belum diisi'}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="api" className="space-y-6 pt-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-300 flex items-center">
                    <Database className="mr-2 h-5 w-5" /> Data API Sekolah Indonesia
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-2">
                    Fitur ini menggunakan API dari <a href="https://github.com/wanrabbae/api-sekolah-indonesia" target="_blank" rel="noopener noreferrer" className="underline font-medium">github.com/wanrabbae/api-sekolah-indonesia</a> untuk melengkapi data sekolah seperti NPSN, alamat, dan koordinat.
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                    Masukkan nama sekolah yang tepat untuk mendapatkan hasil pencarian yang akurat. Contoh: "SMAN 3 Balikpapan" atau "SMA Negeri 1 Jakarta".
                  </p>
                </div>
                
                {unitKerja.lastSyncedAt ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                        <School className="mr-2 h-5 w-5" /> Identitas Sekolah
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">NPSN</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.npsn || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Bentuk</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.bentukSekolah || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Status</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.statusSekolah || '-'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                        <MapPin className="mr-2 h-5 w-5" /> Lokasi
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Provinsi</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.provinsi || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Kabupaten/Kota</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.kabupaten || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Kecamatan</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{unitKerja.kecamatan || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Koordinat</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {unitKerja.latitude && unitKerja.longitude 
                              ? `${unitKerja.latitude}, ${unitKerja.longitude}` 
                              : '-'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-md border border-gray-200 dark:border-gray-600 mb-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Database className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Data Belum Tersedia</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        Belum ada data yang disinkronkan dari API Sekolah. Silakan gunakan fitur pencarian di bawah untuk melengkapi data sekolah ini.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                    <RefreshCw className="mr-2 h-5 w-5" /> Sinkronisasi Data
                  </h3>
                  
                  <SchoolDataSync 
                    unitKerjaId={unitKerja.id} 
                    unitKerjaNama={unitKerja.nama}
                    onSyncComplete={handleSyncComplete}
                  />
                </div>
                
                {unitKerja.lastSyncedAt && (
                  <>
                    {unitKerja.latitude && unitKerja.longitude ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                          <MapPin className="mr-2 h-5 w-5" /> Peta Lokasi
                        </h3>
                        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                          <a 
                            href={`https://www.google.com/maps?q=${unitKerja.latitude},${unitKerja.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Globe className="h-5 w-5" /> Lihat di Google Maps
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center gap-2 text-center">
                        <MapPin className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Koordinat lokasi tidak tersedia
                        </p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
