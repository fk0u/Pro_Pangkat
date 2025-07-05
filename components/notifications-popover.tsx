"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  actionUrl?: string
  actionLabel?: string
  createdAt: string
}

export function NotificationsPopover() {
  const router = useRouter()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/notifications?limit=10")
      
      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }
      
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      if (!isOpen) {
        fetchNotifications()
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(intervalId)
  }, [isOpen])

  // Fetch new notifications when opening popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchNotifications()
    }
  }

  // Mark notifications as read when opened
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      // Mark all visible notifications as read
      const markAsRead = async () => {
        try {
          await fetch("/api/notifications", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              action: "mark_all_read"
            })
          })
          
          // Update local state to show all as read
          setNotifications(prev => 
            prev.map(notification => ({
              ...notification,
              isRead: true
            }))
          )
          setUnreadCount(0)
        } catch (error) {
          console.error("Error marking notifications as read:", error)
        }
      }
      
      markAsRead()
    }
  }, [isOpen, unreadCount])

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setIsOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMinutes < 1) return "Baru saja"
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`
    if (diffHours < 24) return `${diffHours} jam yang lalu`
    if (diffDays < 7) return `${diffDays} hari yang lalu`
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400"
      case "warning":
        return "text-yellow-600 dark:text-yellow-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-blue-600 dark:text-blue-400"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 min-w-[16px] h-4 bg-red-500 text-white" 
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 font-medium border-b">
          <div className="flex justify-between items-center">
            <h4>Notifikasi</h4>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchNotifications}
                disabled={isLoading}
                className="h-7 px-2 text-xs"
              >
                Segarkan
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded-md w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded-md w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded-md w-2/3 animate-pulse" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] p-4 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-20" />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 ${
                  notification.isRead ? "opacity-70" : "bg-muted/20"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <p className={`font-medium ${getNotificationColor(notification.type)}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                  )}
                </div>
                
                {notification.actionLabel && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNotificationClick(notification)
                    }}
                  >
                    {notification.actionLabel}
                  </Button>
                )}
                
                <Separator className="mt-2" />
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
