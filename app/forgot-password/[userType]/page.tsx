"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [user, setUser] = useState<any>(null)

  const { toast } = useToast()
  const router = useRouter()

  // Check user session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          
          // If user doesn't need to change password, redirect to dashboard
          if (!data.user.mustChangePassword) {
            switch (data.user.role) {
              case "ADMIN":
                router.push("/admin/dashboard")
                break
              case "OPERATOR":
                router.push("/operator/dashboard")
                break
              case "PEGAWAI":
                router.push("/pegawai/dashboard")
                break
              default:
                router.push("/dashboard")
            }
          }
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Session check error:", error)
        router.push("/login")
      }
    }

    checkSession()
  }, [router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!newPassword.trim()) {
      newErrors.newPassword = "Password baru tidak boleh kosong"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password minimal 8 karakter"
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Konfirmasi password tidak boleh kosong"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Form tidak valid",
        description: "Mohon periksa kembali data yang Anda masukkan",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah password")
      }

      toast({
        title: "Password berhasil diubah! 🎉",
        description: "Anda akan diarahkan ke dashboard",
      })

      setTimeout(() => {
        switch (user?.role) {
          case "ADMIN":
            router.push("/admin/dashboard")
            break
          case "OPERATOR":
            router.push("/operator/dashboard")
            break
          case "PEGAWAI":
            router.push("/pegawai/dashboard")
            break
          default:
            router.push("/dashboard")
        }
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Gagal mengubah password",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-sky-400 to-teal-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-sky-400 to-teal-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-gray-700/20">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-sky-500 dark:text-sky-400 mr-2" />
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Ubah Password
              </CardTitle>
            </div>
            <CardDescription className="text-center">
              Selamat datang, <strong>{user.name}</strong>!<br />
              Untuk keamanan, Anda harus mengubah password default.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Password Baru (minimal 8 karakter)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 pr-10 ${
                    errors.newPassword ? "border-red-400 focus:border-red-400" : ""
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {errors.newPassword && (
                  <div className="flex items-center mt-1 text-red-500 text-xs font-medium">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.newPassword}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Konfirmasi Password Baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 pr-10 ${
                    errors.confirmPassword ? "border-red-400 focus:border-red-400" : ""
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {errors.confirmPassword && (
                  <div className="flex items-center mt-1 text-red-500 text-xs font-medium">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.confirmPassword}
                  </div>
                )}
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <div className="flex items-center mt-1 text-green-500 text-xs font-medium">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Password cocok
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:opacity-90 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengubah Password...
                  </div>
                ) : (
                  "Ubah Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
