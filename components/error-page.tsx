"use client"

import { AlertTriangle, RefreshCw, Home, Bug, Clock, Wifi, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorPageProps {
  title?: string
  description?: string
  error?: string
  onRetry?: () => void
  showHomeButton?: boolean
  errorType?: 'network' | 'server' | 'timeout' | 'generic'
  suggestions?: string[]
}

export function ErrorPage({
  title = "Terjadi Kesalahan",
  description = "Maaf, terjadi kesalahan saat memuat data. Silakan coba lagi atau hubungi administrator.",
  error,
  onRetry,
  showHomeButton = true,
  errorType = 'generic',
  suggestions = []
}: ErrorPageProps) {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <Wifi className="h-6 w-6 text-red-600" />
      case 'server':
        return <Server className="h-6 w-6 text-red-600" />
      case 'timeout':
        return <Clock className="h-6 w-6 text-red-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-red-600" />
    }
  }

  const getErrorColor = () => {
    switch (errorType) {
      case 'network':
        return 'bg-orange-100'
      case 'server':
        return 'bg-red-100'
      case 'timeout':
        return 'bg-yellow-100'
      default:
        return 'bg-red-100'
    }
  }

  const defaultSuggestions = {
    network: [
      "Periksa koneksi internet Anda",
      "Pastikan WiFi atau data seluler aktif",
      "Coba refresh halaman",
      "Restart router atau modem jika perlu",
      "Hubungi provider internet jika masalah berlanjut"
    ],
    server: [
      "Server sedang mengalami gangguan teknis",
      "Coba lagi dalam beberapa menit",
      "Periksa status server di halaman maintenance",
      "Hubungi administrator jika masalah berlanjut"
    ],
    timeout: [
      "Permintaan membutuhkan waktu terlalu lama",
      "Periksa kecepatan koneksi internet",
      "Coba lagi dengan koneksi yang lebih stabil",
      "Tutup aplikasi lain yang menggunakan internet"
    ],
    generic: [
      "Refresh halaman dan coba lagi",
      "Periksa koneksi internet Anda", 
      "Tunggu beberapa menit dan coba lagi",
      "Hubungi admin jika masalah berlanjut"
    ]
  }

  const currentSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions[errorType]

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${getErrorColor()}`}>
            {getErrorIcon()}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Details */}
          {error && (
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm break-all">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Suggestions */}
          {currentSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Saran untuk mengatasi masalah:</h4>
              <ul className="space-y-1">
                {currentSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <span className="break-words">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            {onRetry && (
              <Button onClick={onRetry} className="w-full" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
            )}
            {showHomeButton && (
              <Button 
                onClick={() => window.location.href = '/pegawai/dashboard'} 
                variant="outline" 
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Dashboard
              </Button>
            )}
          </div>

          {/* Additional Help */}
          <div className="text-center pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Masalah masih berlanjut?
            </p>
            <div className="flex justify-center space-x-4 text-xs">
              <button 
                onClick={() => window.location.reload()} 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Reload Halaman
              </button>
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => window.history.back()} 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Halaman Sebelumnya
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
