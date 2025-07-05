"use client"

import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { NotificationsPopover } from "./notifications-popover"

interface DashboardHeaderProps {
  userType: "pegawai" | "operator" | "admin" | "operator-sekolah"
  userName?: string
}

export function DashboardHeader({ userType, userName = "User" }: DashboardHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    toast({ title: "Anda telah keluar." })
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  // Safe userType handling
  const displayUserType = userType || "User"
  const formattedUserType = typeof displayUserType === 'string' && displayUserType.length > 0 
    ? displayUserType.charAt(0).toUpperCase() + displayUserType.slice(1)
    : "User"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-800 dark:border-gray-700">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Dashboard {formattedUserType}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <NotificationsPopover />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${userName}`} />
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-semibold">{userName}</p>
              <p className="text-xs text-gray-500">{userType}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/${userType}/profil`)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Pengaturan</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
