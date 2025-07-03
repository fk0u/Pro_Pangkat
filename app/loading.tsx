"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Users, Settings } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Animated Logo */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 animate-pulse">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            {/* Loading Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Memuat Halaman
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mohon tunggu sebentar...
              </p>
            </div>

            {/* Loading Animation */}
            <div className="flex justify-center space-x-1">
              <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
            </div>

            {/* Feature Icons */}
            <div className="flex justify-center space-x-6 opacity-50">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Pegawai</span>
              </div>
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Dokumen</span>
              </div>
              <div className="text-center">
                <Settings className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Sistem</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
