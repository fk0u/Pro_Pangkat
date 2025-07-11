"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

// Simplified version to test if the component loads
export default function OperatorSekolahUsulanPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <DashboardLayout userType="operator-sekolah">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator-sekolah">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Usulan Kenaikan Pangkat</h1>
        <Card>
          <CardHeader>
            <CardTitle>Usulan Kenaikan Pangkat</CardTitle>
            <CardDescription>
              Kelola dan verifikasi usulan kenaikan pangkat pegawai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Simplified page for testing</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
