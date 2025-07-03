"use client"

import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

export function LoginFormSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[30px] p-6 shadow-2xl border border-white/20 dark:border-gray-700/20 w-full max-w-md mx-auto"
    >
      {/* Header Skeleton */}
      <div className="text-center mb-6">
        <Skeleton className="h-6 w-48 mx-auto mb-3" />
        <Skeleton className="h-12 w-64 mx-auto mb-3" />
        <Skeleton className="h-5 w-56 mx-auto mb-1" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>

      {/* Form Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-12 w-full rounded-full" />

        {/* CAPTCHA Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-36 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
        </div>

        {/* Checkbox */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Button */}
        <Skeleton className="h-12 w-full rounded-full" />

        {/* Link */}
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>

      {/* Demo Info */}
      <Skeleton className="h-10 w-full rounded-xl mt-4" />
    </motion.div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Skeleton */}
      <div className="fixed left-0 top-0 w-28 h-screen bg-white dark:bg-gray-800 shadow-xl rounded-br-[4.5rem]">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-8 mx-auto rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="ml-28">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-64 rounded-full" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Skeleton className="h-8 w-96 mb-2" />
          <Skeleton className="h-5 w-64 mb-4" />
          <Skeleton className="h-16 w-full rounded-lg mb-6" />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>

          {/* Content Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>

          <Skeleton className="h-64 w-full rounded-lg mt-6" />
        </div>
      </div>
    </div>
  )
}
