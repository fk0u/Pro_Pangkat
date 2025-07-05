"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Pencil, Settings, Info, Shield, Trash2, Plus, X, Check, Filter, RefreshCw, UserRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Type definitions
interface RoleData {
  name: string;
  count: number;
  description: string;
  users: UserWithRole[];
}

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function RolePage() {
  // State
  const [roles, setRoles] = useState<RoleData[]>([])
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [roleUsers, setRoleUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editUserDialog, setEditUserDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [newRole, setNewRole] = useState("")
  
  const { toast } = useToast()

  // Fetch roles and users
  useEffect(() => {
    // Define the fetch function inside the effect to avoid dependency issues
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/roles')
        const data = await response.json()
        
        if (data.success) {
          setRoles(data.data)
          
          // Extract all users from roles
          const allUsers: UserWithRole[] = []
          data.data.forEach((role: RoleData) => {
            role.users.forEach((user: UserWithRole) => {
              if (!allUsers.some(u => u.id === user.id)) {
                allUsers.push(user)
              }
            })
          })
          
          setUsers(allUsers)
        } else {
          toast({
            title: "Error",
            description: data.message || "Gagal mengambil data role",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching roles:", error)
        toast({
          title: "Error",
          description: "Gagal mengambil data role. Silakan coba lagi nanti.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Filter users when role is selected
  useEffect(() => {
    if (selectedRole) {
      const role = roles.find(r => r.name === selectedRole)
      if (role) {
        setRoleUsers(role.users)
      }
    } else {
      setRoleUsers([])
    }
  }, [selectedRole, roles])

  const handleUpdateUserRole = async () => {
    try {
      if (!selectedUser || !newRole) return
      
      setLoading(true) // Add loading state when updating
      
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: newRole
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Berhasil",
          description: data.message || "Role pengguna berhasil diperbarui",
        })
        
        // Refetch roles to update everything
        await fetchRolesAndUsers()
        
        // Reset form
        setSelectedUser(null)
        setNewRole("")
        setEditUserDialog(false)
      } else {
        toast({
          title: "Error",
          description: data.message || "Gagal memperbarui role pengguna",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui role pengguna. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetUserRole = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return
      
      setLoading(true) // Add loading state when resetting
      
      const response = await fetch(`/api/admin/roles/${userId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Berhasil",
          description: data.message || "Role pengguna berhasil direset ke USER",
        })
        
        // Refetch roles to update everything
        await fetchRolesAndUsers()
      } else {
        toast({
          title: "Error",
          description: data.message || "Gagal mereset role pengguna",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error resetting user role:", error)
      toast({
        title: "Error",
        description: "Gagal mereset role pengguna. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to fetch roles and users
  const fetchRolesAndUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/roles')
      const data = await response.json()
      
      if (data.success) {
        setRoles(data.data)
        
        // Extract all users from roles
        const allUsers: UserWithRole[] = []
        data.data.forEach((role: RoleData) => {
          role.users.forEach((user: UserWithRole) => {
            if (!allUsers.some(u => u.id === user.id)) {
              allUsers.push(user)
            }
          })
        })
        
        setUsers(allUsers)
      } else {
        toast({
          title: "Error",
          description: data.message || "Gagal mengambil data role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Error",
        description: "Gagal mengambil data role. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!selectedRole || user.role === selectedRole)
  )

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "OPERATOR":
        return "bg-blue-100 text-blue-800"
      case "OPERATOR_DINAS":
        return "bg-indigo-100 text-indigo-800"
      case "OPERATOR_SEKOLAH":
        return "bg-purple-100 text-purple-800"
      case "PEGAWAI":
        return "bg-green-100 text-green-800"
      case "SUPERVISOR":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Role descriptions for each role type
  const roleDescriptions = {
    ADMIN: "Administrator dengan akses penuh ke seluruh sistem dan fitur. Dapat mengelola pengguna, data, dan konfigurasi sistem.",
    OPERATOR: "Operator umum yang dapat mengelola data dan proses dalam sistem sesuai dengan kewenangannya.",
    OPERATOR_DINAS: "Operator tingkat dinas yang mengelola data dan proses di lingkup dinas pendidikan.",
    OPERATOR_SEKOLAH: "Operator tingkat sekolah yang mengelola data dan proses di lingkup sekolah tertentu.",
    PEGAWAI: "Pengguna pegawai yang dapat mengajukan usulan kenaikan pangkat dan melihat status usulannya.",
    SUPERVISOR: "Pengawas yang dapat memonitoring aktivitas dan memvalidasi data tertentu dalam sistem.",
    USER: "Pengguna umum dengan akses terbatas ke fitur-fitur dasar sistem."
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-red-700 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Role dan Hak Akses</h1>
                <p className="text-sky-100">Informasi Role Pengguna dalam Sistem</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Halaman ini menampilkan informasi tentang role yang tersedia dalam sistem dan pengguna yang memiliki role tersebut.
                  Role menentukan hak akses dan kemampuan pengguna dalam menggunakan fitur-fitur sistem.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Informasi Role</h1>
            <p className="text-muted-foreground">Daftar role dan pengguna</p>
          </div>
          <Input 
            placeholder="Cari pengguna..." 
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left panel - Role List */}
          <Card className="md:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Daftar Role</CardTitle>
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {loading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 flex items-center justify-between shadow-sm animate-pulse">
                      <div className="space-y-2">
                        <div className="h-5 w-24 bg-gray-200 rounded"></div>
                        <div className="h-4 w-16 bg-gray-100 rounded"></div>
                      </div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div 
                    onClick={() => setSelectedRole(null)}
                    className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all ${!selectedRole ? 'border-primary shadow-md' : 'hover:border-primary/50'}`}
                  >
                    <div>
                      <div className="font-medium">Semua Pengguna</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {users.length} pengguna
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserRound className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  
                  {roles.map((role) => (
                    <div
                      key={role.name}
                      onClick={() => setSelectedRole(role.name)}
                      className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all ${selectedRole === role.name ? 'border-primary shadow-md' : 'hover:border-primary/50'}`}
                    >
                      <div>
                        <Badge className={getRoleBadgeColor(role.name) + " text-xs px-2 py-1 rounded-full mb-1"}>
                          {role.name}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {role.count} pengguna
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Right panel - Role Details and Users */}
          <div className="md:col-span-8 space-y-6">
            {/* Role Description Card */}
            {selectedRole && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Deskripsi Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-2">
                    <div className="mt-1">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedRole}</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {roleDescriptions[selectedRole as keyof typeof roleDescriptions] || 
                          "Deskripsi role tidak tersedia"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedRole ? `Pengguna dengan Role: ${selectedRole}` : 'Semua Pengguna'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4 flex items-center justify-between shadow-sm animate-pulse">
                        <div className="space-y-2">
                          <div className="h-5 w-40 bg-gray-200 rounded"></div>
                          <div className="h-4 w-32 bg-gray-100 rounded"></div>
                        </div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <UserRound className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        {searchQuery ? (
                          <p>Tidak ada pengguna yang sesuai dengan pencarian</p>
                        ) : selectedRole ? (
                          <p>Tidak ada pengguna dengan role {selectedRole}</p>
                        ) : (
                          <p>Belum ada pengguna yang terdaftar</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="border rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                              <Badge className={getRoleBadgeColor(user.role) + " mt-2 text-xs"}>
                                {user.role}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Dialog open={editUserDialog && selectedUser?.id === user.id} onOpenChange={(open) => {
                                if (!open) setSelectedUser(null)
                                setEditUserDialog(open)
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setNewRole(user.role)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 mr-1" /> Edit Role
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Role Pengguna</DialogTitle>
                                    <DialogDescription>
                                      Ubah role untuk {user.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Nama</Label>
                                        <div className="font-medium mt-1">{selectedUser?.name}</div>
                                      </div>
                                      <div>
                                        <Label>Email</Label>
                                        <div className="font-medium mt-1">{selectedUser?.email}</div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                          value={newRole}
                                          onValueChange={setNewRole}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Pilih role" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                                            <SelectItem value="OPERATOR">OPERATOR</SelectItem>
                                            <SelectItem value="OPERATOR_DINAS">OPERATOR_DINAS</SelectItem>
                                            <SelectItem value="OPERATOR_SEKOLAH">OPERATOR_SEKOLAH</SelectItem>
                                            <SelectItem value="PEGAWAI">PEGAWAI</SelectItem>
                                            <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                                            <SelectItem value="USER">USER</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => {
                                      setSelectedUser(null)
                                      setEditUserDialog(false)
                                    }}>
                                      Batal
                                    </Button>
                                    <Button onClick={handleUpdateUserRole}>
                                      Simpan
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="icon" className="text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Role Pengguna</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin mereset role {user.name} ke USER? 
                                      Tindakan ini akan menghapus semua hak akses khusus.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-500 hover:bg-red-600"
                                      onClick={() => handleResetUserRole(user.id)}
                                    >
                                      Reset
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
