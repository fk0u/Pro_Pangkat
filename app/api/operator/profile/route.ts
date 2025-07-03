import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
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
        unitKerja: true,
        wilayah: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Get work statistics
    const workStats = await prisma.promotionProposal.groupBy({
      by: ['status'],
      where: {
        pegawai: {
          wilayah: user.wilayah
        }
      },
      _count: {
        status: true
      }
    })

    // Get recent activities
    const recentActivities = await prisma.activityLog.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true
      }
    })

    // Calculate total handled proposals
    const totalHandledProposals = await prisma.promotionProposal.count({
      where: {
        pegawai: {
          wilayah: user.wilayah
        }
      }
    })

    // Get unit kerja count in wilayah
    const totalUnitKerja = await prisma.unitKerja.count({
      where: {
        wilayah: user.wilayah
      }
    })

    // Get pegawai count in wilayah
    const totalPegawai = await prisma.user.count({
      where: {
        role: 'PEGAWAI',
        wilayah: user.wilayah
      }
    })

    const profile = {
      id: user.id,
      nip: user.nip || '',
      nama: user.name || '',
      email: user.email || '',
      noHp: user.phone || '',
      alamat: user.address || '',
      jabatan: user.jabatan || '',
      golongan: user.golongan || '',
      jenisJabatan: user.jenisJabatan || '',
      unitKerja: user.unitKerja || '',
      wilayah: user.wilayah || '',
      profilePictureUrl: user.profilePictureUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      statistics: {
        totalHandledProposals,
        totalUnitKerja,
        totalPegawai,
        workStats: workStats.map(stat => ({
          status: stat.status,
          count: stat._count.status
        }))
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        createdAt: activity.createdAt
      }))
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Error fetching operator profile:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR') {
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
        unitKerja: true,
        wilayah: true,
        profilePictureUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_PROFILE',
        details: `Operator ${updatedUser.name} memperbarui profil`,
        metadata: {
          changedFields: Object.keys(body),
          userRole: 'OPERATOR'
        }
      }
    })

    const profile = {
      id: updatedUser.id,
      nip: updatedUser.nip || '',
      nama: updatedUser.name || '',
      email: updatedUser.email || '',
      noHp: updatedUser.phone || '',
      alamat: updatedUser.address || '',
      jabatan: updatedUser.jabatan || '',
      golongan: updatedUser.golongan || '',
      jenisJabatan: updatedUser.jenisJabatan || '',
      unitKerja: updatedUser.unitKerja || '',
      wilayah: updatedUser.wilayah || '',
      profilePictureUrl: updatedUser.profilePictureUrl,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    }

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
