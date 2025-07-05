"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Pencil, Settings, Info, Shield, Trash2, Plus, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
interface Permission {
  id: string
  name: string
  key: string
  description: string
  module: string
}

interface Role {
  id: string
  name: string
  description: string
  color: string
  isSystem: boolean
}

interface PermissionWithRoles extends Permission {
  roles: Role[]
}

export default function PermissionsPage() {
  // State
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermission, setSelectedPermission] = useState<PermissionWithRoles | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterModule, setFilterModule] = useState("")
  
  // New permission form state
  const [newPermission, setNewPermission] = useState({
    name: "",
    key: "",
    description: "",
    module: "",
  })
  
  // Edit permission form state
  const [editPermission, setEditPermission] = useState<Permission | null>(null)
  
  const { toast } = useToast()

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/permissions')
        const data = await response.json()
        
        if (data.success) {
          setPermissions(data.data)
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch permissions",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching permissions:", error)
        toast({
          title: "Error",
          description: "Failed to fetch permissions. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [toast])

  // Get unique modules for filter
  const modules = Array.from(new Set(permissions.map(p => p.module))).sort()

  // Filtered permissions
  const filteredPermissions = permissions.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterModule === "" || p.module === filterModule)
  )

  // Group permissions by module
  const getGroupedPermissions = () => {
    const moduleGroups: Record<string, Permission[]> = {}
    
    filteredPermissions.forEach(perm => {
      if (!moduleGroups[perm.module]) {
        moduleGroups[perm.module] = []
      }
      moduleGroups[perm.module].push(perm)
    })
    
    return Object.keys(moduleGroups).sort().map(module => ({
      name: module,
      permissions: moduleGroups[module].sort((a, b) => a.name.localeCompare(b.name))
    }))
  }

  const groupedPermissions = getGroupedPermissions()

  // Handlers
  const handleAddPermission = async () => {
    try {
      if (!newPermission.name || !newPermission.key || !newPermission.module) {
        toast({
          title: "Error",
          description: "Name, key, and module are required",
          variant: "destructive",
        })
        return
      }
      
      // Convert key to uppercase and snake case if not already
      const formattedKey = newPermission.key
        .toUpperCase()
        .replace(/[^\w]/g, '_')
        .replace(/_{2,}/g, '_')
      
      const formData = {
        ...newPermission,
        key: formattedKey,
      }
      
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Permission created successfully",
        })
        
        // Add the new permission to the list
        setPermissions([...permissions, data.data])
        
        // Reset form
        setNewPermission({
          name: "",
          key: "",
          description: "",
          module: "",
        })
        
        // Close dialog
        setDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create permission",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating permission:", error)
      toast({
        title: "Error",
        description: "Failed to create permission. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleEditPermission = async () => {
    try {
      if (!editPermission || !editPermission.id) return
      
      // Convert key to uppercase and snake case if not already
      const formattedKey = editPermission.key
        .toUpperCase()
        .replace(/[^\w]/g, '_')
        .replace(/_{2,}/g, '_')
      
      const formData = {
        ...editPermission,
        key: formattedKey,
      }
      
      const response = await fetch(`/api/admin/permissions/${editPermission.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Permission updated successfully",
        })
        
        // Update the permission in the list
        setPermissions(permissions.map(permission => 
          permission.id === editPermission.id ? { ...permission, ...formData } : permission
        ))
        
        // Reset form
        setEditPermission(null)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update permission",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating permission:", error)
      toast({
        title: "Error",
        description: "Failed to update permission. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePermission = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/permissions/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Permission deleted successfully",
        })
        
        // Remove the permission from the list
        setPermissions(permissions.filter(permission => permission.id !== id))
        
        // Reset selected permission if it was deleted
        if (selectedPermission && selectedPermission.id === id) {
          setSelectedPermission(null)
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete permission",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting permission:", error)
      toast({
        title: "Error",
        description: "Failed to delete permission. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const fetchPermissionDetails = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/permissions/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedPermission(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch permission details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching permission details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch permission details. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="bg-gradient-to-r from-blue-700 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Manajemen Permission</h1>
                <p className="text-sky-100">Kelola Permission Sistem</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-3 text-sky-200" />
                <p className="text-sky-100">
                  Halaman ini digunakan untuk mengelola permission yang dapat diberikan kepada role.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Permission</h1>
            <p className="text-muted-foreground">Kelola permission dan module sistem</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>+ Tambah Permission</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Permission Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Permission</Label>
                  <Input
                    id="name"
                    placeholder="Nama Permission"
                    value={newPermission.name}
                    onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="key">
                    Key
                    <span className="text-xs text-muted-foreground ml-1">
                      (akan dikonversi ke UPPERCASE_SNAKE_CASE)
                    </span>
                  </Label>
                  <Input
                    id="key"
                    placeholder="contoh: MANAGE_USERS"
                    value={newPermission.key}
                    onChange={(e) => setNewPermission({ ...newPermission, key: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="module">Module</Label>
                  <Input
                    id="module"
                    placeholder="Nama Module (contoh: users, proposals, system)"
                    value={newPermission.module}
                    onChange={(e) => setNewPermission({ ...newPermission, module: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    placeholder="Deskripsi permission"
                    value={newPermission.description}
                    onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddPermission}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Daftar Permission</CardTitle>
              <div className="flex items-center space-x-2">
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                <Select
                  value={filterModule}
                  onValueChange={setFilterModule}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Module</SelectItem>
                    {modules.map(module => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Cari permission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="max-h-[600px] overflow-y-auto pr-2">
                {loading && filteredPermissions.length === 0 ? (
                  <div className="space-y-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-48 bg-gray-100 rounded mb-1"></div>
                        <div className="h-3 w-20 bg-gray-100 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredPermissions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Tidak ada permission yang sesuai dengan filter
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedPermissions.map((module) => (
                      <div key={module.name} className="mb-4">
                        <h3 className="text-sm font-medium border-b pb-2 mb-2 sticky top-0 bg-white z-10">
                          {module.name}
                        </h3>
                        <div className="space-y-2">
                          {module.permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => fetchPermissionDetails(permission.id)}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{permission.name}</h4>
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditPermission(permission);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Permission</DialogTitle>
                                      </DialogHeader>
                                      {editPermission && (
                                        <div className="grid gap-4 py-4">
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-name">Nama Permission</Label>
                                            <Input
                                              id="edit-name"
                                              placeholder="Nama Permission"
                                              defaultValue={editPermission.name}
                                              onChange={(e) => setEditPermission({ ...editPermission, name: e.target.value })}
                                            />
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-key">
                                              Key
                                              <span className="text-xs text-muted-foreground ml-1">
                                                (akan dikonversi ke UPPERCASE_SNAKE_CASE)
                                              </span>
                                            </Label>
                                            <Input
                                              id="edit-key"
                                              placeholder="contoh: MANAGE_USERS"
                                              defaultValue={editPermission.key}
                                              onChange={(e) => setEditPermission({ ...editPermission, key: e.target.value })}
                                            />
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-module">Module</Label>
                                            <Input
                                              id="edit-module"
                                              placeholder="Nama Module"
                                              defaultValue={editPermission.module}
                                              onChange={(e) => setEditPermission({ ...editPermission, module: e.target.value })}
                                            />
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-description">Deskripsi</Label>
                                            <Textarea
                                              id="edit-description"
                                              placeholder="Deskripsi permission"
                                              defaultValue={editPermission.description}
                                              onChange={(e) => setEditPermission({ ...editPermission, description: e.target.value })}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <DialogFooter>
                                        <Button type="submit" onClick={handleEditPermission}>
                                          Simpan
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="text-red-500"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Permission</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah Anda yakin ingin menghapus permission &ldquo;{permission.name}&rdquo;? 
                                          Permission yang telah dihapus tidak dapat dikembalikan.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-500 hover:bg-red-600"
                                          onClick={() => handleDeletePermission(permission.id)}
                                        >
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {permission.description || "No description"}
                              </div>
                              <div className="flex items-center mt-2">
                                <Badge variant="outline" className="mr-2 text-xs">
                                  {permission.key}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detail Permission</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPermission ? (
                <div>
                  <div className="mb-4 pb-2 border-b">
                    <h3 className="font-medium text-lg">{selectedPermission.name}</h3>
                    <p className="text-sm mt-2">{selectedPermission.description || "No description"}</p>
                    <div className="flex items-center mt-3 space-x-2">
                      <Badge variant="outline">{selectedPermission.key}</Badge>
                      <Badge variant="secondary">{selectedPermission.module}</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Roles dengan Permission Ini</h3>
                    {selectedPermission.roles.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground border rounded-lg">
                        Permission ini belum diberikan ke role manapun
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedPermission.roles.map(role => (
                          <div key={role.id} className="flex items-center justify-between p-2 rounded-md border">
                            <div className="flex items-center">
                              <Badge className={role.color + " text-xs px-2 py-1 rounded-full"}>
                                {role.name}
                              </Badge>
                              {role.isSystem && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Pilih sebuah permission untuk melihat detailnya</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
