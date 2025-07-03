"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Pencil, Settings, Info, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const initialRoles = [
  {
    id: 1,
    name: "Super Admin",
    color: "bg-red-100 text-red-700",
    users: 2,
    permissions: 15,
  },
  {
    id: 2,
    name: "Admin",
    color: "bg-blue-100 text-blue-700",
    users: 5,
    permissions: 12,
  },
  {
    id: 3,
    name: "Operator",
    color: "bg-green-100 text-green-700",
    users: 25,
    permissions: 8,
  },
  {
    id: 4,
    name: "Pegawai",
    color: "bg-gray-100 text-gray-700",
    users: 2424,
    permissions: 4,
  },
]

const permissions = [
  {
    name: "Input Usulan",
    Admin: true,
    Operator: false,
    Pegawai: true,
  },
  {
    name: "Verifikasi Dokumen",
    Admin: true,
    Operator: true,
    Pegawai: false,
  },
  {
    name: "Edit Timeline",
    Admin: true,
    Operator: false,
    Pegawai: false,
  },
  {
    name: "Kelola Pengguna",
    Admin: true,
    Operator: false,
    Pegawai: false,
  },
  {
    name: "Export Data",
    Admin: true,
    Operator: true,
    Pegawai: false,
  },
  {
    name: "Lihat Laporan",
    Admin: true,
    Operator: true,
    Pegawai: false,
  },
]

export default function RolePage() {
  const [roles, setRoles] = useState(initialRoles)
  const [newRoleName, setNewRoleName] = useState("")
  const [editingRole, setEditingRole] = useState(null)

  const handleAddRole = () => {
    const newRole = {
      id: roles.length + 1,
      name: newRoleName,
      color: "bg-gray-100 text-gray-700",
      users: 0,
      permissions: 0,
    }
    setRoles([...roles, newRole])
    setNewRoleName("")
  }

  const handleEditRole = (id, updatedName) => {
    const updatedRoles = roles.map((role) =>
      role.id === id ? { ...role, name: updatedName } : role
    )
    setRoles(updatedRoles)
    setEditingRole(null)
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Role dan Hak Akses</h1>
                <p className="text-sky-100">Periode Agustus 2025</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk mengelola pengguna dan hak akses.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Role & Hak Akses</h1>
            <p className="text-muted-foreground">Kelola role dan permission pengguna</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>+ Tambah Role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Role Baru</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Nama Role"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
              <Button onClick={handleAddRole}>Simpan</Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daftar Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="border rounded-lg p-4 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <Badge className={role.color + " text-xs px-2 py-1 rounded-full mb-1"}>
                      {role.name}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {role.users} pengguna
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {role.permissions} permissions
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Role</DialogTitle>
                        </DialogHeader>
                        <Input
                          defaultValue={role.name}
                          onChange={(e) =>
                            setEditingRole({ ...role, name: e.target.value })
                          }
                        />
                        <Button onClick={() => handleEditRole(role.id, editingRole?.name || role.name)}>
                          Simpan
                        </Button>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Atur Hak Akses - {role.name}</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          (Fitur pengaturan hak akses akan diimplementasikan lebih lanjut sesuai kebutuhan backend)
                        </p>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permission Matrix</CardTitle>
              <p className="text-sm text-muted-foreground">
                Hak akses untuk setiap role
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-separate border-spacing-y-2">
                  <thead className="text-left">
                    <tr>
                      <th className="px-4 py-2">Permission</th>
                      <th className="px-4 py-2">Admin</th>
                      <th className="px-4 py-2">Operator</th>
                      <th className="px-4 py-2">Pegawai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm, index) => (
                      <tr key={index} className="bg-white shadow-sm border rounded-lg">
                        <td className="px-4 py-2 font-medium">{perm.name}</td>
                        <td className="px-4 py-2">{perm.Admin ? "✅" : "❌"}</td>
                        <td className="px-4 py-2">{perm.Operator ? "✅" : "❌"}</td>
                        <td className="px-4 py-2">{perm.Pegawai ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
