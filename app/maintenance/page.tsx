"use client"

import { Clock, Wrench, Home, MessageCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function MaintenancePage() {
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Simulate progress update
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1))
    }, 300)

    return () => clearInterval(interval)
  }, [])

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Mock maintenance schedule
  const estimatedCompletion = new Date()
  estimatedCompletion.setHours(estimatedCompletion.getHours() + 2)

  const maintenanceItems = [
    { task: "Update sistem keamanan", status: "completed" },
    { task: "Upgrade database", status: "in-progress" },
    { task: "Optimalisasi performa", status: "pending" },
    { task: "Testing sistem", status: "pending" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <Wrench className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sistem Sedang Maintenance
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Kami sedang melakukan pemeliharaan sistem untuk meningkatkan kualitas layanan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <Alert className="border-blue-200 dark:border-blue-800">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="flex justify-between items-center">
                <span><strong>Status:</strong> Maintenance aktif sejak 08:00 WIB</span>
                <span className="text-sm">{currentTime.toLocaleTimeString('id-ID')}</span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Progress Maintenance</h4>
              <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estimasi selesai: {estimatedCompletion.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} WIB
            </p>
          </div>

          {/* Maintenance Tasks */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Yang sedang dikerjakan:</h4>
            <div className="space-y-2">
              {maintenanceItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0">
                    {item.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : item.status === 'in-progress' ? (
                      <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    item.status === 'completed' 
                      ? 'text-green-700 dark:text-green-300 line-through' 
                      : item.status === 'in-progress'
                      ? 'text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What's being improved */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Peningkatan yang dilakukan:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Peningkatan keamanan sistem dan enkripsi data
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Optimalisasi kecepatan loading halaman
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Perbaikan bug dan stabilitas sistem
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Update fitur baru untuk pengalaman yang lebih baik
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              Cek Status Terbaru
            </Button>
            
            <div className="flex space-x-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Beranda
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/contact">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Hubungi Kami
                </Link>
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Maintenance Window:</strong> 08:00 - 12:00 WIB
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Terima kasih atas kesabaran Anda. Kami akan memberikan update berkala tentang progress maintenance.
            </p>
            <div className="flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span>📧 Email: support@example.com</span>
              <span>📱 WhatsApp: +62-xxx-xxxx-xxxx</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
