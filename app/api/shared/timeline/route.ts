import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

// This endpoint is accessible by all authenticated users
export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Different query conditions based on user role
    const whereCondition: Record<string, unknown> = user.role === "ADMIN" 
      ? {} // Admins can see all timelines
      : { isActive: true }; // Non-admins only see active timelines
    
    // For non-admin users, add additional filters
    if (user.role !== "ADMIN") {
      const orConditions = [];
      
      // For PEGAWAI, add jabatanType conditions
      if (user.role === "PEGAWAI" && user.jenisJabatan) {
        orConditions.push(
          { jabatanType: user.jenisJabatan.toLowerCase() },
          { jabatanType: "all" }
        );
      } else {
        // For other roles, still include 'all' jabatanType
        orConditions.push({ jabatanType: "all" });
      }
      
      // Add wilayah conditions if applicable
      if (user.wilayah) {
        orConditions.push(
          { wilayah: user.wilayah },
          { wilayah: null } // Include global timelines too
        );
      } else {
        orConditions.push({ wilayah: null });
      }
      
      // Only add OR conditions if we have any
      if (orConditions.length > 0) {
        whereCondition.OR = orConditions;
      }
    }

    console.log(`[SHARED TIMELINE API] Query conditions for role ${user.role}:`, JSON.stringify(whereCondition));

    const timelines = await prisma.timeline.findMany({
      where: whereCondition,
      orderBy: [
        { priority: "desc" },
        { startDate: "asc" }
      ]
    });

    // Transform timeline data with additional computed fields
    const transformedTimelines = timelines.map(timeline => ({
      ...timeline,
      startDate: timeline.startDate ? timeline.startDate.toISOString() : null,
      endDate: timeline.endDate ? timeline.endDate.toISOString() : null,
      createdAt: timeline.createdAt.toISOString(),
      updatedAt: timeline.updatedAt.toISOString(),
      // Compute status
      status: timeline.isActive ? 'active' : 
              new Date(timeline.endDate) < new Date() ? 'expired' : 
              new Date(timeline.startDate) > new Date() ? 'upcoming' : 'completed',
      // Days remaining
      daysRemaining: Math.ceil((timeline.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      // Add wilayah info
      wilayahInfo: timeline.wilayah ? {
        nama: timeline.wilayah,
        namaLengkap: formatWilayahName(timeline.wilayah)
      } : null
    }));

    console.log(`[SHARED TIMELINE API] Found ${transformedTimelines.length} timelines for user role: ${user.role}`);

    // Always return array format for consistency
    return createSuccessResponse({
      data: transformedTimelines,
      total: transformedTimelines.length,
      message: transformedTimelines.length > 0 
        ? `Berhasil memuat ${transformedTimelines.length} timeline`
        : "Belum ada timeline yang tersedia untuk role dan wilayah Anda"
    });
  } catch (error: unknown) {
    console.error("[SHARED TIMELINE API] Error fetching timelines:", error);
    return createErrorResponse("Gagal memuat timeline. Silakan coba lagi.", 500);
  }
});

// Helper function to format wilayah names
function formatWilayahName(wilayahCode: string): string {
  const wilayahMap: Record<string, string> = {
    'BALIKPAPAN_PPU': 'Balikpapan & PPU',
    'KUTIM_BONTANG': 'Kutai Timur & Bontang',
    'KUKAR': 'Kutai Kartanegara',
    'KUBAR_MAHULU': 'Kutai Barat & Mahulu',
    'PASER': 'Paser',
    'BERAU': 'Berau',
    'SAMARINDA': 'Samarinda',
  };
  
  return wilayahMap[wilayahCode] || wilayahCode;
}
