"use client"

import { Shield, Home, ArrowLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ForbiddenPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            403
          </CardTitle>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Akses Ditolak
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Access Alert */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Alasan:</strong> Halaman ini memerlukan izin khusus atau Anda perlu login dengan akun yang tepat.
            </AlertDescription>
          </Alert>

          {/* Why this happened */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Mengapa ini terjadi?</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Anda belum login atau sesi Anda telah berakhir
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Akun Anda tidak memiliki akses ke halaman ini
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Halaman khusus untuk role/jabatan tertentu
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                IP address Anda tidak diizinkan
              </li>
            </ul>
          </div>

          {/* What to do */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Apa yang bisa Anda lakukan?</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Login dengan akun yang memiliki izin akses
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Hubungi administrator untuk mendapatkan akses
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Pastikan Anda menggunakan akun yang benar
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Kembali ke halaman yang diizinkan
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">
                <Lock className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
            <div className="flex space-x-3">
              <Button onClick={handleGoBack} variant="outline" className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Beranda
                </Link>
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Error Code: 403 - Forbidden Access
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Jika Anda yakin seharusnya memiliki akses, silakan{" "}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                hubungi administrator
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
