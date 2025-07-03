"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSkeleton } from "@/components/loading-skeleton"
import { Toaster } from "@/components/ui/toaster"
import { ChangePasswordModal } from "@/components/change-password-modal"
import type { SessionData } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface DashboardLayoutProps {
  children?: React.ReactNode
  userType: "pegawai" | "operator" | "admin" | "operator-sekolah"
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session")
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        setSession({ user: data.user, isLoggedIn: true })
        
        // Check role-based access
        const userRole = data.user.role?.toLowerCase()
        const allowedRoles = {
          "pegawai": ["pegawai"],
          "operator": ["operator"],
          "admin": ["admin"],
          "operator-sekolah": ["operator_sekolah"]
        }
        
        if (!allowedRoles[userType]?.includes(userRole)) {
          // Redirect to correct dashboard based on user role
          const roleRedirects = {
            "pegawai": "/pegawai/dashboard",
            "operator": "/operator/dashboard", 
            "admin": "/admin/dashboard",
            "operator_sekolah": "/operator-sekolah/dashboard"
          }
          
          const redirectPath = roleRedirects[userRole as keyof typeof roleRedirects]
          if (redirectPath) {
            router.push(redirectPath)
          } else {
            router.push("/403") // Unauthorized page
          }
          return
        }
      } catch (error) {
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }
    fetchSession()
  }, [router, userType])

  if (isLoading || !session?.user) {
    return <DashboardSkeleton />
  }

  const showChangePasswordModal = session.user.mustChangePassword ?? false

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ChangePasswordModal isOpen={showChangePasswordModal} />
      <DashboardSidebar userType={userType} />

      <div className="ml-28 transition-all duration-300">
        <DashboardHeader userType={userType} userName={session.user.name} />

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-6"
        >
          {children}
        </motion.main>
      </div>

      <Toaster />
    </div>
  )
}
