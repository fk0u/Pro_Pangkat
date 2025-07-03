"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function AddUserPage() {
  const router = useRouter()

  // state form
  const [nip, setNip] = useState("")
  const [nama, setNama] = useState("")
  const [perangkatDaerah, setPerangkatDaerah] = useState("")
  const [golongan, setGolongan] = useState("")
  const [tmtGolongan, setTmtGolongan] = useState<Date>()
  const [jabatan, setJabatan] = useState("")
  const [jenisJabatan, setJenisJabatan] = useState("")
  const [pendidikan, setPendidikan] = useState("")
  const [tahunLulus, setTahunLulus] = useState("")
  const [alamat, setAlamat] = useState("")

  const handleSubmit = async () => {
    const data = {
      nip,
      nama,
      perangkat_daerah: perangkatDaerah,
      golongan,
      tmt_golongan: tmtGolongan ? format(tmtGolongan, "yyyy-MM-dd") : null,
      jabatan,
      jenis_jabatan: jenisJabatan,
      pendidikan,
      tahun_lulus: tahunLulus,
      alamat,
    }

    try {
      const res = await fetch("http://localhost:8000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        alert("Data pengguna berhasil disimpan")
        router.push("/admin/users") // redirect ke halaman users
      } else {
        alert("Gagal menyimpan data pengguna")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Terjadi kesalahan saat menyimpan")
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Pengguna Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">NIP Pegawai *</label>
                <Input value={nip} onChange={(e) => setNip(e.target.value)} placeholder="Masukkan NIP 18 digit" />
              </div>
              <div>
                <label className="text-sm font-medium">Nama Pegawai *</label>
                <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap pegawai" />
              </div>
              <div>
                <label className="text-sm font-medium">Perangkat Daerah</label>
                <Select onValueChange={setPerangkatDaerah}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih perangkat daerah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinas Pendidikan">Dinas Pendidikan</SelectItem>
                    <SelectItem value="Diskominfo">Diskominfo</SelectItem>
                    <SelectItem value="BKPSDM">BKPSDM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Golongan *</label>
                <Select onValueChange={setGolongan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih golongan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="III/a">III/a</SelectItem>
                    <SelectItem value="III/b">III/b</SelectItem>
                    <SelectItem value="III/c">III/c</SelectItem>
                    <SelectItem value="IV/a">IV/a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">TMT Golongan *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tmtGolongan ? format(tmtGolongan, "dd/MM/yyyy") : "dd/mm/yyyy"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={tmtGolongan}
                      onSelect={setTmtGolongan}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium">Jabatan *</label>
                <Input value={jabatan} onChange={(e) => setJabatan(e.target.value)} placeholder="Jabatan saat ini" />
              </div>
              <div>
                <label className="text-sm font-medium">Jenis Jabatan *</label>
                <Select onValueChange={setJenisJabatan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Struktural">Struktural</SelectItem>
                    <SelectItem value="Fungsional">Fungsional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Pendidikan</label>
                <Select onValueChange={setPendidikan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan terakhir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMA">SMA</SelectItem>
                    <SelectItem value="S1">S1</SelectItem>
                    <SelectItem value="S2">S2</SelectItem>
                    <SelectItem value="S3">S3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tahun Lulus</label>
                <Input value={tahunLulus} onChange={(e) => setTahunLulus(e.target.value)} placeholder="Tahun lulus pendidikan terakhir" />
              </div>
              <div>
                <label className="text-sm font-medium">Alamat</label>
                <Input value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Alamat lengkap" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit}>Simpan & Lanjutkan</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
