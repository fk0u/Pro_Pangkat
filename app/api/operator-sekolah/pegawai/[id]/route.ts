import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { hashPassword } from "@/lib/password"
import { z } from "zod"

const updatePegawaiSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  golongan: z.string().optional(),
  tmtGolongan: z.string().optional(),
  jabatan: z.string().optional(),
  jenisJabatan: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== "OPERATOR_SEKOLAH") {
      return NextResponse.json(
        { message: "Unauthorized - Operator Sekolah access required" },
        { status: 401 }
      )
    }

    const operatorSekolah = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!operatorSekolah?.unitKerja) {
      return NextResponse.json(
        { message: "Unit kerja tidak ditemukan" },
        { status: 400 }
      )
    }

    const pegawai = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: "PEGAWAI",
        unitKerja: operatorSekolah.unitKerja,
      },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        golongan: true,
        tmtGolongan: true,
        jabatan: true,
        jenisJabatan: true,
        phone: true,
        address: true,
        unitKerja: true,
        wilayah: true,
        createdAt: true,
        updatedAt: true,
        proposals: {
          select: {
            id: true,
            periode: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      }
    })

    if (!pegawai) {
      return NextResponse.json(
        { message: "Pegawai tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(pegawai, { status: 200 })
  } catch (error) {
    console.error("Get pegawai detail error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== "OPERATOR_SEKOLAH") {
      return NextResponse.json(
        { message: "Unauthorized - Operator Sekolah access required" },
        { status: 401 }
      )
    }

    const operatorSekolah = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!operatorSekolah?.unitKerja) {
      return NextResponse.json(
        { message: "Unit kerja tidak ditemukan" },
        { status: 400 }
      )
    }

    // Check if pegawai exists and belongs to same unit kerja
    const existingPegawai = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: "PEGAWAI",
        unitKerja: operatorSekolah.unitKerja,
      }
    })

    if (!existingPegawai) {
      return NextResponse.json(
        { message: "Pegawai tidak ditemukan" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const parsed = updatePegawaiSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.errors },
        { status: 400 }
      )
    }

    const { password, tmtGolongan, ...updateData } = parsed.data

    // Prepare update data
    const dataToUpdate: any = {
      ...updateData,
      ...(tmtGolongan && { tmtGolongan: new Date(tmtGolongan) }),
    }

    // Hash password if provided
    if (password) {
      dataToUpdate.password = await hashPassword(password)
      dataToUpdate.mustChangePassword = true
    }

    // Update pegawai
    const updatedPegawai = await prisma.user.update({
      where: { id: params.id },
      data: dataToUpdate,
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        golongan: true,
        tmtGolongan: true,
        jabatan: true,
        jenisJabatan: true,
        phone: true,
        address: true,
        unitKerja: true,
        updatedAt: true,
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "UPDATE_PEGAWAI",
        details: {
          pegawaiId: updatedPegawai.id,
          pegawaiName: updatedPegawai.name,
          pegawaiNip: updatedPegawai.nip,
          updatedFields: Object.keys(updateData),
        },
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      message: "Pegawai berhasil diperbarui",
      pegawai: updatedPegawai
    }, { status: 200 })
  } catch (error) {
    console.error("Update pegawai error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== "OPERATOR_SEKOLAH") {
      return NextResponse.json(
        { message: "Unauthorized - Operator Sekolah access required" },
        { status: 401 }
      )
    }

    const operatorSekolah = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!operatorSekolah?.unitKerja) {
      return NextResponse.json(
        { message: "Unit kerja tidak ditemukan" },
        { status: 400 }
      )
    }

    // Check if pegawai exists and belongs to same unit kerja
    const existingPegawai = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: "PEGAWAI",
        unitKerja: operatorSekolah.unitKerja,
      }
    })

    if (!existingPegawai) {
      return NextResponse.json(
        { message: "Pegawai tidak ditemukan" },
        { status: 404 }
      )
    }

    // Check if pegawai has active proposals
    const activeProposals = await prisma.promotionProposal.count({
      where: {
        pegawaiId: params.id,
        status: {
          notIn: ["SELESAI", "DITOLAK", "DITARIK"]
        }
      }
    })

    if (activeProposals > 0) {
      return NextResponse.json(
        { message: "Tidak dapat menghapus pegawai yang memiliki usulan aktif" },
        { status: 400 }
      )
    }

    // Delete pegawai
    await prisma.user.delete({
      where: { id: params.id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DELETE_PEGAWAI",
        details: {
          pegawaiId: existingPegawai.id,
          pegawaiName: existingPegawai.name,
          pegawaiNip: existingPegawai.nip,
        },
        userId: session.user.id,
      }
    })

    return NextResponse.json({
      message: "Pegawai berhasil dihapus"
    }, { status: 200 })
  } catch (error) {
    console.error("Delete pegawai error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
