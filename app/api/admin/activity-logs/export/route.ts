import { NextRequest, NextResponse } from "next/server"
import { withAuth, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { generateExcelExport } from "@/lib/excel-utils"
import type { User } from "@/lib/types"

interface LogFilters {
  where: Record<string, any>;
  include: {
    user: {
      select: {
        id: boolean;
        name: boolean;
        email: boolean;
        role: boolean;
      }
    }
  };
  orderBy: {
    createdAt: "asc" | "desc";
  };
  take: number;
}

interface FormattedLog {
  "ID": string;
  "Tanggal": string;
  "Aksi": string;
  "Pengguna": string;
  "Email": string;
  "Role": string;
  "Detail": string;
}

/**
 * Endpoint to export activity logs to Excel or CSV
 */
export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || undefined
    const action = searchParams.get("action") || undefined
    const userId = searchParams.get("userId") || undefined
    const role = searchParams.get("role") || undefined
    const dateFilter = searchParams.get("date") || undefined
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const exportFormat = searchParams.get("export") || "excel"
    const limit = parseInt(searchParams.get("limit") || "1000", 10)

    // Build query filters
    const filters: LogFilters = {
      where: {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    }

    // Filter by search
    if (search) {
      filters.where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { "user.name": { contains: search, mode: "insensitive" } },
        { "user.email": { contains: search, mode: "insensitive" } },
        { details: { path: "$", string_contains: search } }
      ]
    }

    // Filter by action
    if (action) {
      filters.where.action = action
    }

    // Filter by user ID
    if (userId) {
      filters.where.userId = userId
    }

    // Filter by role
    if (role) {
      filters.where.user = {
        role: role
      }
    }

    // Filter by date range or predefined date filter
    if (startDate && endDate) {
      // Custom date range
      const fromDate = new Date(startDate)
      fromDate.setHours(0, 0, 0, 0)

      const toDate = new Date(endDate)
      toDate.setHours(23, 59, 59, 999)

      filters.where.createdAt = {
        gte: fromDate,
        lte: toDate
      }
    } else if (dateFilter) {
      // Predefined date filters
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      switch (dateFilter) {
        case "today":
          filters.where.createdAt = {
            gte: today,
            lt: tomorrow
          }
          break

        case "yesterday":
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          filters.where.createdAt = {
            gte: yesterday,
            lt: today
          }
          break

        case "last7days":
          const last7days = new Date(today)
          last7days.setDate(last7days.getDate() - 7)
          filters.where.createdAt = {
            gte: last7days
          }
          break

        case "last30days":
          const last30days = new Date(today)
          last30days.setDate(last30days.getDate() - 30)
          filters.where.createdAt = {
            gte: last30days
          }
          break

        case "thisMonth":
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          filters.where.createdAt = {
            gte: firstDayOfMonth,
            lt: firstDayOfNextMonth
          }
          break

        case "lastMonth":
          const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          filters.where.createdAt = {
            gte: firstDayOfLastMonth,
            lt: firstDayOfCurrentMonth
          }
          break
      }
    }

    // Fetch activity logs
    const logs = await prisma.activityLog.findMany(filters)

    // Format logs for export
    const formattedLogs: FormattedLog[] = logs.map(log => ({
      "ID": log.id,
      "Tanggal": new Date(log.createdAt).toLocaleString("id-ID"),
      "Aksi": formatAction(log.action),
      "Pengguna": log.user?.name || "Unknown",
      "Email": log.user?.email || "-",
      "Role": formatRole(log.user?.role || ""),
      "Detail": formatDetails(log.action, log.details)
    }))

    // Generate filename with current date
    const date = new Date().toISOString().split("T")[0]
    const filename = `activity-logs-${date}`

    // Export based on format
    if (exportFormat === "csv") {
      // Convert to CSV
      const csv = convertToCSV(formattedLogs)
      
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`
        }
      })
    } else {
      // Generate Excel file
      const buffer = generateExcelExport(formattedLogs, "Activity Logs", filename)
      
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`
        }
      })
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to export activity logs"
    console.error("Error exporting activity logs:", error)
    return createErrorResponse(errorMessage)
  }
})

