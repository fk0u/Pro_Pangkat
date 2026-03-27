"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, Moon, Save, Building } from "lucide-react";

export default function OperatorSekolahSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    theme: "system",
    language: "id",
    altEmail: "",
    phoneNumber: "",
    notifyStatus: true,
    notifyCorrection: true,
  });

  const handleSave = async (section: string) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout userType="operator-sekolah">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Preferensi Tampilan */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Preferensi Tampilan
                </CardTitle>
                <CardDescription>Atur tema dan bahasa aplikasi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema Aplikasi</Label>
                  <Select 
                    value={settings.theme} 
                    onValueChange={(val) => setSettings({ ...settings, theme: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Terang</SelectItem>
                      <SelectItem value="dark">Gelap</SelectItem>
                      <SelectItem value="system">Sistem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bahasa</Label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(val) => setSettings({ ...settings, language: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bahasa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button onClick={() => handleSave('appearance')} disabled={isLoading} className="w-full">
                  <Save className="mr-2 h-4 w-4" /> Simpan Tampilan
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Profil Sekolah / Kontak Darurat */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Profil & Kontak Darurat
                </CardTitle>
                <CardDescription>Email alternatif dan telepon sekolah.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="altEmail">Email Sekolah Alternatif</Label>
                  <Input 
                    id="altEmail" 
                    type="email" 
                    placeholder="Contoh: info@sekolah.sch.id"
                    value={settings.altEmail}
                    onChange={(e) => setSettings({ ...settings, altEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">No Telepon</Label>
                  <Input 
                    id="phoneNumber" 
                    type="text" 
                    placeholder="Contoh: 021-1234567"
                    value={settings.phoneNumber}
                    onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button onClick={() => handleSave('profile')} disabled={isLoading} className="w-full">
                  <Save className="mr-2 h-4 w-4" /> Simpan Profil
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Pengaturan Notifikasi */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Pengaturan Notifikasi
                </CardTitle>
                <CardDescription>Atur preferensi pemberitahuan Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">Status Dokumen/Usulan</Label>
                    <p className="text-sm text-muted-foreground">Pemberitahuan perubahan status.</p>
                  </div>
                  <Switch 
                    checked={settings.notifyStatus}
                    onCheckedChange={(val) => setSettings({ ...settings, notifyStatus: val })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">Pemberitahuan Perbaikan</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi saat dokumen perlu diperbaiki.</p>
                  </div>
                  <Switch 
                    checked={settings.notifyCorrection}
                    onCheckedChange={(val) => setSettings({ ...settings, notifyCorrection: val })}
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button onClick={() => handleSave('notifications')} disabled={isLoading} className="w-full">
                  <Save className="mr-2 h-4 w-4" /> Simpan Notifikasi
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Keamanan */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Keamanan
                </CardTitle>
                <CardDescription>Ubah kata sandi akun Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Sandi Saat Ini</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Sandi Baru</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Sandi Baru</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="default" onClick={() => handleSave('security')} disabled={isLoading}>
                  <Shield className="mr-2 h-4 w-4" /> Ubah Password
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}