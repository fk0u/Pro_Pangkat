"use client"

import { motion } from "framer-motion"
import { LoginSelection } from "@/components/login-selection"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePageClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-sky-400 to-teal-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="absolute top-4 right-4 z-20"
      >
        <ThemeToggle />
      </motion.div>

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
          className="absolute -bottom-32 -left-32 w-64 h-64 bg-teal-200 dark:bg-teal-800 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <LoginSelection />
      </motion.div>

      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full px-4"
      >
        <p className="text-sky-50/95 dark:text-gray-300 text-xs text-center font-semibold tracking-wide drop-shadow-sm">
          ProPangkat - Dinas Pendidikan dan Kebudayaan Provinsi Kalimantan Timur
        </p>
      </motion.footer>
    </div>
  )
}
