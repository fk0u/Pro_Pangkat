"use client"

import { useEffect, useState } from "react"
import { WifiOff, RefreshCw, Home, Settings, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function NoConnectionPage() {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryProgress, setRetryProgress] = useState(0)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null)

  // Simulate connection retry progress
  useEffect(() => {
    if (isRetrying) {
      const interval = setInterval(() => {
        setRetryProgress(prev => {
          if (prev >= 100) {
            setIsRetrying(false)
            setConnectionAttempts(prev => prev + 1)
            setLastAttempt(new Date())
            return 0
          }
          return prev + 10
        })
      }, 200)

      return () => clearInterval(interval)
    }
  }, [isRetrying])

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryProgress(0)
    
    // Try to reconnect
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        // Connection successful, reload the page
        window.location.reload()
      }
    } catch (error) {
      // Connection failed, will show in the UI
      console.log('Connection attempt failed:', error)
    }
  }

  const handleRefreshPage = () => {
    window.location.reload()
  }

  const troubleshootingSteps = [
    { step: "Periksa koneksi internet Anda", checked: false },
    { step: "Pastikan WiFi atau data seluler aktif", checked: false },
    { step: "Coba refresh halaman", checked: connectionAttempts > 0 },
    { step: "Restart browser Anda", checked: false },
    { step: "Hubungi administrator sistem", checked: false },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <WifiOff className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Tidak Ada Koneksi Server
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Aplikasi tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span><strong>Status:</strong> Terputus dari server</span>
                {lastAttempt && (
                  <span className="text-sm">
                    Percobaan terakhir: {lastAttempt.toLocaleTimeString('id-ID')}
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Retry Progress */}
          {isRetrying && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Mencoba menghubungkan...</span>
                <span className="text-gray-600 dark:text-gray-400">{retryProgress}%</span>
              </div>
              <Progress value={retryProgress} className="w-full" />
            </div>
          )}

          {/* Connection Attempts */}
          {connectionAttempts > 0 && (
            <div className="text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Percobaan koneksi: {connectionAttempts} kali
              </span>
            </div>
          )}

          {/* What might be wrong */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Kemungkinan penyebab:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Koneksi internet Anda terputus atau lemah
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Server sedang mengalami gangguan
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Firewall atau proxy memblokir akses
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                DNS tidak dapat menemukan server
              </li>
            </ul>
          </div>

          {/* Troubleshooting Steps */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Langkah-langkah pemecahan masalah:</h4>
            <div className="space-y-2">
              {troubleshootingSteps.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0">
                    {item.checked ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    item.checked 
                      ? 'text-green-700 dark:text-green-300 line-through' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Menghubungkan...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Coba Hubungkan Lagi
                </>
              )}
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleRefreshPage}
                variant="outline" 
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Halaman
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Beranda
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/contact">
                  <Settings className="mr-2 h-4 w-4" />
                  Bantuan
                </Link>
              </Button>
            </div>
          </div>

          {/* Network Info */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Tips:</strong> Pastikan Anda terhubung ke internet dan coba akses website lain untuk memastikan koneksi Anda stabil.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>💡 Cek status koneksi: Settings → Network</span>
              <span className="hidden sm:inline">•</span>
              <span>📞 Hubungi ISP jika masalah berlanjut</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
