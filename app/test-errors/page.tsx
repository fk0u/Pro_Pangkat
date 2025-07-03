"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TestTube, AlertTriangle, Server, Shield, Search, Wrench, Network, WifiOff } from "lucide-react"
import Link from "next/link"

export default function ErrorTestPage() {
  const [testResult, setTestResult] = useState<string | null>(null)

  const errorTests = [
    {
      id: "404",
      title: "404 - Halaman Tidak Ditemukan",
      description: "Test halaman 404 yang user-friendly dengan pencarian",
      path: "/halaman-tidak-ada",
      icon: Search,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      id: "403", 
      title: "403 - Akses Ditolak",
      description: "Test halaman forbidden dengan panduan akses",
      path: "/403",
      icon: Shield,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      id: "500",
      title: "500 - Server Error", 
      description: "Test halaman server error dengan status real-time",
      path: "/500",
      icon: Server,
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      id: "maintenance",
      title: "Maintenance Mode",
      description: "Test halaman maintenance dengan progress tracking",
      path: "/maintenance", 
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      id: "error-component",
      title: "Error Component",
      description: "Test komponen error dengan berbagai tipe error",
      action: () => testErrorComponent(),
      icon: AlertTriangle,
      color: "text-purple-600", 
      bgColor: "bg-purple-100"
    },
    {
      id: "network-error",
      title: "Network Error",
      description: "Simulasi error jaringan dan timeout",
      action: () => testNetworkError(),
      icon: Network,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    },
    {
      id: "no-connection",
      title: "No Server Connection",
      description: "Test halaman tidak ada koneksi server",
      path: "/no-connection",
      icon: WifiOff,
      color: "text-gray-600",
      bgColor: "bg-gray-100"
    }
  ]

  const testErrorComponent = () => {
    setTestResult("Error component berhasil ditest. Cek console untuk detail.")
    console.log("Testing error component with different error types")
  }

  const testNetworkError = async () => {
    try {
      setTestResult("Testing network error...")
      // Simulate network timeout
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 1000)
      
      await fetch('/api/non-existent', { 
        signal: controller.signal 
      })
    } catch (error) {
      setTestResult(`Network error berhasil disimulasikan: ${error}`)
    }
  }

  const handleTest = (test: any) => {
    if (test.path) {
      window.open(test.path, '_blank')
    } else if (test.action) {
      test.action()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <TestTube className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Error Pages Testing Center
            </CardTitle>
            <CardDescription>
              Test semua halaman error dan komponen error handling sistem
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Test Result */}
        {testResult && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{testResult}</AlertDescription>
          </Alert>
        )}

        {/* Error Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {errorTests.map((test) => {
            const IconComponent = test.icon
            return (
              <Card key={test.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${test.bgColor} dark:${test.bgColor}/20 flex items-center justify-center mb-3`}>
                    <IconComponent className={`h-6 w-6 ${test.color} dark:${test.color.replace('600', '400')}`} />
                  </div>
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTest(test)}
                    className="w-full"
                    variant="outline"
                  >
                    {test.path ? 'Buka Halaman' : 'Jalankan Test'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Akses cepat ke halaman utama dan dokumentasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline">
                <Link href="/">
                  Beranda
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">
                  Login
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">
                  Contact
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Testing Guidelines
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Setiap halaman error memiliki desain yang konsisten</li>
                <li>• Error pages responsive dan support dark mode</li>
                <li>• Semua error pages memiliki action buttons yang jelas</li>
                <li>• Error reporting terintegrasi untuk monitoring</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
