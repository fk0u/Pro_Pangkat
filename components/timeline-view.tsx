"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CalendarDays, Clock, RefreshCw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// import { motion } from "framer-motion" // unused

interface TimelineData {
  id: string;
  title: string;
  description: string | null;
  jabatanType: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  wilayahId: string | null;
  wilayah?: {
    nama: string;
    namaLengkap: string;
  } | null;
}

interface TimelineViewProps {
  userType: "admin" | "operator" | "pegawai" | "operator-sekolah";
  showControls?: boolean;
}

export default function TimelineView({ userType, showControls = true }: TimelineViewProps) {
  const { toast } = useToast()
  const [timelines, setTimelines] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchTimelines = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true)
      }
      
      // Determine endpoint based on user type
      let endpoint: string
      if (userType === "operator") {
        // Operator uses shared timeline events
        endpoint = "/api/shared/timeline"
      } else if (userType === "operator-sekolah") {
        endpoint = "/api/operator-sekolah/timeline"
      } else {
        endpoint = `/api/${userType}/timeline`
      }
      
      let response = await fetch(endpoint)
      
      // If that fails, fall back to the shared endpoint
      if (!response.ok) {
        console.log(`Specific endpoint ${endpoint} failed, trying shared endpoint`)
        response = await fetch("/api/shared/timeline")
      }
      
      if (!response.ok) {
        console.error("Timeline API returned error:", response.status, response.statusText)
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(`Failed to fetch timelines: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("Timeline API response:", data)
      
      // Handle different response formats
      // Handle different response formats
      if (data && data.success === true) {
        // Operator-specific format
        if (data.data?.timelineData && Array.isArray(data.data.timelineData)) {
          setTimelines(data.data.timelineData)
        // Shared API format
        } else if (data.data?.data && Array.isArray(data.data.data)) {
          setTimelines(data.data.data)
        // Legacy array formats
        } else if (Array.isArray(data.data)) {
          setTimelines(data.data)
        } else if (Array.isArray(data.timelines)) {
          setTimelines(data.timelines)
        } else if (data.data === null) {
          setTimelines([])
        } else {
          console.error("Unexpected API response format:", data)
          throw new Error("Invalid data format from API")
        }
      }
    } catch (error) {
      console.error("Error fetching timelines:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data timeline. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      if (showLoadingIndicator) {
        setLoading(false)
      }
    }
  }, [toast, userType])

  useEffect(() => {
    fetchTimelines()
    setLastRefresh(new Date())
    
    // Set up interval for auto-refresh (every 30 seconds)
    let intervalId: NodeJS.Timeout | null = null
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchTimelines(false) // Pass false to avoid showing loading indicator
        setLastRefresh(new Date())
      }, 30000) // 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, fetchTimelines])

  // Helper function to check if a timeline is currently active (between start and end dates)
  const isTimelineActive = (timeline: TimelineData) => {
    const now = new Date()
    const startDate = new Date(timeline.startDate)
    const endDate = new Date(timeline.endDate)
    return timeline.isActive && now >= startDate && now <= endDate
  }
  
  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
    const end = new Date(endDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
    return `${start} - ${end}`
  }
  
  // Helper function to get job type name
  const getJabatanTypeName = (type: string) => {
    const types: {[key: string]: string} = {
      "all": "Semua Jabatan",
      "pelaksana": "Jabatan Pelaksana",
      "struktural": "Jabatan Struktural",
      "fungsional": "Jabatan Fungsional"
    }
    return types[type] || type
  }
  
  // Helper function to get priority name and class
  const getPriorityInfo = (priority: number) => {
    switch (priority) {
      case 3:
        return { name: "Mendesak", class: "bg-red-100 text-red-700" }
      case 2:
        return { name: "Penting", class: "bg-yellow-100 text-yellow-700" }
      default:
        return { name: "Normal", class: "bg-blue-100 text-blue-700" }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Periode Kenaikan Pangkat</CardTitle>
          <p className="text-sm text-muted-foreground">Timeline waktu pengusulan kenaikan pangkat</p>
        </div>
        {showControls && (
          <div className="flex items-center gap-2">
            <div className="flex items-center mr-2">
              <input 
                type="checkbox" 
                id="autoRefresh" 
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="autoRefresh" className="text-sm">Auto Refresh</label>
            </div>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground mr-2">
                Diperbarui: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchTimelines()} 
              className="mr-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Memuat data timeline...</span>
          </div>
        ) : timelines.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-gray-500">Tidak ada periode kenaikan pangkat yang aktif saat ini</p>
          </div>
        ) : (
          timelines.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-semibold">{item.title}</h3>
                <div className="flex gap-1">
                  <Badge className={`${getPriorityInfo(item.priority).class} text-xs`}>
                    {getPriorityInfo(item.priority).name}
                  </Badge>
                  {isTimelineActive(item) && (
                    <Badge className="bg-green-100 text-green-700">
                      Periode Berjalan
                    </Badge>
                  )}
                </div>
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex flex-col md:flex-row md:gap-10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-black dark:text-white">Jenis Jabatan</div>
                      <div>{getJabatanTypeName(item.jabatanType)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-black dark:text-white">Periode Waktu</div>
                      <div>{formatDateRange(item.startDate, item.endDate)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {(item.wilayah || item.wilayahRelasi) && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Wilayah:</span> {item.wilayah?.namaLengkap || item.wilayahRelasi?.namaLengkap}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
