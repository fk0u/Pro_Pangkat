"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Info, Activity } from "lucide-react"
import * as XLSX from "xlsx"

const initialLogs = [
  {
    name: "Dr. Ahmad Wijaya",
    role: "Pegawai",
    activity: "Upload dokumen SK Kenaikan Pangkat",
    date: "2025-01-08 14:30:15",
    ip: "192.168.1.100",
  },
  {
    name: "Siti Nurhaliza",
    role: "Operator",
    activity: "Verifikasi usulan kenaikan pangkat",
    date: "2025-01-08 14:15:22",
    ip: "192.168.1.101",
  },
  {
    name: "Budi Santoso",
    role: "Admin",
    activity: "Edit timeline KAPE periode Agustus",
    date: "2025-01-08 13:45:10",
    ip: "192.168.1.102",
  },
  {
    name: "Maya Sari",
    role: "Pegawai",
    activity: "Login ke sistem",
    date: "2025-01-08 13:30:05",
    ip: "192.168.1.103",
  },
]

export default function LogActivityPage() {
  const [logs, setLogs] = useState(initialLogs)
  const [roleFilter, setRoleFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filteredLogs = logs.filter((log) => {
    const roleMatch = roleFilter ? log.role.toLowerCase() === roleFilter : true
    const actionMatch = actionFilter
      ? log.activity.toLowerCase().includes(actionFilter)
      : true
    const dateMatch =
      (!startDate || new Date(log.date) >= new Date(startDate)) &&
      (!endDate || new Date(log.date) <= new Date(endDate))
    return roleMatch && actionMatch && dateMatch
  })

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredLogs)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Log Aktivitas")
    XLSX.writeFile(workbook, "log-aktivitas.xlsx")
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Activity className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Log Aktivitas</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk melihat log aktivitas pengguna dalam 24 jam terakhir. Anda dapat menggunakan filter untuk melihat aktivitas tertentu seperti login, upload, verifikasi, dan timeline kenaikan pangkat.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Filter Log</CardTitle>
            <Button variant="outline" onClick={exportExcel}>Export Log</Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="pegawai">Pegawai</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Tanggal Mulai" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Tanggal Selesai" />

            <Select onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Jenis Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="verifikasi">Verifikasi</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Aktivitas</CardTitle>
            <p className="text-sm text-muted-foreground">Log aktivitas pengguna dalam 24 jam terakhir</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <div key={index} className="border rounded-lg p-4 flex justify-between items-start transition-colors duration-300 dark:bg-gray-900 dark:hover:bg-gray-800">
                  <div>
                    <p className="font-semibold text-sm">{log.name}</p>
                    <p className="text-sm text-muted-foreground">{log.activity}</p>
                    <p className="text-xs text-muted-foreground">{log.date} • IP: {log.ip}</p>
                  </div>
                  <div>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                      {log.role}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada data ditemukan</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
