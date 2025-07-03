"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Shield } from "lucide-react"

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose?: () => void
  onSuccess?: () => void
  userName?: string
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess, userName }: ChangePasswordModalProps) {
  const { toast } = useToast()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ newPassword?: string[]; confirmPassword?: string[] }>({})

  const handleSubmit = async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          toast({
            title: "Gagal",
            description: data.message || "Terjadi kesalahan",
            variant: "destructive",
          })
        }
        return
      }

      toast({
        title: "Sukses!",
        description: "Password Anda telah berhasil diubah.",
      })

      // Reset form
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})

      // Call callbacks
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat mengubah password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[425px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/20" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-3">
            <Shield className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-2" />
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Ubah Password Default
            </DialogTitle>
          </div>
          <DialogDescription className="text-center">
            Selamat datang, <strong>{userName}</strong>!<br />
            Untuk keamanan, Anda harus mengubah password default sebelum melanjutkan. 
            Password baru minimal 8 karakter.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword[0]}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword[0]}</p>}
            {newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
              <p className="text-xs text-green-500">✓ Password cocok</p>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
            className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:opacity-90 transition-all duration-300"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Mengubah Password..." : "Ubah Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
