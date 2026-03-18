"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { ChangePasswordModal } from "@/components/change-password-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, KeyRound, LogIn, Loader2 } from "lucide-react"
import Link from "next/link"

export function EnhancedLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const userType = searchParams.get("type") || "pegawai"
  const [nip, setNip] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // State untuk modal change password
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const getTitle = () => {
    switch (userType) {
      case "admin":
        return "Login Administrator"
      case "operator":
        return "Login Operator"
      default:
        return "Login Pegawai"
    }
  }

  const redirectToUserDashboard = (role: string) => {
    const dashboardUrl = `/${role.toLowerCase()}/dashboard`
    setTimeout(() => {
      router.push(dashboardUrl)
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nip, 
          password,
          captchaValue: "DEMO12345", 
          captchaHash: "not-needed-for-demo",
          userType 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login gagal")
      }

      toast({
        title: "Login Berhasil! 🎉",
        description: `Selamat datang, ${data.user.name}`,
      })

      // Check if user must change password
      if (data.user.mustChangePassword) {
        setCurrentUser(data.user)
        setShowChangePasswordModal(true)
      } else {
        redirectToUserDashboard(data.user.role)
      }
    } catch (error: any) {
      toast({
        title: "Login Gagal",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChangeSuccess = () => {
    toast({
      title: "Password berhasil diubah! 🎉",
      description: "Anda akan diarahkan ke dashboard",
    })

    if (currentUser) {
      redirectToUserDashboard(currentUser.role)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
              <User className="h-8 w-8 text-sky-500" />
            </div>
            <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
            <CardDescription>Masukkan NIP dan password Anda untuk masuk</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP (Nomor Induk Pegawai)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="nip"
                    type="text"
                    placeholder="Masukkan NIP Anda"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    required
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                Masuk
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <Link href={`/forgot-password/${userType}`} className="text-sky-600 hover:underline">
                Lupa password?
              </Link>
              <span className="mx-2 text-gray-300">|</span>
              <Link href="/" className="text-sky-600 hover:underline">
                Kembali ke pilihan login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
        userName={currentUser?.name}
      />
    </>
  )
}
