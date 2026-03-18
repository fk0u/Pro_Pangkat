"use server"

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface ImportPegawaiItem {
  nip: string
  nama: string
  email: string
  golongan: string
  tmtJabatan: string
  unitKerja: string
  phone: string
  address: string
}

export async function POST(req: NextRequest) {
  try {
    // Verify session
    const session = await getSession()
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" }, 
        { status: 401 }
      )
    }

    // Only operator sekolah can import staff
    if (!session.user || session.user.role !== "OPERATOR_SEKOLAH") {
      return NextResponse.json(
        { success: false, message: "Forbidden" }, 
        { status: 403 }
      )
    }

    // Get user's unit kerja for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerjaId: true, unitKerja: true }
    })

    if (!user || !user.unitKerjaId) {
      return NextResponse.json(
        { success: false, message: "Operator tidak terkait dengan Unit Kerja" },
        { status: 400 }
      )
    }

    // Get unit kerja details
    const unitKerja = await prisma.unitKerja.findUnique({
      where: { id: user.unitKerjaId },
      select: { id: true, nama: true }
    })

    if (!unitKerja) {
      return NextResponse.json(
        { success: false, message: "Unit Kerja tidak ditemukan" },
        { status: 400 }
      )
    }

    // Parse request body
    const { pegawaiData } = await req.json()
    
    if (!Array.isArray(pegawaiData) || pegawaiData.length === 0) {
      return NextResponse.json(
        { success: false, message: "Format data tidak valid" },
        { status: 400 }
      )
    }

    // Results tracking
    const results = {
      success: [] as string[],
      failed: [] as { nip: string; reason: string }[],
      totalSuccess: 0,
      totalFailed: 0,
    }

    // Process each pegawai
    for (const item of pegawaiData as ImportPegawaiItem[]) {
      try {
        // Validate required fields
        if (!item.nip || !item.nama) {
          results.failed.push({
            nip: item.nip || "Unknown",
            reason: "NIP dan Nama wajib diisi"
          })
          results.totalFailed++
          continue
        }

        // Check if pegawai already exists
        const existingUser = await prisma.user.findFirst({
          where: { nip: item.nip }
        })

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: item.nama,
              email: item.email || existingUser.email,
              golongan: item.golongan || existingUser.golongan,
              tmtGolongan: item.tmtJabatan ? new Date(item.tmtJabatan) : existingUser.tmtGolongan,
              phone: item.phone || existingUser.phone,
              address: item.address || existingUser.address,
              unitKerjaId: user.unitKerjaId,
            }
          })
          results.success.push(item.nip)
          results.totalSuccess++
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              nip: item.nip,
              name: item.nama,
              email: item.email || null,
              password: item.nip, // Default password is NIP
              role: "PEGAWAI",
              golongan: item.golongan || null,
              tmtGolongan: item.tmtJabatan ? new Date(item.tmtJabatan) : null,
              unitKerjaId: user.unitKerjaId,
              phone: item.phone || null,
              address: item.address || null,
              jenisJabatan: "PNS", // Default
              jabatan: "Guru", // Default
              mustChangePassword: true,
            }
          })
          results.success.push(item.nip)
          results.totalSuccess++
        }
      } catch (error) {
        console.error(`Error processing pegawai ${item.nip}:`, error)
        results.failed.push({
          nip: item.nip || "Unknown",
          reason: "Error sistem: " + (error instanceof Error ? error.message : "Unknown error")
        })
        results.totalFailed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${results.totalSuccess} berhasil, ${results.totalFailed} gagal`,
      results
    })
  } catch (error) {
    console.error("Error importing pegawai data:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Terjadi kesalahan saat mengimpor data",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
