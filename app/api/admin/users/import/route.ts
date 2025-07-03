import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { parseUserImportExcel, validateUserImportData } from "@/lib/excel-utils"
import { hashPassword } from "@/lib/password"
import prisma from "@/lib/prisma"
import { Role, type Wilayah } from "@prisma/client"

export const POST = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      // Check if user is admin
      if (user.role !== "ADMIN") {
        return createErrorResponse("Unauthorized", 403)
      }

      // Get form data
      const formData = await req.formData()
      const file = formData.get("file") as File

      if (!file) {
        return createErrorResponse("No file uploaded")
      }

      // Check file type
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        return createErrorResponse("Invalid file type. Only Excel files (.xlsx, .xls) are allowed.")
      }

      // Read file
      const buffer = Buffer.from(await file.arrayBuffer())

      // Parse Excel file
      const userData = parseUserImportExcel(buffer)

      // Validate data
      const validation = validateUserImportData(userData)
      if (!validation.valid) {
        return createErrorResponse(`Validation errors: ${validation.errors.join(", ")}`)
      }

      // Process users
      const results = await Promise.all(
        userData.map(async (user) => {
          try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { nip: user.nip },
            })

            // Default password is NIP
            const hashedPassword = await hashPassword(user.nip)

            if (existingUser) {
              // Update existing user
              const updatedUser = await prisma.user.update({
                where: { nip: user.nip },
                data: {
                  name: user.name,
                  email: user.email,
                  unitKerja: user.unitKerja,
                  wilayah: user.wilayah as Wilayah | undefined,
                  golongan: user.golongan,
                  jabatan: user.jabatan,
                  jenisJabatan: user.jenisJabatan,
                  role: user.role as Role | undefined,
                },
              })
              return { nip: user.nip, status: "updated" }
            } else {
              // Create new user
              const newUser = await prisma.user.create({
                data: {
                  nip: user.nip,
                  name: user.name,
                  email: user.email,
                  password: hashedPassword,
                  unitKerja: user.unitKerja,
                  wilayah: user.wilayah as Wilayah | undefined,
                  golongan: user.golongan,
                  jabatan: user.jabatan,
                  jenisJabatan: user.jenisJabatan,
                  role: (user.role as Role) || Role.PEGAWAI,
                  mustChangePassword: true,
                },
              })
              return { nip: user.nip, status: "created" }
            }
          } catch (error: any) {
            return { nip: user.nip, status: "error", message: error.message }
          }
        }),
      )

      // Count results
      const created = results.filter((r) => r.status === "created").length
      const updated = results.filter((r) => r.status === "updated").length
      const errors = results.filter((r) => r.status === "error").length

      return createSuccessResponse(
        { results, summary: { total: results.length, created, updated, errors } },
        `Import completed: ${created} created, ${updated} updated, ${errors} errors`,
      )
    } catch (error: any) {
      console.error("Error importing users:", error)
      return createErrorResponse(error.message || "Failed to import users")
    }
  },
  ["ADMIN"],
)

export const GET = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      // Check if user is admin
      if (user.role !== "ADMIN") {
        return createErrorResponse("Unauthorized", 403)
      }

      // Get all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          nip: true,
          name: true,
          email: true,
          role: true,
          unitKerja: true,
          wilayah: true,
          golongan: true,
          jabatan: true,
          jenisJabatan: true,
          createdAt: true,
        },
      })

      return createSuccessResponse(users)
    } catch (error: any) {
      console.error("Error fetching users:", error)
      return createErrorResponse(error.message || "Failed to fetch users")
    }
  },
  ["ADMIN"],
)
