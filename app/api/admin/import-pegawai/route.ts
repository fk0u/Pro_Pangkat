import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { Wilayah } from '@prisma/client';

// Interface untuk data Excel
interface ExcelRowData {
  'No'?: string | number;
  'Nama'?: string;
  'NIP'?: string | number;
  'Golongan'?: string;
  'Jabatan'?: string;
  'TMT Jabatan'?: string | number | Date;
  'Unit Kerja'?: string;
  'Cabang Dinas'?: string;
  [key: string]: unknown;
}

// Mapping Cabang Dinas ke Wilayah
const cabangDinasToWilayah: { [key: string]: string } = {
  'Kota Balikpapan': 'BALIKPAPAN_PPU',
  'Kabupaten Penajam Paser Utara': 'BALIKPAPAN_PPU', 
  'Kota Bontang': 'KUTIM_BONTANG',
  'Kabupaten Kutai Timur': 'KUTIM_BONTANG',
  'Kabupaten Kutai Kartanegara': 'KUKAR',
  'Kabupaten Kutai Barat': 'KUBAR_MAHULU',
  'Kabupaten Mahakam Ulu': 'KUBAR_MAHULU',
  'Kabupaten Paser': 'PASER',
  'Kabupaten Berau': 'BERAU',
  'Kota Samarinda': 'SAMARINDA'
};

// Mapping Unit Kerja
const getUnitKerjaByName = async (unitKerjaName: string) => {
  if (!unitKerjaName) return null;
  
  const unitKerja = await prisma.unitKerja.findFirst({
    where: {
      nama: {
        contains: unitKerjaName.trim(),
        mode: 'insensitive'
      }
    }
  });
  
  return unitKerja;
};

export async function POST(req: NextRequest) {
  try {
    // TODO: Add proper authentication check
    // const session = await getSession()
    // if (!session?.isLoggedIn || session.user?.role !== 'ADMIN') {
    //   return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    // }
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validasi tipe file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Format file harus Excel (.xlsx atau .xls)' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'File Excel kosong atau tidak valid' },
        { status: 400 }
      );
    }

    // Validasi kolom wajib
    const requiredColumns = ['No', 'Nama', 'NIP', 'Golongan', 'Jabatan', 'TMT Jabatan', 'Unit Kerja', 'Cabang Dinas'];
    const firstRow = data[0] as ExcelRowData;
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          error: `Kolom berikut tidak ditemukan: ${missingColumns.join(', ')}`,
          requiredColumns: requiredColumns
        },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as ExcelRowData;
      const rowNumber = i + 2; // +2 karena Excel mulai dari 1 dan ada header

      try {
        // Validasi data wajib
        if (!row['Nama']?.toString().trim()) {
          results.errors.push(`Baris ${rowNumber}: Nama tidak boleh kosong`);
          results.failed++;
          continue;
        }

        if (!row['NIP']?.toString().trim()) {
          results.errors.push(`Baris ${rowNumber}: NIP tidak boleh kosong`);
          results.failed++;
          continue;
        }

        // Validasi format NIP 18 digit
        const nipValue = row['NIP'].toString().trim();
        if (!/^\d{18}$/.test(nipValue)) {
          results.errors.push(`Baris ${rowNumber}: NIP harus berupa 18 digit angka (${nipValue})`);
          results.failed++;
          continue;
        }

        // Cek apakah NIP sudah ada
        const existingUser = await prisma.user.findUnique({
          where: { nip: nipValue }
        });

        if (existingUser) {
          results.errors.push(`Baris ${rowNumber}: NIP ${nipValue} sudah terdaftar`);
          results.failed++;
          continue;
        }

        // Get Unit Kerja
        let unitKerjaId = null;
        if (row['Unit Kerja']?.toString().trim()) {
          const unitKerja = await getUnitKerjaByName(row['Unit Kerja'].toString().trim());
          unitKerjaId = unitKerja?.id || null;
        }

        // Mapping Wilayah dari Cabang Dinas
        let wilayah = null;
        if (row['Cabang Dinas']?.toString().trim()) {
          const cabangDinas = row['Cabang Dinas'].toString().trim();
          wilayah = cabangDinasToWilayah[cabangDinas] || null;
        }

        // Parse TMT Jabatan
        let tmtJabatan = null;
        if (row['TMT Jabatan']) {
          const tmtValue = row['TMT Jabatan'];
          if (typeof tmtValue === 'number') {
            // Excel date serial number
            const excelDate = new Date((tmtValue - 25569) * 86400 * 1000);
            tmtJabatan = excelDate;
          } else if (typeof tmtValue === 'string') {
            const parsed = new Date(tmtValue);
            if (!isNaN(parsed.getTime())) {
              tmtJabatan = parsed;
            }
          }
        }

        // Generate email dari NIP
        const email = `${nipValue}@propangkat.local`;
        
        // Generate password default (bisa dari NIP atau password default)
        const defaultPassword = nipValue;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Create user
        await prisma.user.create({
          data: {
            nip: nipValue,
            name: row['Nama'].toString().trim(),
            email: email,
            password: hashedPassword,
            role: 'PEGAWAI',
            golongan: row['Golongan']?.toString().trim() || null,
            jabatan: row['Jabatan']?.toString().trim() || null,
            tmtJabatan: tmtJabatan,
            unitKerjaId: unitKerjaId,
            wilayah: wilayah as Wilayah | null,
            mustChangePassword: true
          }
        });

        results.success++;

      } catch (error: unknown) {
        console.error(`Error processing row ${rowNumber}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Baris ${rowNumber}: ${errorMessage}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: 'Import selesai',
      results: {
        total: data.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10) // Batasi error yang ditampilkan
      }
    });

  } catch (error: unknown) {
    console.error('Import pegawai error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengimpor data: ' + errorMessage },
      { status: 500 }
    );
  }
}
