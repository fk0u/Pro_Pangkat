"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw, Home, Bug, Send, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [reportDescription, setReportDescription] = useState("")
  const [isReportOpen, setIsReportOpen] = useState(false)

  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error)
    
    // You can integrate with error reporting services here
    // Example: Sentry, LogRocket, Bugsnag, etc.
    
    // Send error to your analytics service
    if (typeof window !== 'undefined') {
      // Example analytics call
      // analytics.track('Application Error', {
      //   message: error.message,
      //   digest: error.digest,
      //   timestamp: new Date().toISOString(),
      //   userAgent: navigator.userAgent,
      //   url: window.location.href
      // })
    }
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const errorDetails = {
    message: error.message,
    digest: error.digest,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Unknown'
  }

  const copyErrorDetails = async () => {
    const details = `Error Details:
Message: ${errorDetails.message}
Digest: ${errorDetails.digest || 'N/A'}
Timestamp: ${errorDetails.timestamp}
URL: ${errorDetails.url}
User Agent: ${errorDetails.userAgent}`

    try {
      await navigator.clipboard.writeText(details)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  const sendErrorReport = async () => {
    try {
      // Simulate sending error report to server
      // In real implementation, you would send this to your error reporting endpoint
      console.log('Sending error report:', {
        ...errorDetails,
        description: reportDescription
      })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setReportSent(true)
      setIsReportOpen(false)
    } catch (err) {
      console.error('Failed to send error report:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Terjadi Kesalahan
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu dan sedang memperbaikinya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Report Message */}
          {reportSent && (
            <Alert className="border-green-200 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Terima kasih! Laporan error Anda telah berhasil dikirim. Tim kami akan segera memperbaikinya.
              </AlertDescription>
            </Alert>
          )}

          {/* Development Error Details */}
          {isDevelopment && error && (
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <strong>Development Mode - Error Details:</strong>
                <br />
                <code className="text-xs break-all">{error.message}</code>
                {error.digest && (
                  <>
                    <br />
                    <strong>Digest:</strong> <code className="text-xs">{error.digest}</code>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* What to do */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Apa yang bisa Anda lakukan?</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Coba refresh halaman ini
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Kembali ke halaman sebelumnya
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Tunggu beberapa menit dan coba lagi
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Laporkan masalah ini kepada kami
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
            
            <div className="flex space-x-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Beranda
                </Link>
              </Button>
              <Button 
                onClick={copyErrorDetails} 
                variant="outline" 
                className="flex-1"
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Disalin
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Salin Detail
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error Report Section */}
          <Collapsible open={isReportOpen} onOpenChange={setIsReportOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <Bug className="mr-2 h-4 w-4" />
                {isReportOpen ? 'Tutup Laporan' : 'Laporkan Masalah'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="p-4 border rounded-lg space-y-4">
                <div>
                  <Label htmlFor="description">Deskripsi masalah (opsional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Jelaskan apa yang Anda lakukan ketika error terjadi..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-2">Detail teknis yang akan dikirim:</p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono space-y-1">
                    <div><strong>Error:</strong> {errorDetails.message}</div>
                    <div><strong>Waktu:</strong> {errorDetails.timestamp}</div>
                    <div><strong>Halaman:</strong> {errorDetails.url}</div>
                    {errorDetails.digest && <div><strong>ID:</strong> {errorDetails.digest}</div>}
                  </div>
                </div>
                
                <Button onClick={sendErrorReport} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Kirim Laporan
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Error ID: {error?.digest || 'Unknown'} • {new Date().toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Jika masalah berlanjut, silakan{" "}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                hubungi support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
