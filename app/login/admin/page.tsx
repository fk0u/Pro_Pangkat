"use client"

import { motion } from "framer-motion"
import { CompactLoginForm } from "@/components/compact-login-form"
import { LoginFormSkeleton } from "@/components/loading-skeleton"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-300 via-purple-400 to-indigo-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="absolute top-4 left-4 z-20"
        >
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
        </motion.div>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="absolute top-4 right-4 z-20"
        >
          <ThemeToggle />
        </motion.div>

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute -top-32 -right-32 w-64 h-64 bg-white dark:bg-gray-200 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-200 dark:bg-indigo-800 rounded-full blur-3xl"
          />
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10"
        >
          {isLoading ? <LoginFormSkeleton /> : <CompactLoginForm userType="admin" redirectTo="/admin/dashboard" />}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="absolute bottom-5 left-300 transform -translate-x-1/2 z-10"
        >
          <p className="text-sky-100 dark:text-gray-300 justify-center text-xs text-center font-medium">
            © 2025 Dinas Pendidikan dan Kebudayaan Prov. Kaltim Kalimantan Timur
          </p>
        </motion.footer>
      </div>
      <Toaster />
    </>
  )
}
