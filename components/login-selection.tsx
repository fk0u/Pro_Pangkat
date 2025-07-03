"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, User, Settings, UserCheck, School } from "lucide-react"
import Link from "next/link"

export function LoginSelection() {
  const userTypes = [
    {
      title: "Pegawai",
      description: "Login untuk pegawai yang akan mengajukan kenaikan pangkat",
      icon: User,
      href: "/login/pegawai",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Operator",
      description: "Login untuk operator yang memverifikasi usulan kenaikan pangkat",
      icon: UserCheck,
      href: "/login/operator",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Operator Sekolah",
      description: "Login untuk operator sekolah yang mengelola usulan di unit kerja",
      icon: School,
      href: "/login/operator-sekolah",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Admin",
      description: "Login untuk admin yang mengelola sistem secara keseluruhan",
      icon: Settings,
      href: "/login/admin",
      color: "from-red-500 to-red-600",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[30px] p-8 shadow-2xl border border-white/20 dark:border-gray-700/20 w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center mb-4"
        >
          <Shield className="h-8 w-8 text-sky-500 dark:text-sky-400 mr-3" />
          <span className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Selamat Datang di</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-5xl font-extrabold bg-gradient-to-r from-sky-500 to-teal-500 dark:from-sky-400 dark:to-teal-400 bg-clip-text text-transparent mb-4"
        >
          ProPangkat
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-2"
        >
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">Proses Kenaikan Pangkat Terintegrasi</p>
          <p className="text-gray-500 dark:text-gray-400">Dinas Pendidikan dan Kebudayaan Prov. Kaltim Kalimantan Timur</p>
        </motion.div>
      </div>

      {/* User Type Selection */}
      <div className="space-y-6">
        {/* Baris pertama: Pegawai dan Operator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {userTypes.slice(0, 2).map((userType, index) => (
            <motion.div
              key={userType.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${userType.color} flex items-center justify-center`}
                  >
                    <userType.icon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">{userType.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                    {userType.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={userType.href}>
                    <Button
                      className={`w-full bg-gradient-to-r ${userType.color} hover:opacity-90 text-white font-semibold py-3 rounded-full transition-all duration-300`}
                    >
                      Masuk sebagai {userType.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Baris kedua: Operator Sekolah dan Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {userTypes.slice(2, 4).map((userType, index) => (
            <motion.div
              key={userType.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${userType.color} flex items-center justify-center`}
                  >
                    <userType.icon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">{userType.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                    {userType.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={userType.href}>
                    <Button
                      className={`w-full bg-gradient-to-r ${userType.color} hover:opacity-90 text-white font-semibold py-3 rounded-full transition-all duration-300`}
                    >
                      Masuk sebagai {userType.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-8 p-4 bg-sky-50 dark:bg-gray-800 rounded-xl border border-sky-200 dark:border-gray-700"
      >
        <p className="text-sm text-sky-700 dark:text-sky-300 text-center">
          <strong>Informasi:</strong> Gunakan NIP 18 digit dan password yang telah diberikan untuk login. Jika mengalami
          kesulitan, hubungi administrator sistem.
        </p>
      </motion.div>
    </motion.div>
  )
}
