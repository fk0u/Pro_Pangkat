import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

// This endpoint is accessible by all authenticated users
export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Query conditions based on user role
    let whereCondition: Record<string, unknown> = {};
    if (user.role !== "ADMIN") {
      whereCondition.isActive = true;
      // Build OR for jabatanType and wilayah
      const orArr: any[] = [];
      if (user.role === "PEGAWAI" && user.jenisJabatan) {
        orArr.push(
          { jabatanType: user.jenisJabatan.toLowerCase(), ...(user.wilayah ? { wilayah: user.wilayah } : {}) },
          { jabatanType: "all", ...(user.wilayah ? { wilayah: user.wilayah } : {}) }
        );
      }
      // Fallback: jika bukan pegawai, filter by wilayah saja
      if (user.wilayah) {
        orArr.push(
          { wilayah: user.wilayah },
          { wilayah: null }
        );
      }
      if (orArr.length > 0) {
        whereCondition.OR = orArr;
      }
    }

    // Ambil data timeline dari database
    const timelines = await prisma.timeline.findMany({
      where: whereCondition,
      orderBy: [
        { priority: "desc" },
        { startDate: "asc" }
      ]
    });

    // Transformasi data agar frontend selalu dapat array of object dengan field yang konsisten
    const transformedTimelines = timelines.map(timeline => ({
      id: timeline.id,
      title: timeline.title,
      description: timeline.description,
      startDate: timeline.startDate ? timeline.startDate.toISOString() : null,
      endDate: timeline.endDate ? timeline.endDate.toISOString() : null,
      isActive: timeline.isActive,
      priority: timeline.priority,
      jabatanType: timeline.jabatanType,
      wilayah: timeline.wilayah,
      wilayahInfo: timeline.wilayah ? {
        nama: timeline.wilayah,
        namaLengkap: formatWilayahName(timeline.wilayah)
      } : null
    }));

    // Agar frontend kompatibel, response data harus array, bukan object dengan property data
    // Jika frontend expect array langsung, return array saja
    // Jika frontend expect object, pastikan property data adalah array
    // Solusi: cek jika data: { ... } (object), ganti jadi array
    return new Response(JSON.stringify(transformedTimelines), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: unknown) {
    console.error("Error fetching timelines:", error);
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
