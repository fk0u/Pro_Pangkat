"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Eye, Pencil, Trash2, Download, Plus, Info, Users, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"
import { UserModal } from "@/components/user-modal"

interface User {
  id: string
  name: string
  nip?: string
  role: string
  unitKerja?: string | { nama: string }
  wilayah?: string
  isActive?: boolean
}

export default function ManageUserPage() {
  const { toast } = useToast()
  const [userList, setUserList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [wilayahFilter, setWilayahFilter] = useState("all")
  const [availableWilayah, setAvailableWilayah] = useState<string[]>([])
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add")
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined)
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch users")
      }
      
      setUserList(data.data)
      
      // Extract unique wilayah values for the filter
      const wilayahList = [...new Set(data.data.map(user => user.wilayah).filter(Boolean))]
      setAvailableWilayah(wilayahList)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exportExcel = () => {
    const filteredUsers = getFilteredUsers()
    const worksheetData = [
      ["No", "Nama", "NIP", "Role", "Unit Kerja", "Wilayah"],
      ...filteredUsers.map((u, i) => [
        i + 1,
        u.name,
        u.nip || "-",
        u.role,
        typeof u.unitKerja === 'object' && u.unitKerja ? u.unitKerja.nama : (u.unitKerja || "-"),
        u.wilayah || "-",
      ])
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Pengguna")
    XLSX.writeFile(workbook, "daftar-pengguna.xlsx")
  }

  const handleView = (id: string) => {
    setSelectedUserId(id)
    setModalMode("view")
    setModalOpen(true)
  }

  const handleEdit = (id: string) => {
    setSelectedUserId(id)
    setModalMode("edit")
    setModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedUserId(undefined)
    setModalMode("add")
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus pengguna ini?")) {
      try {
        const response = await fetch(`/api/admin/users/${id}`, {
          method: "DELETE",
        })
        
        if (!response.ok) {
          throw new Error("Failed to delete user")
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || "Failed to delete user")
        }
        
        setUserList(userList.filter((user) => user.id !== id))
        toast({
          title: "Berhasil",
          description: "Data pengguna berhasil dihapus.",
        })
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "Error",
          description: "Gagal menghapus pengguna. Silakan coba lagi.",
          variant: "destructive"
        })
      }
    }
  }
  
  // Filter users based on search term and filters
  const getFilteredUsers = () => {
    return userList.filter((user) => {
      // Search term filtering
      const matchesSearch = 
        searchTerm === "" || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.nip && user.nip.toLowerCase().includes(searchTerm.toLowerCase()));
        
      // Role filtering
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      // Wilayah filtering
      const matchesWilayah = wilayahFilter === "all" || user.wilayah === wilayahFilter;
      
      return matchesSearch && matchesRole && matchesWilayah;
    });
  }
  
  const filteredUsers = getFilteredUsers();

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
                <p className="text-sky-100">Total {userList.length} pengguna terdaftar</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Ini adalah halaman untuk manajemen pengguna. Anda dapat menambah, mengedit, atau menghapus pengguna.
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
            <Input 
              placeholder="Cari nama atau NIP..." 
              className="w-[250px]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="PEGAWAI">Pegawai</SelectItem>
                <SelectItem value="OPERATOR">Operator</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OPERATOR_SEKOLAH">Operator Sekolah</SelectItem>
                <SelectItem value="OPERATOR_UNIT_KERJA">Operator Unit Kerja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={wilayahFilter} onValueChange={setWilayahFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Wilayah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Wilayah</SelectItem>
                {availableWilayah.map((wilayah) => (
                  <SelectItem key={wilayah} value={wilayah}>{wilayah}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Daftar Pengguna</CardTitle>
              <p className="text-sm text-muted-foreground">Menampilkan {filteredUsers.length} dari {userList.length} pengguna</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportExcel}>
                <Download className="h-4 w-4 mr-2" /> Export Excel
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Pengguna
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat data pengguna...</span>
              </div>
            ) : (
              <table className="min-w-full text-sm border-separate border-spacing-y-2">
                <thead className="text-left">
                  <tr>
                    <th className="px-4">No</th>
                    <th className="px-4">Nama / NIP</th>
                    <th className="px-4">Role</th>
                    <th className="px-4">Unit Kerja</th>
                    <th className="px-4">Wilayah</th>
                    <th className="px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data pengguna yang sesuai dengan filter
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} className="bg-white dark:bg-gray-900 shadow-sm border hover:shadow-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg overflow-hidden">
                        <td className="px-4 py-3 align-top rounded-l-lg">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-gray-500 text-xs">{user.nip || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {typeof user.unitKerja === 'object' && user.unitKerja 
                            ? user.unitKerja.nama 
                            : (user.unitKerja || "-")}
                        </td>
                        <td className="px-4 py-3">{user.wilayah || "-"}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* User Modal */}
      <UserModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchUsers}
        mode={modalMode}
        userId={selectedUserId}
      />
    </DashboardLayout>
  )
}
