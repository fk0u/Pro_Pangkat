import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"
import { hashPassword } from "@/lib/password"

export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const users = await prisma.user.findMany({
      include: {
        unitKerja: {
          select: {
            id: true,
            nama: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform the data 
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email || "",
      role: user.role,
      unitKerja: user.unitKerja,
      wilayah: user.wilayahId ? user.wilayahId : user.wilayah,
      isActive: true, // Default to true if not available
      nip: user.nip || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    return createSuccessResponse(transformedUsers)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch users"
    console.error("Error fetching users:", error)
    return createErrorResponse(errorMessage)
  }
})

export const POST = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const body = await req.json()
    const { 
      name, 
      password, 
      role, 
      nip, 
      unitKerjaId, 
      wilayahId
    } = body

    // Validate required fields
    if (!name || !role || !nip) {
      return createErrorResponse("NIP, Nama, dan Role wajib diisi", 400)
    }

    // Default password if not provided
    const userPassword = password || "password123"

    // Check if NIP already exists
    const existingUserByNip = await prisma.user.findUnique({
      where: { nip }
    })

    if (existingUserByNip) {
      return createErrorResponse("NIP sudah terdaftar", 400)
    }

    // Hash password
    const hashedPassword = await hashPassword(userPassword)

    // Email from NIP (optional, can be null in schema)
    const email = `${nip}@example.com`

    // Create user with essential fields
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        nip,
        unitKerjaId: unitKerjaId || null,
        wilayahId: wilayahId || null,
        mustChangePassword: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CREATE_USER",
        details: {
          userName: newUser.name,
          userRole: newUser.role
        },
        userId: user.id
      }
    })

    return createSuccessResponse(newUser, "User created successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create user"
    console.error("Error creating user:", error)
    return createErrorResponse(errorMessage)
  }
})
