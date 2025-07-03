import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/auth';
import { Prisma, Wilayah } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const wilayah = searchParams.get('wilayah') || '';
    const jenjang = searchParams.get('jenjang') || '';

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Prisma.UnitKerjaWhereInput = {};

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { npsn: { contains: search, mode: 'insensitive' } },
        { alamat: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (wilayah) {
      where.wilayah = wilayah as Wilayah;
    }

    if (jenjang) {
      where.jenjang = jenjang;
    }

    const [unitKerja, total] = await Promise.all([
      prisma.unitKerja.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              pegawai: true
            }
          }
        },
        orderBy: {
          nama: 'asc'
        }
      }),
      prisma.unitKerja.count({ where })
    ]);

    return NextResponse.json({
      data: unitKerja,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: unknown) {
    console.error('Get unit kerja error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nama,
      npsn,
      jenjang,
      wilayah,
      alamat,
      kepalaSekolah,
      telepon,
      email,
      website
    } = body;

    // Validasi required fields
    if (!nama || !wilayah) {
      return NextResponse.json(
        { error: 'Nama dan Wilayah wajib diisi' },
        { status: 400 }
      );
    }

    // Check if nama already exists
    const existingNama = await prisma.unitKerja.findUnique({
      where: { nama }
    });

    if (existingNama) {
      return NextResponse.json(
        { error: 'Nama Unit Kerja sudah terdaftar' },
        { status: 400 }
      );
    }

    // Check if NPSN already exists (if provided)
    if (npsn) {
      const existingNpsn = await prisma.unitKerja.findUnique({
        where: { npsn }
      });

      if (existingNpsn) {
        return NextResponse.json(
          { error: 'NPSN sudah terdaftar' },
          { status: 400 }
        );
      }
    }

    const unitKerja = await prisma.unitKerja.create({
      data: {
        nama,
        npsn,
        jenjang,
        wilayah: wilayah as Wilayah,
        alamat,
        kepalaSekolah,
        telepon,
        email,
        website
      },
      include: {
        _count: {
          select: {
            pegawai: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Unit Kerja berhasil ditambahkan',
      data: unitKerja
    });

  } catch (error: unknown) {
    console.error('Create unit kerja error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID Unit Kerja tidak ditemukan' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      nama,
      npsn,
      jenjang,
      wilayah,
      alamat,
      kepalaSekolah,
      telepon,
      email,
      website
    } = body;

    // Check if unit kerja exists
    const existingUnitKerja = await prisma.unitKerja.findUnique({
      where: { id }
    });

    if (!existingUnitKerja) {
      return NextResponse.json(
        { error: 'Unit Kerja tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if nama already exists (exclude current unit kerja)
    if (nama && nama !== existingUnitKerja.nama) {
      const existingNama = await prisma.unitKerja.findFirst({
        where: {
          nama,
          id: { not: id }
        }
      });

      if (existingNama) {
        return NextResponse.json(
          { error: 'Nama Unit Kerja sudah terdaftar' },
          { status: 400 }
        );
      }
    }

    // Check if NPSN already exists (exclude current unit kerja)
    if (npsn && npsn !== existingUnitKerja.npsn) {
      const existingNpsn = await prisma.unitKerja.findFirst({
        where: {
          npsn,
          id: { not: id }
        }
      });

      if (existingNpsn) {
        return NextResponse.json(
          { error: 'NPSN sudah terdaftar' },
          { status: 400 }
        );
      }
    }

    const updatedUnitKerja = await prisma.unitKerja.update({
      where: { id },
      data: {
        nama,
        npsn,
        jenjang,
        wilayah: wilayah as Wilayah,
        alamat,
        kepalaSekolah,
        telepon,
        email,
        website
      },
      include: {
        _count: {
          select: {
            pegawai: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Unit Kerja berhasil diperbarui',
      data: updatedUnitKerja
    });

  } catch (error: unknown) {
    console.error('Update unit kerja error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID Unit Kerja tidak ditemukan' },
        { status: 400 }
      );
    }

    // Check if unit kerja exists
    const existingUnitKerja = await prisma.unitKerja.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pegawai: true
          }
        }
      }
    });

    if (!existingUnitKerja) {
      return NextResponse.json(
        { error: 'Unit Kerja tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if unit kerja has users
    if (existingUnitKerja._count.pegawai > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus Unit Kerja yang masih memiliki pegawai' },
        { status: 400 }
      );
    }

    await prisma.unitKerja.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Unit Kerja berhasil dihapus'
    });

  } catch (error: unknown) {
    console.error('Delete unit kerja error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + errorMessage },
      { status: 500 }
    );
  }
}
