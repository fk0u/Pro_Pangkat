"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DocumentViewerPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const docId = searchParams.get('id')
  const viewUrl = docId ? `/api/documents/${docId}/preview` : null
  
  useEffect(() => {
    if (!docId) {
      setError('Document ID tidak ditemukan')
      setLoading(false)
    } else {
      // Just to give a moment for PDF to load
      const timer = setTimeout(() => {
        setLoading(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [docId])
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <h1 className="text-xl font-semibold mb-4 dark:text-white">Terjadi Kesalahan</h1>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 dark:text-white" />
          <p className="text-gray-600 dark:text-gray-300">Memuat dokumen...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {viewUrl && (
        <object
          data={viewUrl + "?t=" + new Date().getTime()}  // Add timestamp to prevent caching
          type="application/pdf"
          className="w-full h-screen"
        >
          <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
              <h1 className="text-xl font-semibold mb-4 dark:text-white">PDF Tidak Dapat Ditampilkan</h1>
              <p className="mb-4 dark:text-gray-300">Browser Anda tidak dapat menampilkan dokumen PDF secara langsung.</p>
              <a 
                href={viewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
              >
                Buka PDF di Tab Baru
              </a>
            </div>
          </div>
        </object>
      )}
    </div>
  )
}
