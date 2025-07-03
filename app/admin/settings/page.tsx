"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Settings, Info } from "lucide-react"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const [appName, setAppName] = useState("ProPangkat")
  const [year, setYear] = useState("2025")
  const [language, setLanguage] = useState("id")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [theme, setTheme] = useState("light")
  const [adminName, setAdminName] = useState("Admin BKD")
  const [adminEmail, setAdminEmail] = useState("admin@propangkat.go.id")
  const [adminPassword, setAdminPassword] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setLogoFile(e.target.files[0])
    }
  }

  const handleSaveProfile = () => {
    // Placeholder: Kirim ke backend dengan fetch/axios nanti
    alert(`Profil disimpan:\nNama: ${adminName}\nEmail: ${adminEmail}\nPassword: ${adminPassword}`)
  }

  const handleSavePreference = () => {
    // Placeholder: Kirim ke backend dengan fetch/axios nanti
    alert(`Preferensi disimpan:\nNotifikasi: ${notifEnabled ? "Aktif" : "Nonaktif"}\nTema: ${theme}`)
  }

  const handleSaveSystem = () => {
    // Placeholder: Kirim ke backend dengan fetch/axios nanti
    alert(`Pengaturan sistem disimpan:\nNama Aplikasi: ${appName}\nTahun: ${year}\nBahasa: ${language}\nLogo: ${logoFile ? logoFile.name : "Tidak diubah"}`)
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Settings className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Pengaturan Sistem</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk melihat pengaturan sistem web ProPangkat.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profil Admin */}
          <Card>
            <CardHeader>
              <CardTitle>Profil Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nama</Label>
                <Input
                  placeholder="Masukkan nama lengkap"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  placeholder="Masukkan email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Password Baru</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveProfile}>Simpan Perubahan</Button>
            </CardContent>
          </Card>

          {/* Preferensi */}
          <Card>
            <CardHeader>
              <CardTitle>Preferensi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Notifikasi Email</Label>
                <Switch checked={notifEnabled} onCheckedChange={setNotifEnabled} />
              </div>
              <div>
                <Label>Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Terang</SelectItem>
                    <SelectItem value="dark">Gelap</SelectItem>
                    <SelectItem value="system">Ikuti Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSavePreference}>Simpan Preferensi</Button>
            </CardContent>
          </Card>

          {/* Pengaturan Sistem Web */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Pengaturan Sistem Web</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nama Aplikasi</Label>
                <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
              </div>
              <div>
                <Label>Tahun Aktif</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div>
                <Label>Logo Aplikasi</Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
                {logoFile && <p className="text-sm text-muted-foreground mt-1">File dipilih: {logoFile.name}</p>}
              </div>
              <div>
                <Label>Bahasa Default</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Bahasa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Indonesia</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveSystem}>Simpan Pengaturan Sistem</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
