import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { Wilayah } from '@prisma/client';

// Interface untuk data Excel Unit Kerja
interface ExcelUnitKerjaData {
  'No'?: string | number;
  'Nama Unit Kerja'?: string;
  'NPSN'?: string | number;
  'Jenjang'?: string;
  'Wilayah'?: string;
  'Alamat'?: string;
  'Kepala Sekolah'?: string;
  'Telepon'?: string | number;
  'Email'?: string;
  'Website'?: string;
  [key: string]: unknown;
}

// Mapping Nama Wilayah ke Enum
const wilayahMapping: { [key: string]: Wilayah } = {
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

export async function POST(req: NextRequest) {
  try {
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
    const requiredColumns = ['No', 'Nama Unit Kerja', 'Wilayah'];
    const firstRow = data[0] as ExcelUnitKerjaData;
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
      const row = data[i] as ExcelUnitKerjaData;
      const rowNumber = i + 2; // +2 karena Excel mulai dari 1 dan ada header

      try {
        // Validasi data wajib
        if (!row['Nama Unit Kerja']?.toString().trim()) {
          results.errors.push(`Baris ${rowNumber}: Nama Unit Kerja tidak boleh kosong`);
          results.failed++;
          continue;
        }

        if (!row['Wilayah']?.toString().trim()) {
          results.errors.push(`Baris ${rowNumber}: Wilayah tidak boleh kosong`);
          results.failed++;
          continue;
        }

        const namaUnitKerja = row['Nama Unit Kerja'].toString().trim();
        const wilayahNama = row['Wilayah'].toString().trim();

        // Cek apakah nama unit kerja sudah ada
        const existingUnitKerja = await prisma.unitKerja.findUnique({
          where: { nama: namaUnitKerja }
        });

        if (existingUnitKerja) {
          results.errors.push(`Baris ${rowNumber}: Unit Kerja "${namaUnitKerja}" sudah terdaftar`);
          results.failed++;
          continue;
        }

        // Mapping wilayah
        const wilayah = wilayahMapping[wilayahNama];
        if (!wilayah) {
          results.errors.push(`Baris ${rowNumber}: Wilayah "${wilayahNama}" tidak valid`);
          results.failed++;
          continue;
        }

        // Cek NPSN jika ada
        let npsn = null;
        if (row['NPSN']?.toString().trim()) {
          npsn = row['NPSN'].toString().trim();
          
          const existingNpsn = await prisma.unitKerja.findUnique({
            where: { npsn }
          });

          if (existingNpsn) {
            results.errors.push(`Baris ${rowNumber}: NPSN "${npsn}" sudah terdaftar`);
            results.failed++;
            continue;
          }
        }

        // Create unit kerja
        await prisma.unitKerja.create({
          data: {
            nama: namaUnitKerja,
            npsn: npsn,
            jenjang: row['Jenjang']?.toString().trim() || null,
            wilayah: wilayah,
            alamat: row['Alamat']?.toString().trim() || null,
            kepalaSekolah: row['Kepala Sekolah']?.toString().trim() || null,
            telepon: row['Telepon']?.toString().trim() || null,
            email: row['Email']?.toString().trim() || null,
            website: row['Website']?.toString().trim() || null
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
      message: 'Import Unit Kerja selesai',
      results: {
        total: data.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // Batasi error yang ditampilkan
        availableWilayah: Object.keys(wilayahMapping)
      }
    });

  } catch (error: unknown) {
    console.error('Import unit kerja error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengimpor data: ' + errorMessage },
      { status: 500 }
    );
  }
}
