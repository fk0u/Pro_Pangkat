"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Eye, EyeOff, Loader2, Shield, User, Lock, Mail, Key, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ForgotPasswordFormProps {
  userType: "pegawai" | "operator" | "admin"
}

type Step = "request" | "verify"

export function ForgotPasswordForm({ userType }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>("request")
  const [nip, setNip] = useState("")
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const router = useRouter()

  const getUserTypeColor = () => {
    switch (userType) {
      case "operator":
        return "from-green-500 to-emerald-500"
      case "admin":
        return "from-purple-500 to-indigo-500"
      default:
        return "from-sky-500 to-teal-500"
    }
  }

  const getUserTypeTitle = () => {
    switch (userType) {
      case "operator":
        return "Operator"
      case "admin":
        return "Administrator"
      default:
        return "Pegawai"
    }
  }

  const validateRequestForm = () => {
    const newErrors: Record<string, string> = {}

    if (!nip.trim()) {
      newErrors.nip = "NIP tidak boleh kosong"
    } else if (nip.length !== 18) {
      newErrors.nip = "NIP harus 18 digit"
    } else if (!/^\d+$/.test(nip)) {
      newErrors.nip = "NIP hanya boleh berisi angka"
    }

    if (!email.trim()) {
      newErrors.email = "Email tidak boleh kosong"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateVerifyForm = () => {
    const newErrors: Record<string, string> = {}

    if (!token.trim()) {
      newErrors.token = "Token tidak boleh kosong"
    } else if (token.length !== 6) {
      newErrors.token = "Token harus 6 digit"
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "Password baru tidak boleh kosong"
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password minimal 6 karakter"
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Konfirmasi password tidak boleh kosong"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRequestForm()) {
      toast({
        title: "Form tidak valid",
        description: "Mohon periksa kembali data yang Anda masukkan",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: "request",
          nip,
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      toast({
        title: "Token berhasil dikirim! 📧",
        description: "Silakan cek email Anda untuk mendapatkan kode token",
      })

      setStep("verify")
    } catch (error: any) {
      toast({
        title: "Gagal mengirim token",
        description: error.message || "NIP atau email tidak ditemukan dalam sistem",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateVerifyForm()) {
      toast({
        title: "Form tidak valid",
        description: "Mohon periksa kembali data yang Anda masukkan",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: "reset",
          nip,
          token,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      toast({
        title: "Password berhasil direset! 🎉",
        description: "Silakan login dengan password baru Anda",
      })

      setTimeout(() => {
        router.push(`/login/${userType}`)
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Reset password gagal",
        description: error.message || "Token tidak valid atau sudah kadaluarsa",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[30px] p-6 shadow-2xl border border-white/20 dark:border-gray-700/20 w-full max-w-md mx-auto"
    >
      {/* Header Section */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center mb-3"
        >
          <Shield className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-2" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Reset Password {getUserTypeTitle()}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`text-4xl font-extrabold bg-gradient-to-r ${getUserTypeColor()} bg-clip-text text-transparent mb-3`}
        >
          ProPangkat
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {step === "request"
            ? "Masukkan NIP dan email untuk mendapatkan token reset password"
            : "Masukkan token dan password baru Anda"}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {step === "request" ? (
          <motion.form
            key="request-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleRequestToken}
            className="space-y-4"
          >
            {/* NIP Input */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Masukkan NIP 18 Digit"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                maxLength={18}
                disabled={isLoading}
                className={`h-12 rounded-full bg-gray-100 dark:bg-gray-800 border-2 pl-12 pr-4 text-base font-medium ${
                  errors.nip ? "border-red-400" : "border-transparent"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {errors.nip && (
                <div className="flex items-center mt-1 text-red-500 text-xs font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.nip}
                </div>
              )}
            </div>

            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="email"
                placeholder="Masukkan Email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`h-12 rounded-full bg-gray-100 dark:bg-gray-800 border-2 pl-12 pr-4 text-base font-medium ${
                  errors.email ? "border-red-400" : "border-transparent"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {errors.email && (
                <div className="flex items-center mt-1 text-red-500 text-xs font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 rounded-full text-white font-bold text-lg shadow-lg transition-all duration-300 bg-gradient-to-r ${getUserTypeColor()} hover:opacity-90`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Mengirim Token...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Kirim Token</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.form
            key="verify-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetPassword}
            className="space-y-4"
          >
            {/* Token Input */}
            <div className="relative">
              <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Masukkan Token 6 Digit"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength={6}
                disabled={isLoading}
                className={`h-12 rounded-full bg-gray-100 dark:bg-gray-800 border-2 pl-12 pr-4 text-base font-medium ${
                  errors.token ? "border-red-400" : "border-transparent"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {errors.token && (
                <div className="flex items-center mt-1 text-red-500 text-xs font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.token}
                </div>
              )}
            </div>

            {/* New Password Input */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password Baru (minimal 6 karakter)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className={`h-12 rounded-full bg-gray-100 dark:bg-gray-800 border-2 pl-12 pr-12 text-base font-medium ${
                  errors.newPassword ? "border-red-400" : "border-transparent"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              {errors.newPassword && (
                <div className="flex items-center mt-1 text-red-500 text-xs font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.newPassword}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="password"
                placeholder="Konfirmasi Password Baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`h-12 rounded-full bg-gray-100 dark:bg-gray-800 border-2 pl-12 pr-4 text-base font-medium ${
                  errors.confirmPassword ? "border-red-400" : "border-transparent"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {errors.confirmPassword && (
                <div className="flex items-center mt-1 text-red-500 text-xs font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 rounded-full text-white font-bold text-lg shadow-lg transition-all duration-300 bg-gradient-to-r ${getUserTypeColor()} hover:opacity-90`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Mereset Password...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Reset Password</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>

            {/* Back to Request */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep("request")}
                disabled={isLoading}
                className={`text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors duration-200 hover:underline ${isLoading ? "pointer-events-none opacity-50" : ""}`}
              >
                Kembali ke Request Token
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Demo Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="mt-4 p-3 bg-sky-50 dark:bg-gray-800 rounded-xl border border-sky-200 dark:border-gray-700"
      >
        <p className="text-xs text-sky-700 dark:text-sky-300 text-center font-medium">
          <strong>Demo Token:</strong> 123456
        </p>
      </motion.div>
    </motion.div>
  )
}
