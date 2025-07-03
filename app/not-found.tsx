"use client"

import { Search, Home, ArrowLeft, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Redirect to search or specific pages based on query
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const popularPages = [
    { name: "Dashboard Pegawai", href: "/pegawai/dashboard", icon: "📊" },
    { name: "Input Usulan", href: "/pegawai/input-usulan", icon: "📝" },
    { name: "Riwayat Dokumen", href: "/pegawai/riwayat-dokumen", icon: "📋" },
    { name: "Timeline", href: "/pegawai/timeline", icon: "⏰" },
    { name: "Profil", href: "/pegawai/profil", icon: "👤" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Main 404 Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <FileQuestion className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              404
            </CardTitle>
            <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Halaman Tidak Ditemukan
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
              Maaf, halaman yang Anda cari tidak dapat ditemukan atau mungkin telah dipindahkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari halaman yang Anda butuhkan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={!searchQuery.trim()}>
                Cari
              </Button>
            </form>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.back()} variant="outline" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button asChild className="flex items-center">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Ke Beranda
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-center">
              Halaman Populer
            </CardTitle>
            <CardDescription className="text-center">
              Mungkin Anda mencari salah satu halaman ini?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {popularPages.map((page, index) => (
                <Link
                  key={index}
                  href={page.href}
                  className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">
                    {page.icon}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {page.name}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Butuh Bantuan?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Jika Anda yakin halaman ini seharusnya ada, silakan hubungi administrator sistem atau laporkan masalah ini.
              </p>
              <div className="flex justify-center gap-3 text-sm">
                <Button variant="link" size="sm" asChild>
                  <Link href="/help">Pusat Bantuan</Link>
                </Button>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <Button variant="link" size="sm" asChild>
                  <Link href="/contact">Hubungi Admin</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
