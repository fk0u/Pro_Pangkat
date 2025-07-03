"use client"

import { Server, RefreshCw, Home, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function ServerError() {
  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <Server className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            500
          </CardTitle>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Server Sedang Bermasalah
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Terjadi kesalahan pada server kami. Tim teknis sedang bekerja untuk memperbaikinya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status:</strong> Server sedang mengalami gangguan teknis.
              <br />
              <strong>Estimasi:</strong> Masalah akan diselesaikan dalam 15-30 menit.
            </AlertDescription>
          </Alert>

          {/* What happened */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Apa yang terjadi?</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Server mengalami beban tinggi atau gangguan teknis
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Database mungkin sedang dalam maintenance
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Terjadi error pada aplikasi yang perlu diperbaiki
              </li>
            </ul>
          </div>

          {/* What to do */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Apa yang bisa Anda lakukan?</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Tunggu beberapa menit dan coba lagi
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Refresh halaman untuk mencoba koneksi baru
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Hubungi administrator jika masalah berlanjut
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button onClick={handleReload} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Halaman
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Error Code: 500 - Internal Server Error
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Jika Anda sering mengalami masalah ini, silakan{" "}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                hubungi tim support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
