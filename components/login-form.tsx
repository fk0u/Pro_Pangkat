"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [nip, setNip] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log({ nip, password, rememberMe })
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl p-8 shadow-2xl"
    >
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-normal text-gray-800 mb-2"
        >
          Selamat Datang di
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-bold text-sky-500 mb-2"
        >
          ProPangkat
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg font-semibold text-gray-800 mb-1"
        >
          Proses Kenaikan Pangkat Terintegrasi
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-sm text-gray-500"
        >
          Dinas Pendidikan dan Kebudayaan Prov. Kaltim Kalimantan Timur
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Input
            type="text"
            placeholder="NIP"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            className="h-14 rounded-full bg-gray-200 border-0 px-6 text-gray-600 placeholder:text-gray-400 focus:bg-gray-100 focus:ring-2 focus:ring-sky-400"
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-full bg-gray-200 border-0 px-6 text-gray-600 placeholder:text-gray-400 focus:bg-gray-100 focus:ring-2 focus:ring-sky-400"
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex items-center space-x-2 px-2"
        >
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            className="border-gray-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
          />
          <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
            Ingat Saya
          </label>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="pt-4"
        >
          <Button
            type="submit"
            className="w-full h-14 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Sign In
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="text-center pt-2"
        >
          <Link href="/forgot-password" className="text-gray-600 hover:text-sky-500 transition-colors duration-200">
            Lupa Password?
          </Link>
        </motion.div>
      </form>
    </motion.div>
  )
}
