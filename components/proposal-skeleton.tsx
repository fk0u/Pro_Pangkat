"use client"

import { Card, CardContent } from "@/components/ui/card"

export function ProposalListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44"></div>
                </div>
              </div>
              
              {/* Document Stats */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function EmptyProposalState({ 
  searchTerm, 
  statusFilter, 
  onCreateNew 
}: { 
  searchTerm: string
  statusFilter: string
  onCreateNew: () => void 
}) {
  const isFiltered = searchTerm || statusFilter !== "all"
  
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="mx-auto mb-6 h-24 w-24 text-gray-400">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="h-full w-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {isFiltered 
            ? "Tidak ada usulan yang sesuai" 
            : "Belum ada riwayat usulan"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {isFiltered 
            ? "Coba ubah filter pencarian atau buat usulan baru untuk mulai mengajukan kenaikan pangkat." 
            : "Anda belum pernah mengajukan usulan kenaikan pangkat. Mulai dengan membuat usulan pertama Anda."}
        </p>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {isFiltered ? "Buat Usulan Baru" : "Buat Usulan Pertama"}
        </button>
      </CardContent>
    </Card>
  )
}
