'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, School, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordOperatorSekolahPage() {
  const [nip, setNip] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nip,
          email,
          userType: 'OPERATOR_SEKOLAH'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengirim email reset password')
      }

      setIsSuccess(true)
      toast({
        title: "Email terkirim!",
        description: "Silakan cek email Anda untuk instruksi reset password.",
      })
    } catch (error: any) {
      toast({
        title: "Gagal mengirim email",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Email Berhasil Dikirim
              </CardTitle>
              <CardDescription className="text-gray-600">
                Instruksi reset password telah dikirim ke email Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Silakan cek kotak masuk email Anda dan ikuti instruksi yang diberikan untuk mereset password.
                </p>
                <Link href="/login/operator-sekolah">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Kembali ke Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center pb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <School className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Lupa Password
              </CardTitle>
              <CardDescription className="text-gray-600">
                Masukkan NIP dan email untuk reset password
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nip" className="text-sm font-medium text-gray-700">
                  NIP Operator Sekolah
                </label>
                <Input
                  id="nip"
                  type="text"
                  placeholder="Masukkan NIP 18 digit"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  required
                  maxLength={18}
                  className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email terdaftar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
                disabled={isLoading || !nip || !email}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim Email...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Kirim Email Reset
                  </div>
                )}
              </Button>
            </form>

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <Link
                  href="/login/operator-sekolah"
                  className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-600">
            © 2025 Pemerintah Provinsi Kalimantan Timur
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Sistem Informasi Kenaikan Pangkat - ProPangkat
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
