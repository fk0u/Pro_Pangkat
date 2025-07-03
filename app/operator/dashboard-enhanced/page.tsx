"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { Users, Building2, MapPin, TrendingUp, Clock, Calendar, Activity, Database, BarChart3, PieChart, Users2, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// Interfaces
interface WilayahMaster {
  id: string
  kode: string
  nama: string
  namaLengkap: string
  ibukota: string
}

interface DashboardStats {
  pegawai: {
    total: number
    aktif: number
    byJabatan: Record<string, number>
    byPendidikan: Record<string, number>
    byJenisKelamin: Record<string, number>
    recentChanges: number
  }
  unitKerja: {
    total: number
    aktif: number
    byJenjang: Record<string, number>
    byStatus: Record<string, number>
    recentChanges: number
  }
  summary: {
    totalEntitas: number
    wilayahTercakup: number
    tingkatKeaktifan: number
    lastUpdated: string
  }
}

interface OperatorInfo {
  role: string
  wilayah: string | null
  wilayahRelasi: WilayahMaster | null
}

interface RecentActivity {
  id: string
  type: 'PEGAWAI' | 'UNIT_KERJA'
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  description: string
  timestamp: string
  user: string
}

// Quick Stats Component
const QuickStatCard = ({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{className?: string}>
  color: string
  trend?: number
}) => (
  <Card className={`${color} border-none shadow-sm`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-70">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-60 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">
                {trend > 0 ? '+' : ''}{trend}% dari bulan lalu
              </span>
            </div>
          )}
        </div>
        <Icon className="h-8 w-8 opacity-80" />
      </div>
    </CardContent>
  </Card>
)

