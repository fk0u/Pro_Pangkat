import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  email: z.string().email("Email tidak valid").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  jabatan: z.string().optional().nullable(),
  jenisJabatan: z.string().optional().nullable(),
  unitKerja: z.string().optional().nullable(),
  unitKerjaId: z.string().optional().nullable(),
  tmtGolongan: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        golongan: true,
        tmtGolongan: true,
        jabatan: true,
        jenisJabatan: true,
        unitKerja: true,
        unitKerjaId: true,
        wilayah: true,
        profilePictureUrl: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.errors }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        golongan: true,
        tmtGolongan: true,
        jabatan: true,
        jenisJabatan: true,
        unitKerja: true,
        unitKerjaId: true,
        wilayah: true,
        profilePictureUrl: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
