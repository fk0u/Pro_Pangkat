import { NextRequest } from "next/server";
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

interface ExternalSchoolData {
  npsn?: string | null;
  alamat?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bentukSekolah?: string | null;
  statusSekolah?: string | null;
  [key: string]: unknown;
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Hanya admin dan operator yang bisa mengakses endpoint ini
    if (user.role !== "ADMIN" && user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403);
    }

    // Dapatkan ID unit kerja dari URL
    const url = new URL(req.url);
    const unitKerjaId = url.pathname.split('/')[3];
    
    if (!unitKerjaId) {
      return createErrorResponse("Unit kerja ID tidak ditemukan", 400);
    }

    // Periksa apakah unit kerja ada
    const unitKerja = await prisma.unitKerja.findUnique({
      where: { id: unitKerjaId },
    });

    if (!unitKerja) {
      return createErrorResponse("Unit kerja tidak ditemukan", 404);
    }

    // Untuk operator, periksa apakah unit kerja berada di wilayahnya atau di wilayah anaknya
    if (user.role === "OPERATOR") {
      const operator = await prisma.user.findUnique({
        where: { id: user.id },
        select: { 
          wilayahId: true,
          wilayah: {
            select: {
              id: true,
              kode: true,
              level: true
            }
          }
        },
      });

      if (!operator || !operator.wilayahId) {
        return createErrorResponse("Data operator tidak lengkap", 403);
      }

      // Jika unit kerja dan operator memiliki wilayahId yang sama, izinkan akses
      if (operator.wilayahId === unitKerja.wilayahId) {
        // Akses diizinkan - wilayah sama persis
        console.log(`[API] Operator has direct access to this unit kerja (same wilayahId)`);
      } else {
        // Cek apakah unit kerja berada di bawah wilayah operator
        // Dapatkan informasi wilayah unit kerja
        const unitKerjaWilayah = await prisma.wilayah.findUnique({
          where: { id: unitKerja.wilayahId || "" },
          select: { id: true, kode: true, level: true, induk: true }
        });

        if (!unitKerjaWilayah) {
          return createErrorResponse("Data wilayah unit kerja tidak ditemukan", 404);
        }

        // Cek apakah wilayah unit kerja adalah anak dari wilayah operator
        // Cara 1: periksa kode wilayah dengan prefix matching
        // Contoh: Operator dengan kode "16" (Kota) harus bisa akses unit kerja dengan kode "16.01" (Kecamatan di kota tersebut)
        let hasAccess = false;
        
        if (operator.wilayah && unitKerjaWilayah.kode) {
          // Cek dengan prefix matching
          if (unitKerjaWilayah.kode.startsWith(operator.wilayah.kode)) {
            hasAccess = true;
            console.log(`[API] Operator has access to this unit kerja via prefix matching (parent-child relationship)`);
          } 
          // Cara 2: Cek apakah unitKerja berada di wilayah induk yang sama dengan operator
          // Untuk kasus seperti kota/kabupaten yang memiliki induk provinsi yang sama
          else if (unitKerjaWilayah.induk) {
            // Dapatkan wilayah induk dari operator
            const operatorParentWilayah = await prisma.wilayah.findFirst({
              where: { kode: operator.wilayah.kode },
              select: { induk: true }
            });
            
            // Cek apakah unit kerja dan operator memiliki induk yang sama
            if (operatorParentWilayah && operatorParentWilayah.induk === unitKerjaWilayah.induk) {
              hasAccess = true;
              console.log(`[API] Operator has access to this unit kerja via common parent relationship`);
            }
          }
          
          if (!hasAccess) {
            console.log(`[API] Permission denied. Operator wilayah: ${operator.wilayah.kode}, Unit kerja wilayah: ${unitKerjaWilayah.kode}`);
            // Alternatif: berikan akses bypass untuk perintah yang ditrigger oleh operasi sync
            // Cek header X-Sync-Operation yang biasanya dikirim dari fungsi syncSchoolData
            const isSyncOperation = req.headers.get('X-Sync-Operation') === 'true';
            
            if (isSyncOperation) {
              console.log(`[API] Allowing access because this is a sync operation triggered by the system`);
              // Lanjutkan eksekusi tanpa error
            } else {
              return createErrorResponse("Anda tidak memiliki izin akses pada unit kerja ini", 403);
            }
          }
        } else {
          return createErrorResponse("Data wilayah tidak lengkap", 403);
        }
      }
    }

    // Ambil data dari request body
    let data: ExternalSchoolData;
    try {
      data = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return createErrorResponse("Invalid request body format", 400);
    }

    // Validasi data yang diperlukan
    if (!data || typeof data !== 'object') {
      return createErrorResponse("Data tidak valid", 400);
    }
    
    // Pastikan data numerik valid
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    // Parse koordinat dengan aman
    try {
      if (data.latitude !== undefined && data.latitude !== null) {
        const parsedLat = typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude;
        latitude = !isNaN(parsedLat) ? parsedLat : null;
      }
      
      if (data.longitude !== undefined && data.longitude !== null) {
        const parsedLong = typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude;
        longitude = !isNaN(parsedLong) ? parsedLong : null;
      }
    } catch (parseError) {
      console.warn("Error parsing coordinates:", parseError);
      // Gunakan null jika parsing gagal
    }
    
    // Fungsi untuk membersihkan nilai string
    const cleanString = (value: unknown): string | null => {
      if (value === null || value === undefined) return null;
      const strValue = String(value).trim();
      return strValue === "" ? null : strValue;
    };

    // Siapkan data yang akan diupdate
    const updateData = {
      npsn: cleanString(data.npsn),
      alamat: cleanString(data.alamat),
      kecamatan: cleanString(data.kecamatan),
      kabupaten: cleanString(data.kabupaten),
      provinsi: cleanString(data.provinsi),
      latitude,
      longitude,
      bentukSekolah: cleanString(data.bentukSekolah),
      statusSekolah: cleanString(data.statusSekolah),
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    };

    // Log data yang akan diupdate
    console.log(`[API] Updating unit kerja ${unitKerjaId} with external data:`, updateData);

    // Update unit kerja dengan data eksternal dengan prisma transaction
    try {
      const updatedUnitKerja = await prisma.$transaction(async (tx) => {
        // Update unit kerja
        const updated = await tx.unitKerja.update({
          where: { id: unitKerjaId },
          data: updateData,
        });
        
        // Log aktivitas
        await tx.activityLog.create({
          data: {
            userId: user.id,
            action: "SYNC_SCHOOL_DATA",
            details: `Data sekolah untuk ${unitKerja.nama} disinkronkan dengan API eksternal`,
            entityId: unitKerjaId,
            entityType: "UNIT_KERJA",
          },
        });
        
        return updated;
      });
      
      return createSuccessResponse({
        message: "Data sekolah berhasil disinkronkan",
        unitKerja: updatedUnitKerja,
      });
    } catch (dbError) {
      console.error("Database error during sync:", dbError);
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      return createErrorResponse(`Gagal menyimpan data ke database: ${errorMessage}`, 500);
    }
  } catch (error: unknown) {
    console.error("Unexpected error syncing school data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Terjadi kesalahan tak terduga: ${errorMessage}`, 500);
  }
});