/**
 * Format action name for display
 */
function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    "LOGIN": "Login",
    "LOGOUT": "Logout",
    "CREATE_PROPOSAL": "Buat Usulan",
    "UPDATE_PROPOSAL": "Perbarui Usulan",
    "DELETE_PROPOSAL": "Hapus Usulan",
    "APPROVE_PROPOSAL": "Setujui Usulan",
    "REJECT_PROPOSAL": "Tolak Usulan",
    "UPLOAD_DOCUMENT": "Unggah Dokumen",
    "VIEW_DOCUMENT": "Lihat Dokumen",
    "DELETE_DOCUMENT": "Hapus Dokumen",
    "CREATE_TIMELINE": "Buat Timeline",
    "UPDATE_TIMELINE": "Perbarui Timeline",
    "DELETE_TIMELINE": "Hapus Timeline",
    "CHANGE_PASSWORD": "Ubah Password"
  }
  
  return actionMap[action] || action
}

/**
 * Format role name for display
 */
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    "ADMIN": "Admin",
    "OPERATOR": "Operator",
    "PEGAWAI": "Pegawai",
    "OPERATOR_SEKOLAH": "Operator Sekolah",
    "UNIT_KERJA": "Unit Kerja"
  }
  
  return roleMap[role] || role
}

/**
 * Format details based on action type
 */
function formatDetails(action: string, details: Record<string, unknown> | null): string {
  if (!details) return "-"
  
  try {
    switch (action) {
      case "LOGIN":
      case "LOGOUT":
        return `${details.browser || ""} ${details.device ? `- ${details.device}` : ""} ${details.ip ? `dari IP ${details.ip}` : ""}`
        
      case "APPROVE_PROPOSAL":
      case "REJECT_PROPOSAL":
        return `Usulan ${details.pegawaiName || ""} ${details.fromStatus && details.toStatus ? `(${details.fromStatus} → ${details.toStatus})` : ""} ${details.notes ? `: "${details.notes}"` : ""}`
        
      case "UPLOAD_DOCUMENT":
      case "DELETE_DOCUMENT":
      case "VIEW_DOCUMENT":
        return `${details.documentName || "Dokumen"} ${details.fileName ? `(${details.fileName})` : ""} ${details.pegawaiName ? `milik ${details.pegawaiName}` : ""}`
        
      case "CREATE_PROPOSAL":
      case "UPDATE_PROPOSAL":
      case "DELETE_PROPOSAL":
        return `${details.title || "Usulan"} ${details.proposalId ? `(ID: ${details.proposalId})` : ""} ${details.pegawaiName ? `oleh ${details.pegawaiName}` : ""}`
        
      case "CREATE_TIMELINE":
      case "UPDATE_TIMELINE":
      case "DELETE_TIMELINE":
        return `${details.title || "Timeline"} ${details.period ? `- ${details.period}` : ""} ${details.jabatanType ? `(${details.jabatanType})` : ""}`
        
      default:
        if (typeof details === 'object') {
          // Try to display a nice summary
          const detailKeys = Object.keys(details)
          if (detailKeys.includes('name')) return String(details.name)
          if (detailKeys.includes('title')) return String(details.title)
          if (detailKeys.includes('message')) return String(details.message)
          
          // Fallback to stringified JSON
          return JSON.stringify(details)
        }
        return String(details)
    }
  } catch (_) {
    return "Detail tidak tersedia"
  }
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(arr: FormattedLog[]): string {
  if (arr.length === 0) return ""
  
  const header = Object.keys(arr[0]).join(",")
  const rows = arr.map(obj => {
    return Object.values(obj)
      .map(val => {
        // Escape quotes and wrap in quotes if string contains comma
        if (typeof val === "string") {
          const escaped = val.replace(/"/g, '""')
          return (val.includes(",") || val.includes("\n") || val.includes('"')) 
            ? `"${escaped}"` 
            : escaped
        }
        return val
      })
      .join(",")
  }).join("\n")
  
  return `${header}\n${rows}`
}
