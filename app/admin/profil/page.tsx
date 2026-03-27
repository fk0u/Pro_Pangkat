"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { User, Mail, Phone, Shield, Save, Bell, Camera } from "lucide-react";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    noHp: "",
    alertsEnabled: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/admin/profile");
      if (!res.ok) throw new Error("Gagal mengambil profil");
      const data = await res.json();
      setProfile(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        noHp: data.noHp || "",
        alertsEnabled: true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {};
      if (formData.name !== profile.name) payload.name = formData.name;
      if (formData.email !== profile.email) payload.email = formData.email;
      if (formData.noHp !== profile.noHp) payload.noHp = formData.noHp;

      if (Object.keys(payload).length === 0 && formData.alertsEnabled === true) {
         setSuccess("Profil berhasil disimpan (tidak ada perubahan data utama)");
         setSaving(false);
         return;
      }

      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Gagal menyimpan profil");
      }

      const updatedData = await res.json();
      setProfile(updatedData);
      setSuccess("Profil berhasil diperbarui!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profil Administrator</h1>
          <p className="text-sm text-gray-500">Kelola informasi profil dan preferensi akun Anda.</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        ) : profile ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Kolom Kiri: Info Singkat & Avatar */}
            <div className="flex flex-col gap-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700">
                    {profile.profilePictureUrl ? (
                      <img 
                        src={profile.profilePictureUrl} 
                        alt="Avatar" 
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      profile.name?.charAt(0).toUpperCase() || "A"
                    )}
                    <button type="button" className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{profile.name}</h2>
                    <p className="text-sm font-medium text-emerald-600">Administrator System</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{profile.noHp || "Belum diatur"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span>ID: {profile.id?.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Form Edit */}
            <div className="md:col-span-2">
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Informasi Pribadi</h3>
                  <p className="text-sm text-gray-500">Perbarui detail kontak dan informasi profil Anda.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                  {error && (
                    <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-6 rounded-md bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200">
                      {success}
                    </div>
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Nama Lengkap
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="noHp" className="text-sm font-medium text-gray-700">
                        Nomor Handphone
                      </label>
                      <input
                        id="noHp"
                        name="noHp"
                        type="tel"
                        value={formData.noHp}
                        onChange={handleChange}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Contoh: 08123456789"
                      />
                    </div>
                  </div>

                  <div className="mt-8 border-t border-gray-200 pt-8">
                    <h4 className="mb-4 text-sm font-medium text-gray-900">Preferensi Sistem</h4>
                    
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Bell className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Notifikasi Sistem</p>
                          <p className="text-xs text-gray-500">Terima notifikasi peringatan dari sistem.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          name="alertsEnabled"
                          className="peer sr-only"
                          checked={formData.alertsEnabled}
                          onChange={handleChange}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-emerald-800"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-600 shadow-sm">
            <p className="font-medium">Gagal memuat profil</p>
            <button 
              onClick={fetchProfile}
              className="mt-2 text-sm font-semibold hover:underline"
              type="button"
            >
              Coba lagi
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}