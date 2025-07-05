import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"
import { Role } from "@prisma/client"

// GET: Fetch all roles with user counts and details
export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    // Get all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Group users by role
    const roleGroups: Record<string, any> = {}
    
    // Initialize with all possible roles from enum
    Object.values(Role).forEach(role => {
      roleGroups[role] = {
        name: role,
        count: 0,
        description: getRoleDescription(role),
        users: []
      }
    })
    
    // Populate with actual users
    users.forEach(user => {
      if (roleGroups[user.role]) {
        roleGroups[user.role].count++
        roleGroups[user.role].users.push(user)
      }
    })
    
    // Convert to array and sort by role priority
    const result = Object.values(roleGroups).sort((a, b) => {
      // Custom sort order
      const priority = {
        'ADMIN': 1,
        'OPERATOR': 2,
        'OPERATOR_DINAS': 3,
        'OPERATOR_SEKOLAH': 4,
        'SUPERVISOR': 5,
        'PEGAWAI': 6,
        'USER': 7
      }
      return (priority[a.name] || 99) - (priority[b.name] || 99)
    })

    return createSuccessResponse(result)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch roles"
    console.error("Error fetching roles:", error)
    return createErrorResponse(errorMessage)
  }
})

// POST: Update user role
export const POST = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const data = await req.json()
    
    // Validate input
    if (!data.userId || !data.role) {
      return createErrorResponse("User ID and role are required")
    }

    // Check if role is valid
    if (!Object.values(Role).includes(data.role)) {
      return createErrorResponse("Invalid role")
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
    })

    if (!targetUser) {
      return createErrorResponse("User not found")
    }

    // Prevent admin from downgrading their own role
    if (data.userId === user.id && data.role !== "ADMIN") {
      return createErrorResponse("Anda tidak dapat menurunkan role Admin Anda sendiri", 400)
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_USER_ROLE",
        details: { 
          userId: updatedUser.id, 
          userName: updatedUser.name,
          oldRole: targetUser.role,
          newRole: updatedUser.role
        },
      },
    })

    return createSuccessResponse(
      updatedUser, 
      "Role berhasil diperbarui"
    )
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update role"
    console.error("Error updating role:", error)
    return createErrorResponse(errorMessage)
  }
})

// Helper function to get role description
function getRoleDescription(role: string): string {
  const descriptions = {
    ADMIN: "Administrator dengan akses penuh ke seluruh sistem dan fitur.",
    OPERATOR: "Operator tingkat provinsi yang mengelola dan memverifikasi usulan.",
    OPERATOR_DINAS: "Operator tingkat dinas yang mengelola data dan verifikasi di lingkup dinas.",
    OPERATOR_SEKOLAH: "Operator tingkat sekolah yang mengelola data dan verifikasi di lingkup sekolah.",
    PEGAWAI: "Pengguna pegawai yang dapat mengajukan usulan kenaikan pangkat.",
    SUPERVISOR: "Pengawas yang dapat memonitoring aktivitas dan memvalidasi data.",
    USER: "Pengguna umum dengan akses terbatas ke fitur-fitur dasar sistem."
  }
  
  return descriptions[role] || `Role ${role}`
}
