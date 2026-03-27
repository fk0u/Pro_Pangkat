"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import {
  Home,
  Calendar,
  FileText,
  Mail,
  User,
  Menu,
  Search,
  X,
  Users,
  Shield,
  Settings,
  BarChart3,
  Bell,
  FolderOpen,
  School,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardSidebarProps {
  userType: "pegawai" | "operator" | "admin" | "operator-sekolah"
}

export function DashboardSidebar({ userType }: DashboardSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  // Color schemes based on user type
  const getColorScheme = () => {
    switch (userType) {
      case "admin":
        return {
          primary: "red",
          bg: "bg-red-500",
          bgDark: "dark:bg-red-400",
          text: "text-red-500",
          textDark: "dark:text-red-400",
          hover: "hover:bg-red-100",
          hoverDark: "dark:hover:bg-red-900/20",
          active: "bg-red-500",
          gradient: "from-red-500 to-red-600"
        }
      case "operator":
        return {
          primary: "green",
          bg: "bg-green-500",
          bgDark: "dark:bg-green-400", 
          text: "text-green-500",
          textDark: "dark:text-green-400",
          hover: "hover:bg-green-100",
          hoverDark: "dark:hover:bg-green-900/20",
          active: "bg-green-500",
          gradient: "from-green-500 to-green-600"
        }
      case "operator-sekolah":
        return {
          primary: "purple",
          bg: "bg-purple-500",
          bgDark: "dark:bg-purple-400",
          text: "text-purple-500", 
          textDark: "dark:text-purple-400",
          hover: "hover:bg-purple-100",
          hoverDark: "dark:hover:bg-purple-900/20",
          active: "bg-purple-500",
          gradient: "from-purple-500 to-purple-600"
        }
      default: // pegawai
        return {
          primary: "sky",
          bg: "bg-sky-500",
          bgDark: "dark:bg-sky-400",
          text: "text-sky-500",
          textDark: "dark:text-sky-400", 
          hover: "hover:bg-sky-100",
          hoverDark: "dark:hover:bg-sky-900/20",
          active: "bg-sky-500",
          gradient: "from-sky-500 to-sky-600"
        }
    }
  }

  const colorScheme = getColorScheme()

  const getMenuItems = () => {
    switch (userType) {
      case "admin":
        return [
          { title: "Dashboard", url: "/admin/dashboard", icon: Home },
          { title: "Manajemen Pengguna", url: "/admin/users", icon: Users },
          { title: "Role & Hak Akses", url: "/admin/roles", icon: Shield },
          { title: "Jadwal", url: "/admin/timeline", icon: Calendar },
          { title: "Kelola Usulan", url: "/admin/kelola-usulan", icon: FolderOpen },
          { title: "Laporan & Export", url: "/admin/reports", icon: BarChart3 },
          { title: "Notifikasi Global", url: "/admin/notifications", icon: Bell },
          { title: "Pengaturan Sistem", url: "/admin/settings", icon: Settings },
        ]
      case "operator":
        return [
          { title: "Dashboard", url: "/operator/dashboard", icon: Home },
          { title: "Jadwal", url: "/operator/timeline", icon: Calendar },
          { title: "Inbox Usulan", url: "/operator/inbox", icon: Mail },
          { title: "Unit Kerja", url: "/operator/unit-kerja", icon: School },
          { title: "List Pegawai", url: "/operator/pegawai", icon: Users },
          { title: "Laporan & Export", url: "/operator/reports", icon: BarChart3 },
        ]
      case "operator-sekolah":
        return [
          { title: "Dashboard", url: "/operator-sekolah/dashboard", icon: Home },
          { title: "Manajemen Pegawai", url: "/operator-sekolah/pegawai", icon: Users },
          { title: "Usulan Kenaikan", url: "/operator-sekolah/usulan", icon: FileText },
          { title: "Timeline", url: "/operator-sekolah/timeline", icon: Calendar },
          { title: "Laporan", url: "/operator-sekolah/laporan", icon: BarChart3 },
          { title: "Profil", url: "/operator-sekolah/profil", icon: User },
        ]
      default:
        return [
          { title: "Dashboard", url: "/pegawai/dashboard", icon: Home },
          { title: "Timeline", url: "/pegawai/timeline", icon: Calendar },
          { title: "Input Usulan", url: "/pegawai/input-usulan", icon: FileText },
          { title: "Riwayat Usulan", url: "/pegawai/riwayat-dokumen", icon: Mail },
          { title: "Profil", url: "/pegawai/profil", icon: User },
        ]
    }
  }

  const menuItems = getMenuItems()

  const sidebarVariants = {
    collapsed: {
      width: "7rem",
      transition: { duration: 0.3, ease: "easeInOut" as const },
    },
    expanded: {
      width: "20rem", 
      transition: { duration: 0.3, ease: "easeInOut" as const },
    },
  }

  const contentVariants = {
    collapsed: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 },
    },
    expanded: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, delay: 0.1 },
    },
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
        className="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 shadow-xl z-50 overflow-hidden border-r border-gray-200 dark:border-gray-700"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                {isExpanded ? (
                  <motion.div
                    key="expanded-header"
                    variants={contentVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="flex-1"
                  >
                    <h2 className={`text-2xl font-extrabold ${colorScheme.text} ${colorScheme.textDark} mb-1`}>ProPangkat</h2>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Dashboard{" "}
                      {userType === "pegawai"
                        ? "Pegawai"
                        : userType === "operator"
                          ? "Operator"
                          : userType === "operator-sekolah"
                            ? "Operator Sekolah"
                            : "Administrator"}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="collapsed-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex justify-center"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-gray-700 shadow-sm">
                      <Image 
                        src="https://kaltimprov.go.id/images/logofavicon.png" 
                        alt="Logo Kaltim"
                        width={32}
                        height={32}
                        style={{ width: 'auto', height: 'auto' }}
                        className="object-contain"
                        unoptimized
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <span className={`${colorScheme.text} ${colorScheme.textDark} font-bold text-lg hidden`}>P</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>

            {/* Search Bar - Only when expanded */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="mt-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari menu..."
                      className="pl-10 rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.url

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link href={item.url}>
                    <div
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? `${colorScheme.active} text-white shadow-lg`
                          : `${colorScheme.hover} ${colorScheme.hoverDark} text-gray-700 dark:text-gray-300`
                      }`}
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : ""}`} />

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            variants={contentVariants}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            className={`font-medium text-sm ${isActive ? "text-white" : ""}`}
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* Footer */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="p-4 border-t border-gray-200 dark:border-gray-700"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                  © 2025 Dinas Pendidikan dan Kebudayaan Prov. Kaltim Kalimantan Timur
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}
