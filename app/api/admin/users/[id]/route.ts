import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"
import { hashPassword } from "@/lib/password"

export const GET = withAuth(async (req: NextRequest, user: User, { params }: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const userId = params.id

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        unitKerja: {
          select: {
            id: true,
            nama: true,
          }
        }
      }
    })

    if (!userData) {
      return createErrorResponse("User not found", 404)
    }

    return createSuccessResponse(userData)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch user"
    console.error("Error fetching user:", error)
    return createErrorResponse(errorMessage)
  }
})

export const PUT = withAuth(async (req: NextRequest, user: User, { params }: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const userId = params.id
    const body = await req.json()
    const { 
      name, 
      role, 
      unitKerjaId, 
      wilayahId, 
      nip, 
      password
    } = body

    // Validate required fields
    if (!name || !role || !nip) {
      return createErrorResponse("NIP, Nama, dan Role wajib diisi", 400)
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Check if NIP already exists for another user
    if (nip && nip !== existingUser.nip) {
      const nipExists = await prisma.user.findUnique({
        where: { nip }
      })
      
      if (nipExists) {
        return createErrorResponse("NIP sudah digunakan oleh pengguna lain", 400)
      }
    }

    // Update user
    const updateData: Record<string, unknown> = {
      name,
      role,
      nip,
      unitKerjaId: unitKerjaId || null,
      wilayahId: wilayahId || null
    }

    // Only include password in the update if it was provided
    if (password) {
      updateData.password = await hashPassword(password)
      updateData.mustChangePassword = true
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "UPDATE_USER",
        details: {
          userName: updatedUser.name,
          userRole: updatedUser.role
        },
        userId: user.id
      }
    })

    return createSuccessResponse(updatedUser, "User updated successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update user"
    console.error("Error updating user:", error)
    return createErrorResponse(errorMessage)
  }
})

export const DELETE = withAuth(async (req: NextRequest, user: User, { params }: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const userId = params.id

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return createErrorResponse("User not found", 404)
    }

    // Cannot delete yourself
    if (userId === user.id) {
      return createErrorResponse("Cannot delete your own account", 400)
    }

    // Delete user and related records
    await prisma.user.delete({
      where: { id: userId }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DELETE_USER",
        details: {
          userName: existingUser.name,
          userRole: existingUser.role
        },
        userId: user.id
      }
    })

    return createSuccessResponse(null, "User deleted successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user"
    console.error("Error deleting user:", error)
    return createErrorResponse(errorMessage)
  }
})
