"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Shield, Bell, LayoutList, Save } from "lucide-react";
import { TwoFactorSetup } from "@/components/two-factor-setup";

export default function OperatorSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <DashboardLayout userType="operator">
      <div className="container mx-auto p-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan Operator</h1>
          <p className="text-muted-foreground mt-2">
            Kelola preferensi akun, tampilan, dan keamanan untuk peran Operator BKD.
          </p>
        </motion.div>

        <Tabs defaultValue="tampilan" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted">
            <TabsTrigger value="tampilan" className="py-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Tampilan</span>
            </TabsTrigger>
            <TabsTrigger value="verifikasi" className="py-3 flex items-center gap-2">
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Pref. Verifikasi</span>
            </TabsTrigger>
            <TabsTrigger value="notifikasi" className="py-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifikasi</span>
            </TabsTrigger>
            <TabsTrigger value="keamanan" className="py-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Keamanan</span>
            </TabsTrigger>
          </TabsList>

          {/* Tampilan */}
          <TabsContent value="tampilan">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Preferensi Tipe Tampilan</CardTitle>
                  <CardDescription>Sesuaikan tema dan bahasa aplikasi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Tema Gelap</Label>
                      <p className="text-sm text-muted-foreground">Aktifkan tampilan mode gelap.</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>Bahasa</Label>
                    <Select defaultValue="id">
                      <SelectTrigger className="w-full sm:w-[300px]">
                        <SelectValue placeholder="Pilih Bahasa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id">Bahasa Indonesia</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Verifikasi */}
          <TabsContent value="verifikasi">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Preferensi Verifikasi</CardTitle>
                  <CardDescription>Atur cara Anda memverifikasi usulan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Tampilkan Usulan Otomatis</Label>
                      <p className="text-sm text-muted-foreground">
                        Buka dokumen usulan berikutnya secara otomatis setelah selesai memverifikasi.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>Batas Item per Halaman</Label>
                    <Select defaultValue="20">
                      <SelectTrigger className="w-full sm:w-[300px]">
                        <SelectValue placeholder="Pilih batas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 Item</SelectItem>
                        <SelectItem value="20">20 Item</SelectItem>
                        <SelectItem value="50">50 Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifikasi */}
          <TabsContent value="notifikasi">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Notifikasi</CardTitle>
                  <CardDescription>Pilih notifikasi yang ingin Anda terima.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notifikasi Usulan Masuk</Label>
                      <p className="text-sm text-muted-foreground">Kirim peringatan saat ada usulan baru dari OPD/Sekolah.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notifikasi Pesan Baru</Label>
                      <p className="text-sm text-muted-foreground">Kirim peringatan saat ada pesan atau catatan baru.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Keamanan */}
          <TabsContent value="keamanan">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Password */}
              <Card>
                <CardHeader>
                  <CardTitle>Ubah Password</CardTitle>
                  <CardDescription>Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-pass">Password Saat Ini</Label>
                    <Input id="current-pass" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-pass">Password Baru</Label>
                    <Input id="new-pass" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pass">Konfirmasi Password Baru</Label>
                    <Input id="confirm-pass" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Perbarui Password</Button>
                </CardFooter>
              </Card>

              {/* 2FA */}
              <Card>
                <CardHeader>
                  <CardTitle>Dua Faktor Autentikasi (2FA)</CardTitle>
                  <CardDescription>Tambahkan lapisan keamanan ekstra ke akun Anda.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TwoFactorSetup />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}