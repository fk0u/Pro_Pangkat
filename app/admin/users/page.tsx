"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Eye, Pencil, Trash2, Download, Plus, Info, Users } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"

const users = [
  {
    id: 1,
    name: "Dr. Ahmad Wijaya, S.Pd",
    nip: "198501012010011001",
    role: "Pegawai",
    opd: "Dinas Pendidikan",
    status: "Aktif",
    lastLogin: "2025-01-08 14:30",
  },
  {
    id: 2,
    name: "Siti Nurhaliza, S.Kom",
    nip: "199203152015032002",
    role: "Operator",
    opd: "Diskominfo",
    status: "Aktif",
    lastLogin: "2025-01-08 13:15",
  },
  {
    id: 3,
    name: "Budi Santoso, S.E",
    nip: "198712102012011003",
    role: "Admin",
    opd: "BKPSDM",
    status: "Aktif",
    lastLogin: "2025-01-08 12:45",
  },
  {
    id: 4,
    name: "Maya Sari, S.H",
    nip: "199105082016032001",
    role: "Pegawai",
    opd: "Bagian Hukum",
    status: "Nonaktif",
    lastLogin: "2025-01-05 09:20",
  },
]

export default function ManageUserPage() {
  const router = useRouter()
  const [userList, setUserList] = useState(users)

  const exportExcel = () => {
    const worksheetData = [
      ["No", "Nama", "NIP", "Role", "OPD", "Status", "Last Login"],
      ...userList.map((u, i) => [
        i + 1,
        u.name,
        u.nip,
        u.role,
        u.opd,
        u.status,
        u.lastLogin,
      ])
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Pengguna")
    XLSX.writeFile(workbook, "daftar-pengguna.xlsx")
  }

  const handleView = (id) => {
    router.push(`/admin/users/${id}`)
  }

  const handleEdit = (id) => {
    router.push(`/admin/users/${id}/edit`)
  }

  const handleDelete = (id) => {
    if (confirm("Yakin ingin menghapus pengguna ini?")) {
      const newList = userList.filter((user) => user.id !== id)
      setUserList(newList)
      alert("Data pengguna berhasil dihapus.")
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk manajemen pengguna.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-center">
            <Input placeholder="Cari nama atau NIP..." className="w-[250px]" />
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="Pegawai">Pegawai</SelectItem>
                <SelectItem value="Operator">Operator</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih OPD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="Dinas Pendidikan">Dinas Pendidikan</SelectItem>
                <SelectItem value="Diskominfo">Diskominfo</SelectItem>
                <SelectItem value="BKPSDM">BKPSDM</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status Akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Daftar Pengguna</CardTitle>
              <p className="text-sm text-muted-foreground">Total {userList.length} pengguna terdaftar</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportExcel}>
                <Download className="h-4 w-4 mr-2" /> Export Excel
              </Button>
              <Button onClick={() => router.push("/admin/users/new")}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Pengguna
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead className="text-left">
                <tr>
                  <th className="px-4">No</th>
                  <th className="px-4">Nama / NIP</th>
                  <th className="px-4">Role</th>
                  <th className="px-4">OPD</th>
                  <th className="px-4">Status</th>
                  <th className="px-4">Last Login</th>
                  <th className="px-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user, index) => (
                  <tr key={user.id} className="bg-white dark:bg-gray-900 shadow-sm border hover:shadow-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg overflow-hidden">
                    <td className="px-4 py-3 align-top rounded-l-lg">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-gray-500 text-xs">{user.nip}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">{user.opd}</td>
                    <td className="px-4 py-3">
                      <Badge className={user.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{user.lastLogin}</td>
                    <td className="px-4 py-3 rounded-r-lg flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleView(user.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(user.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
