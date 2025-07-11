import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { z } from 'zod'

const createPegawaiSchema = z.object({
  nip: z.string().min(1, "NIP is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  golongan: z.string().optional(),
  tmtGolongan: z.string().optional(),
  jabatan: z.string().optional(),
  jenisJabatan: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's unit kerja for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 400 })
    }

    // Extract unitKerja ID based on whether it's a string or an object
    let unitKerjaId = null;
    if (typeof user.unitKerja === 'string') {
      // Try to find the unitKerja by name
      const unitKerjaByName = await prisma.unitKerja.findFirst({
        where: { nama: user.unitKerja },
        select: { id: true }
      });
      unitKerjaId = unitKerjaByName?.id;
    } else if (typeof user.unitKerja === 'object' && user.unitKerja !== null) {
      // If it's already an object with an ID
      unitKerjaId = (user.unitKerja as { id: string }).id;
    }

    if (!unitKerjaId) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Get search params for pagination and filtering
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const statusParam = url.searchParams.get('status') || ''
    const offset = (page - 1) * limit

    // Build where clause
    // Build where clause with optional search and status filters
    const whereClause: Record<string, unknown> = {
      role: "PEGAWAI",
      unitKerjaId: unitKerjaId,
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { nip: { contains: search, mode: 'insensitive' as const } },
        { jabatan: { contains: search, mode: 'insensitive' as const } },
      ]
    }
    // Apply status filter if provided
    if (statusParam && statusParam !== 'all') {
      whereClause.jenisJabatan = statusParam
    }

    // Get all pegawai in the same unit kerja with pagination
    const [pegawai, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
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
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({
        where: whereClause
      })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Get the unit kerja name
    const unitKerjaData = await prisma.unitKerja.findUnique({
      where: { id: unitKerjaId },
      select: { nama: true }
    });
    const unitKerjaNama = unitKerjaData?.nama || 'Unknown';

    return NextResponse.json({
      data: pegawai,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      unitKerja: unitKerjaNama,
    })
  } catch (error) {
    console.error('Pegawai API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createPegawaiSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.errors },
        { status: 400 }
      )
    }

    const { password, tmtGolongan, ...data } = parsed.data

    // Get user's unit kerja
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true, unitKerjaId: true, wilayah: true }
    })

    // Cari unitKerjaId jika belum ada
    let unitKerjaId = user?.unitKerjaId || null;
    if (!unitKerjaId && user?.unitKerja) {
      const unitKerjaObj = await prisma.unitKerja.findFirst({ where: { nama: user.unitKerja }, select: { id: true } });
      unitKerjaId = unitKerjaObj?.id || null;
    }

    if (!unitKerjaId) {
      return NextResponse.json({ message: 'Unit kerja tidak valid, silakan cek data operator sekolah.' }, { status: 400 })
    }

    // Check if NIP already exists
    const existingUser = await prisma.user.findUnique({
      where: { nip: data.nip }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'NIP sudah terdaftar' }, { status: 409 })
    }

    // Hash password - use provided password or default to NIP
    const defaultPassword = password || data.nip
    const hashedPassword = await hashPassword(defaultPassword)

    // Create new pegawai
    console.log('Creating pegawai with data:', {
      ...data,
      role: 'PEGAWAI',
      unitKerjaId,
      wilayah: user.wilayah,
      tmtGolongan: tmtGolongan
    });
    const newPegawai = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: 'PEGAWAI',
        unitKerjaId: unitKerjaId,
        wilayah: user.wilayah,
        tmtGolongan: tmtGolongan ? new Date(tmtGolongan) : null,
        mustChangePassword: true
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
        unitKerjaId: true,
        createdAt: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CREATE_PEGAWAI",
        details: {
          pegawaiId: newPegawai.id,
          pegawaiName: newPegawai.name,
          pegawaiNip: newPegawai.nip,
        },
        userId: session.user.id,
      }
    })

    return NextResponse.json({ 
      message: 'Pegawai berhasil ditambahkan',
      pegawai: newPegawai 
    }, { status: 201 })
  } catch (error: unknown) {
    // Detailed error logging and response
    console.error('Create pegawai error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
