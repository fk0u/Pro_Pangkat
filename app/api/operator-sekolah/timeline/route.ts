import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's wilayah for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wilayah: true, unitKerja: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Get timeline data that applies to this wilayah or is global
    const timelines = await prisma.timeline.findMany({
      where: {
        OR: [
          { wilayah: null }, // Global timelines
          { wilayah: user.wilayah } // Wilayah-specific timelines
        ]
      },
      orderBy: [
        { isActive: 'desc' },
        { priority: 'asc' },
        { startDate: 'asc' }
      ]
    })

    // Add computed fields for frontend
    const enrichedTimelines = timelines.map(timeline => ({
      ...timeline,
      startDate: timeline.startDate.toISOString(),
      endDate: timeline.endDate.toISOString(),
      createdAt: timeline.createdAt.toISOString(),
      updatedAt: timeline.updatedAt.toISOString(),
      // Compute status
      status: timeline.isActive ? 'active' : 
              new Date(timeline.endDate) < new Date() ? 'expired' : 
              new Date(timeline.startDate) > new Date() ? 'upcoming' : 'completed',
      // Days remaining
      daysRemaining: Math.ceil((timeline.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))

    return NextResponse.json({ 
      timelines: enrichedTimelines,
      wilayah: user.wilayah,
      unitKerja: user.unitKerja
    })
  } catch (error) {
    console.error('Timeline API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
