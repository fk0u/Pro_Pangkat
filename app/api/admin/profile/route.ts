import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        jabatan: true,
        golongan: true,
        jenisJabatan: true,
        wilayah: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
        unitKerjaId: true
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }
    // fetch unitKerja name
    let unitKerjaName = ''
    if (user.unitKerjaId) {
      const uk = await prisma.unitKerja.findUnique({
        where: { id: user.unitKerjaId },
        select: { nama: true }
      })
      unitKerjaName = uk?.nama || ''
    }

    // Minimal profile data (statistics and activities disabled temporarily)
    const profile = { statistics: { totalHandledProposals: 0, totalUnitKerja: 0, totalPegawai: 0, workStats: [] }, activities: [],
      id: user.id,
      nip: user.nip || '',
      nama: user.name || '',
      email: user.email || '',
      noHp: user.phone || '',
      alamat: user.address || '',
      jabatan: user.jabatan || '',
      golongan: user.golongan || '',
      jenisJabatan: user.jenisJabatan || '',
      unitKerja: unitKerjaName,
      wilayah: user.wilayah || '',
      profilePictureUrl: user.profilePictureUrl || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json({ success: true, profile })

  } catch (error) {
    console.error('Error fetching operator profile:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      nama, 
      email, 
      noHp, 
      alamat, 
      password,
      jabatan,
      golongan 
    } = body

    // Validate required fields
    if (!nama?.trim()) {
      return NextResponse.json({ 
        error: 'Nama tidak boleh kosong' 
      }, { status: 400 })
    }

    // Check if email is already used by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json({ 
          error: 'Email sudah digunakan oleh user lain' 
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      name: nama.trim(),
      email: email || null,
      phone: noHp || null,
      address: alamat || null,
      jabatan: jabatan || null,
      golongan: golongan || null,
      updatedAt: new Date()
    }

    // Hash password if provided
    if (password && password.length >= 6) {
      updateData.password = await hashPassword(password)
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        jabatan: true,
        golongan: true,
        jenisJabatan: true,
        wilayah: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
        unitKerjaId: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: { userId: session.user.id, action: 'UPDATE_PROFILE', details: JSON.stringify({ changedFields: Object.keys(body), userRole: 'ADMIN' }) }
    })

    // fetch unitKerja name
    let newUnitKerjaName = ''
    if (updatedUser.unitKerjaId) {
      const uk = await prisma.unitKerja.findUnique({ where: { id: updatedUser.unitKerjaId }, select: { nama: true } })
      newUnitKerjaName = uk?.nama || ''
    }
    const profile = { statistics: { totalHandledProposals: 0, totalUnitKerja: 0, totalPegawai: 0, workStats: [] }, activities: [], id: updatedUser.id, nip: updatedUser.nip||'', nama: updatedUser.name||'', email:updatedUser.email||'', noHp:updatedUser.phone||'', alamat:updatedUser.address||'', jabatan:updatedUser.jabatan||'', golongan:updatedUser.golongan||'', jenisJabatan:updatedUser.jenisJabatan||'', unitKerja:newUnitKerjaName, wilayah:updatedUser.wilayah||'', profilePictureUrl:updatedUser.profilePictureUrl, createdAt:updatedUser.createdAt, updatedAt:updatedUser.updatedAt }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      profile
    })

  } catch (error) {
    console.error('Error updating operator profile:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
