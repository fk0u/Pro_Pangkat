"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { EnhancedCaptcha } from "@/components/enhanced-captcha"
import { ChangePasswordModal } from "@/components/change-password-modal"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Eye, EyeOff, Loader2, Shield, User, Lock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface FormErrors {
  nip?: string
  password?: string
  captcha?: string
}

interface CompactLoginFormProps { redirectTo?: string }

export function CompactLoginForm({ redirectTo = "/dashboard" }: CompactLoginFormProps) {
  const [nip, setNip] = useState("")
  const [password, setPassword] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [captchaHash, setCaptchaHash] = useState<string | null>(null)
  const [captchaRefreshNonce, setCaptchaRefreshNonce] = useState(0)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [require2FA, setRequire2FA] = useState(false)
  const [otpToken, setOtpToken] = useState("")
  const [isVerifying2FA, setIsVerifying2FA] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [isCaptchaValid, setIsCaptchaValid] = useState(false)
  
  // State untuk modal change password
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  
  interface User {
    id: string;
    nip: string;
    name: string;
    role: string;
    mustChangePassword: boolean;
  }
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  const resetCaptchaChallenge = () => {
    setCaptcha("")
    setCaptchaHash(null)
    setIsCaptchaValid(false)
    setCaptchaRefreshNonce((prev) => prev + 1)
  }

  // Form validation
  useEffect(() => {
    const validateForm = () => {
      const newErrors: FormErrors = {}

      if (!nip.trim()) {
        newErrors.nip = "NIP tidak boleh kosong"
      } else if (nip.length !== 18) {
        newErrors.nip = "NIP harus 18 digit"
      } else if (!/^\d+$/.test(nip)) {
        newErrors.nip = "NIP hanya boleh berisi angka"
      }

      if (!password.trim()) {
        newErrors.password = "Password tidak boleh kosong"
      } else if (password.length < 6) {
        newErrors.password = "Password minimal 6 karakter"
      }

      if (!captcha.trim()) {
        newErrors.captcha = "CAPTCHA tidak boleh kosong"
      } else if (captcha.trim().length !== 5) {
        newErrors.captcha = "CAPTCHA harus 5 karakter"
      } else if (!isCaptchaValid) {
        newErrors.captcha = "CAPTCHA tidak valid"
      }

      setErrors(newErrors)
      setIsFormValid(Object.keys(newErrors).length === 0 && Boolean(nip.trim()) && Boolean(password.trim()) && isCaptchaValid)
    }

    validateForm()
  }, [nip, password, captcha, isCaptchaValid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      toast({
        title: "Form tidak valid",
        description: "Mohon periksa kembali data yang Anda masukkan",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Call login API
      console.log("Attempting login with NIP:", nip)
      const payload = {
        nip,
        password,
        captchaValue: captcha,
        captchaHash,
        captchaToken: captchaHash,
      }
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        // Captcha token is one-time and consumed by login verification.
        // Always rotate captcha challenge on failed attempt.
        resetCaptchaChallenge()
        throw new Error(data.message || "Login gagal" + (data.details ? `: ${JSON.stringify(data.details)}` : ""))
      }

      // Success
      toast({
        title: "Login berhasil! 🎉",
        description: `Selamat datang, ${data.user.name}`,
      })

      // Save to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true")
        localStorage.setItem("savedNip", nip)
        
      } else {
        // Clear saved data if remember me is not checked
        localStorage.removeItem("rememberMe")
        localStorage.removeItem("savedNip")
        
      }

      // Check if user must change password
      if (data.user.mustChangePassword) {
        setCurrentUser(data.user)
        setShowChangePasswordModal(true)
      } else {
        // Redirect based on user role
        redirectToUserDashboard(data.user.role)
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Show more detailed error message for debugging
      let errorMessage = "Server error: Terjadi masalah pada server.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Login gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }


  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) return;

    setIsVerifying2FA(true);
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: otpToken }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kode OTP tidak valid');
      }

      toast({
        title: 'Verifikasi Berhasil',
        description: `Selamat datang, ${data.user?.name || ''}`,
      });

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedNip', nip);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedNip');
      }

      if (data.user?.mustChangePassword) {
        setCurrentUser(data.user);
        setShowChangePasswordModal(true);
      } else {
        redirectToUserDashboard(data.user.role || 'PEGAWAI');
      }
    } catch (error: any) {
      toast({
        title: 'Verifikasi Gagal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const redirectToUserDashboard = (role: string) => {
    let targetRoute = redirectTo
    if (redirectTo === "/dashboard") {
      switch (role) {
        case "ADMIN":
          targetRoute = "/admin/dashboard"
          break
        case "OPERATOR":
          targetRoute = "/operator/dashboard"
          break
        case "OPERATOR_SEKOLAH":
          targetRoute = "/operator-sekolah/dashboard"
          break
        case "PEGAWAI":
          targetRoute = "/pegawai/dashboard"
          break
        default:
          targetRoute = "/dashboard"
      }
    }

    setTimeout(() => {
      router.push(targetRoute)
    }, 1000)
  }

  const handlePasswordChangeSuccess = () => {
    toast({
      title: "Password berhasil diubah! 🎉",
      description: "Anda akan diarahkan ke dashboard",
    })

    // Redirect to dashboard after successful password change
    if (currentUser) {
      redirectToUserDashboard(currentUser.role)
    }
  }

  // Load saved credentials
  useEffect(() => {
    const savedNip = localStorage.getItem("savedNip")
    
    const rememberMeStatus = localStorage.getItem("rememberMe")

    if (rememberMeStatus === "true" && savedNip) {
      setNip(savedNip)
      setRememberMe(true)
    }
  }, [])

  const getUserTypeColor = () => "from-sky-500 to-teal-500"

  const getUserTypeTitle = () => "Sistem Terpadu"

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[30px] p-6 shadow-2xl border border-white/20 dark:border-gray-700/20 w-full max-w-md mx-auto"
      >
        {/* Header Section - sama seperti sebelumnya */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center justify-center mb-3"
          >
            <Shield className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-2" />
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">Login {getUserTypeTitle()}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`text-4xl font-extrabold bg-gradient-to-r ${getUserTypeColor()} dark:from-sky-400 dark:to-teal-400 bg-clip-text text-transparent mb-3`}
          >
            ProPangkat
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-1"
          >
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Proses Kenaikan Pangkat Terintegrasi</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dinas Pendidikan dan Kebudayaan Prov. Kaltim Kalimantan Timur</p>
          </motion.div>
        </div>

        {/* Form Section - sama seperti sebelumnya */}
        
        {require2FA ? (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🔒 Verifikasi 2-Langkah</h3>
              <p className="text-sm text-gray-500 max-w-[260px] mx-auto">Buka aplikasi Authenticator Anda dan masukkan kode 6-digit.</p>
            </motion.div>
            <div className="relative mt-4 mb-6">
              <div className="flex justify-center">
                <Input
                  type="text"
                  placeholder="000000"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  disabled={isVerifying2FA}
                  className="h-14 w-full md:w-3/4 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 px-4 py-2 text-center text-3xl font-extrabold tracking-[0.5em] transition-all duration-300 focus:bg-white dark:focus:bg-gray-700 focus:border-sky-400 placeholder:text-gray-300"
                  maxLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isVerifying2FA || otpToken.length !== 6}
              className={`w-full h-12 rounded-full text-white font-medium text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2 bg-gradient-to-r ${getUserTypeColor()}`}
            >
              {isVerifying2FA ? <Loader2 className="h-6 w-6 animate-spin" /> : <span>Verifikasi <ArrowRight className="ml-2 h-5 w-5 inline" /></span>}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-sm text-gray-500 hover:text-gray-700" onClick={() => setRequire2FA(false)}>
              Batal
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

          {/* NIP Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="relative"
          >
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 z-10" />
              <Input
                type="text"
                placeholder="Masukkan NIP 18 Digit"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                maxLength={18}
                disabled={isLoading}
                className={`h-12 rounded-full bg-gray-100 dark:bg-gray-800 border-2 pl-12 pr-4 text-base font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 focus:bg-white dark:focus:bg-gray-700 focus:border-sky-400 dark:focus:border-sky-500 text-gray-900 dark:text-gray-100 ${
                  errors.nip ? "border-red-400 focus:border-red-400" : "border-transparent"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {isFormValid && nip && !errors.nip && (
                <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>
            <AnimatePresence>
              {errors.nip && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center mt-1 text-red-500 text-xs font-medium"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.nip}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="relative"
          >
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 z-10" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan Password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`h-12 rounded-full bg-gray-100 dark:bg-gray-800 border-2 pl-12 pr-12 text-base font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 focus:bg-white dark:focus:bg-gray-700 focus:border-sky-400 dark:focus:border-sky-500 text-gray-900 dark:text-gray-100 ${
                  errors.password ? "border-red-400 focus:border-red-400" : "border-transparent"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center mt-1 text-red-500 text-xs font-medium"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.password}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* CAPTCHA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="space-y-2"
          >
            <EnhancedCaptcha 
              onValidate={setIsCaptchaValid} 
              value={captcha} 
              onChange={setCaptcha} 
              disabled={isLoading}
              onHashChange={setCaptchaHash}
              refreshNonce={captchaRefreshNonce}
            />
            {!captchaHash && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Jika captcha tidak muncul, silakan klik tombol refresh di samping
              </div>
            )}
            <Input
              type="text"
              placeholder="Masukkan CAPTCHA"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value.toUpperCase())}
              disabled={isLoading}
              className={`h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 px-4 text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 focus:bg-white dark:focus:bg-gray-700 focus:border-sky-400 dark:focus:border-sky-500 text-gray-900 dark:text-gray-100 ${
                errors.captcha ? "border-red-400 focus:border-red-400" : "border-transparent"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            <AnimatePresence>
              {errors.captcha && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center text-red-500 text-xs font-medium"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.captcha}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Remember Me */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex items-center space-x-2 px-1"
          >
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isLoading}
              className="border-2 border-gray-400 dark:border-gray-500 data-[state=checked]:bg-sky-500 dark:data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-500 dark:data-[state=checked]:border-sky-600 h-4 w-4 disabled:opacity-50"
            />
            <label htmlFor="remember" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Ingat Saya
            </label>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="pt-3"
          >
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`w-full h-12 rounded-full text-white font-bold text-lg shadow-lg transition-all duration-300 ${
                isFormValid && !isLoading
                  ? `bg-gradient-to-r ${getUserTypeColor()} hover:opacity-90 hover:shadow-xl hover:scale-105 active:scale-95`
                  : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </motion.div>

          {/* Forgot Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            className="text-center pt-2"
          >
            <Link
              href="/forgot-password"
              className={`text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors duration-200 hover:underline ${isLoading ? "pointer-events-none opacity-50" : ""}`}
            >
              Lupa Password?
            </Link>
          </motion.div>
        </form>
        )}

        {/* Demo Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="mt-4 p-3 bg-sky-50 dark:bg-gray-800 rounded-xl border border-sky-200 dark:border-gray-700"
        >
          <p className="text-xs text-sky-700 dark:text-sky-300 text-center font-medium">
            <strong>Demo Accounts:</strong><br />
            Admin: 000000000000000001 / 000000000000000001<br/>
            Pegawai: 198501012010011001 / 198501012010011001
          </p>
        </motion.div>
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