// Chart Component (simplified representation)
const SimpleChart = ({ data, type, title }: {
  data: Record<string, number>
  type: 'bar' | 'pie'
  title: string
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        {type === 'bar' ? <BarChart3 className="h-5 w-5" /> : <PieChart className="h-5 w-5" />}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{key}</span>
            <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`bg-blue-600 h-2 rounded-full transition-all duration-500 ${
                      value === Math.max(...Object.values(data)) ? 'w-full' : 
                      value >= Math.max(...Object.values(data)) * 0.8 ? 'w-4/5' :
                      value >= Math.max(...Object.values(data)) * 0.6 ? 'w-3/5' :
                      value >= Math.max(...Object.values(data)) * 0.4 ? 'w-2/5' :
                      value >= Math.max(...Object.values(data)) * 0.2 ? 'w-1/5' : 'w-1/12'
                    }`}
                  />
              </div>
              <span className="text-sm font-medium min-w-[30px] text-right">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// Main Dashboard Component
export default function OperatorDashboardPage() {
  // State Management
  const [stats, setStats] = useState<DashboardStats>({
    pegawai: {
      total: 0, aktif: 0, byJabatan: {}, byPendidikan: {}, byJenisKelamin: {}, recentChanges: 0
    },
    unitKerja: {
      total: 0, aktif: 0, byJenjang: {}, byStatus: {}, recentChanges: 0
    },
    summary: {
      totalEntitas: 0, wilayahTercakup: 0, tingkatKeaktifan: 0, lastUpdated: ''
    }
  })
  
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const { toast } = useToast()

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/operator/dashboard', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error('Gagal memuat data dashboard')
      
      const result = await response.json()
      
      if (result.success) {
        setStats(result.stats || stats)
        setOperatorInfo(result.operatorInfo || null)
        setRecentActivities(result.activities || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast, stats])

  // Auto-refresh setup
  const startAutoRefresh = useCallback(() => {
    const interval = setInterval(fetchDashboardData, 60000) // 1 minute
    setRefreshInterval(interval)
  }, [fetchDashboardData])

  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [refreshInterval])

  // Effects
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    startAutoRefresh()
    return () => stopAutoRefresh()
  }, [startAutoRefresh, stopAutoRefresh])

  const getActivityIcon = (type: string) => {
    if (type === 'PEGAWAI') return <Users className="h-4 w-4" />
    if (type === 'UNIT_KERJA') return <Building2 className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-50'
      case 'UPDATE': return 'text-blue-600 bg-blue-50'
      case 'DELETE': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Loading State
  if (loading) {
    return (
      <DashboardLayout userType="operator">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Memuat dashboard...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="operator">
      <div className="space-y-6">
        
        {/* Header with Wilayah Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Database className="h-10 w-10" />
                  <div>
                    <CardTitle className="text-3xl font-bold">Dashboard Operator</CardTitle>
                    {operatorInfo?.wilayahRelasi && (
                      <div className="text-blue-100 mt-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-lg">
                          {operatorInfo.wilayahRelasi.nama} - {operatorInfo.wilayahRelasi.namaLengkap}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-blue-200">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Terakhir diperbarui: {stats.summary.lastUpdated ? 
                          new Date(stats.summary.lastUpdated).toLocaleString('id-ID') : 
                          'Baru saja'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">
                    {stats.summary.totalEntitas}
                  </div>
                  <div className="text-blue-200 text-sm">
                    Total Entitas
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <QuickStatCard
            title="Total Pegawai"
            value={stats.pegawai.total}
            subtitle={`${stats.pegawai.aktif} aktif`}
            icon={Users2}
            color="bg-gradient-to-br from-green-50 to-emerald-50 text-green-800"
            trend={stats.pegawai.recentChanges}
          />
          
          <QuickStatCard
            title="Unit Kerja"
            value={stats.unitKerja.total}
            subtitle={`${stats.unitKerja.aktif} aktif`}
            icon={Building2}
            color="bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-800"
            trend={stats.unitKerja.recentChanges}
          />
          
          <QuickStatCard
            title="Tingkat Keaktifan"
            value={`${stats.summary.tingkatKeaktifan}%`}
            subtitle="Data ter-update"
            icon={Target}
            color="bg-gradient-to-br from-purple-50 to-violet-50 text-purple-800"
          />
          
          <QuickStatCard
            title="Wilayah Tercakup"
            value={stats.summary.wilayahTercakup}
            subtitle="Area kerja"
            icon={MapPin}
            color="bg-gradient-to-br from-orange-50 to-amber-50 text-orange-800"
          />
        </motion.div>

        {/* Charts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <SimpleChart
            data={stats.pegawai.byJabatan}
            type="bar"
            title="Distribusi Jabatan"
          />
          
          <SimpleChart
            data={stats.unitKerja.byJenjang}
            type="bar"
            title="Distribusi Unit Kerja"
          />
          
          <SimpleChart
            data={stats.pegawai.byPendidikan}
            type="pie"
            title="Tingkat Pendidikan"
          />
        </motion.div>

        {/* Quick Actions & Recent Activities */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Aksi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/operator/pegawai-enhanced">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Users2 className="h-4 w-4" />
                  Kelola Pegawai
                </Button>
              </Link>
              
              <Link href="/operator/unit-kerja-new">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Building2 className="h-4 w-4" />
                  Kelola Unit Kerja
                </Button>
              </Link>
              
              <Button className="w-full justify-start gap-2" variant="outline">
                <BarChart3 className="h-4 w-4" />
                Lihat Laporan
              </Button>
              
              <Button 
                className="w-full justify-start gap-2" 
                variant="outline"
                onClick={fetchDashboardData}
              >
                <Clock className="h-4 w-4" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Belum ada aktivitas terbaru</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            oleh {activity.user}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          
          {/* Pegawai Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                Ringkasan Pegawai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Pegawai</span>
                  <span className="font-bold text-lg">{stats.pegawai.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status Aktif</span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats.pegawai.aktif}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Laki-laki</span>
                  <span className="font-medium">{stats.pegawai.byJenisKelamin.L || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Perempuan</span>
                  <span className="font-medium">{stats.pegawai.byJenisKelamin.P || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Perubahan Bulan Ini</span>
                    <span className={`font-medium ${stats.pegawai.recentChanges >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.pegawai.recentChanges >= 0 ? '+' : ''}{stats.pegawai.recentChanges}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unit Kerja Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Ringkasan Unit Kerja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Unit Kerja</span>
                  <span className="font-bold text-lg">{stats.unitKerja.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status Aktif</span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats.unitKerja.aktif}
                  </Badge>
                </div>
                
                {/* Top 3 Jenjang */}
                {Object.entries(stats.unitKerja.byJenjang)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([jenjang, count]) => (
                    <div key={jenjang} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{jenjang}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))
                }
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Perubahan Bulan Ini</span>
                    <span className={`font-medium ${stats.unitKerja.recentChanges >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.unitKerja.recentChanges >= 0 ? '+' : ''}{stats.unitKerja.recentChanges}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </DashboardLayout>
  )
}
