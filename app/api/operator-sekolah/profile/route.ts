import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verifikasi role operator sekolah
    if (session.user.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ambil data user terlebih dahulu tanpa include untuk debug
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      console.log('User not found with ID:', session.user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Found user:', { id: user.id, name: user.name, role: user.role, unitKerja: user.unitKerja })

    // Coba ambil unit kerja jika ada unitKerjaId
    let unitKerjaInfo = null
    if (user.unitKerjaId) {
      try {
        unitKerjaInfo = await prisma.unitKerja.findUnique({
          where: { id: user.unitKerjaId },
          select: {
            nama: true,
            wilayah: true
          }
        })
      } catch (unitKerjaError) {
        console.log('Error fetching unit kerja:', unitKerjaError)
        // Continue without unit kerja relation
      }
    }

    const profile = {
      id: user.id,
      nip: user.nip || '',
      nama: user.name || '', // Field di database adalah 'name'
      email: user.email,
      noHp: user.phone, // Field di database adalah 'phone'
      jabatan: user.jabatan || '',
      unitKerja: unitKerjaInfo?.nama || user.unitKerja || '',
      golongan: user.golongan || '',
      alamat: user.address, // Field di database adalah 'address'
      statusKepegawaian: user.statusKepegawaian || '',
      jenisKelamin: user.jenisKelamin || '',
      pendidikanTerakhir: user.pendidikanTerakhir,
      // Field yang tidak ada di database - berikan nilai default
      tanggalLahir: null,
      tempatLahir: '',
      statusPerkawinan: '',
      agama: '',
      tanggalMasukKerja: user.tanggalMasukKerja,
      masaKerja: user.masaKerja,
      wilayah: unitKerjaInfo?.wilayah || user.wilayah,
      unitKerjaId: user.unitKerjaId,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      nama,
      email,
      noHp,
      alamat,
      pendidikanTerakhir
    } = body

    // Validasi data yang diperlukan
    if (!nama?.trim()) {
      return NextResponse.json(
        { message: 'Nama wajib diisi' },
        { status: 400 }
      )
    }

    // Validasi email jika diisi
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Update profil user - hanya field yang ada di database
    const updateData: Record<string, unknown> = {
      name: nama.trim(), // Field di database adalah 'name'
      email: email || null,
      phone: noHp || null, // Field di database adalah 'phone'
      address: alamat || null, // Field di database adalah 'address'
      updatedAt: new Date()
    }

    // Field yang ada di database tapi optional
    if (pendidikanTerakhir !== undefined) updateData.pendidikanTerakhir = pendidikanTerakhir || null

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    })

    // Coba ambil unit kerja jika ada unitKerjaId
    let unitKerjaInfo = null
    if (updatedUser.unitKerjaId) {
      try {
        unitKerjaInfo = await prisma.unitKerja.findUnique({
          where: { id: updatedUser.unitKerjaId },
          select: {
            nama: true,
            wilayah: true
          }
        })
      } catch (unitKerjaError) {
        console.log('Error fetching unit kerja during update:', unitKerjaError)
      }
    }

    // Log aktivitas
    try {        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            action: 'UPDATE_PROFILE',
            description: `User ${updatedUser.name} memperbarui profil`,
            metadata: {
              changedFields: Object.keys(body),
              userRole: session.user.role
            }
          }
        })
    } catch (logError) {
      console.error('Error creating activity log:', logError)
      // Tidak perlu menggagalkan request jika log gagal
    }

    const profile = {
      id: updatedUser.id,
      nip: updatedUser.nip || '',
      nama: updatedUser.name || '', // Field di database adalah 'name'
      email: updatedUser.email,
      noHp: updatedUser.phone, // Field di database adalah 'phone'
      jabatan: updatedUser.jabatan || '',
      unitKerja: unitKerjaInfo?.nama || updatedUser.unitKerja || '',
      golongan: updatedUser.golongan || '',
      alamat: updatedUser.address, // Field di database adalah 'address'
      statusKepegawaian: updatedUser.statusKepegawaian || '',
      jenisKelamin: updatedUser.jenisKelamin || '',
      pendidikanTerakhir: updatedUser.pendidikanTerakhir,
      // Field yang tidak ada di database - berikan nilai default
      tanggalLahir: null,
      tempatLahir: '',
      statusPerkawinan: '',
      agama: '',
      tanggalMasukKerja: updatedUser.tanggalMasukKerja,
      masaKerja: updatedUser.masaKerja,
      wilayah: unitKerjaInfo?.wilayah || updatedUser.wilayah,
      unitKerjaId: updatedUser.unitKerjaId,
      role: updatedUser.role,
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      profile
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh user lain' },
          { status: 400 }
        )
      }
    return NextResponse.json(
      { message: 'Database error occurred' },
      { status: 500 }
    )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
