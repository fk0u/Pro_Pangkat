import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { Prisma, Wilayah } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const unitKerjaId = searchParams.get('unitKerjaId') || '';
    const wilayah = searchParams.get('wilayah') || '';

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Prisma.UserWhereInput = {
      role: 'PEGAWAI'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (unitKerjaId) {
      where.unitKerjaId = unitKerjaId;
    }

    if (wilayah) {
      where.wilayah = wilayah as Wilayah;
    }

    const [pegawai, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          unitKerja: {
            select: {
              id: true,
              nama: true,
              jenjang: true,
              wilayah: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      data: pegawai,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: unknown) {
    console.error('Get pegawai error:', error);
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
      nip,
      name,
      email,
      golongan,
      jabatan,
      tmtJabatan,
      unitKerjaId,
      wilayah,
      phone,
      address
    } = body;

    // Validasi required fields
    if (!nip || !name) {
      return NextResponse.json(
        { error: 'NIP dan Nama wajib diisi' },
        { status: 400 }
      );
    }

    // Check if NIP already exists
    const existingUser = await prisma.user.findUnique({
      where: { nip }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'NIP sudah terdaftar' },
        { status: 400 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 400 }
        );
      }
    }

    // Generate default password from NIP
    const defaultPassword = nip;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Parse TMT Jabatan
    let parsedTmtJabatan = null;
    if (tmtJabatan) {
      parsedTmtJabatan = new Date(tmtJabatan);
      if (isNaN(parsedTmtJabatan.getTime())) {
        return NextResponse.json(
          { error: 'Format TMT Jabatan tidak valid' },
          { status: 400 }
        );
      }
    }

    const pegawai = await prisma.user.create({
      data: {
        nip,
        name,
        email: email || `${nip}@propangkat.local`,
        password: hashedPassword,
        role: 'PEGAWAI',
        golongan,
        jabatan,
        tmtJabatan: parsedTmtJabatan,
        unitKerjaId,
        wilayah,
        phone,
        address,
        mustChangePassword: true
      },
      include: {
        unitKerja: {
          select: {
            id: true,
            nama: true,
            jenjang: true,
            wilayah: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Pegawai berhasil ditambahkan',
      data: pegawai
    });

  } catch (error: unknown) {
    console.error('Create pegawai error:', error);
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
        { error: 'ID pegawai tidak ditemukan' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      nip,
      name,
      email,
      golongan,
      jabatan,
      tmtJabatan,
      unitKerjaId,
      wilayah,
      phone,
      address
    } = body;

    // Check if pegawai exists
    const existingPegawai = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingPegawai) {
      return NextResponse.json(
        { error: 'Pegawai tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if NIP already exists (exclude current user)
    if (nip && nip !== existingPegawai.nip) {
      const existingNip = await prisma.user.findFirst({
        where: {
          nip,
          id: { not: id }
        }
      });

      if (existingNip) {
        return NextResponse.json(
          { error: 'NIP sudah terdaftar' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists (exclude current user)
    if (email && email !== existingPegawai.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 400 }
        );
      }
    }

    // Parse TMT Jabatan
    let parsedTmtJabatan = null;
    if (tmtJabatan) {
      parsedTmtJabatan = new Date(tmtJabatan);
      if (isNaN(parsedTmtJabatan.getTime())) {
        return NextResponse.json(
          { error: 'Format TMT Jabatan tidak valid' },
          { status: 400 }
        );
      }
    }

    const updatedPegawai = await prisma.user.update({
      where: { id },
      data: {
        nip,
        name,
        email,
        golongan,
        jabatan,
        tmtJabatan: parsedTmtJabatan,
        unitKerjaId,
        wilayah,
        phone,
        address
      },
      include: {
        unitKerja: {
          select: {
            id: true,
            nama: true,
            jenjang: true,
            wilayah: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Pegawai berhasil diperbarui',
      data: updatedPegawai
    });

  } catch (error: unknown) {
    console.error('Update pegawai error:', error);
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
        { error: 'ID pegawai tidak ditemukan' },
        { status: 400 }
      );
    }

    // Check if pegawai exists
    const existingPegawai = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingPegawai) {
      return NextResponse.json(
        { error: 'Pegawai tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingPegawai.role !== 'PEGAWAI') {
      return NextResponse.json(
        { error: 'Hanya dapat menghapus user dengan role PEGAWAI' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Pegawai berhasil dihapus'
    });

  } catch (error: unknown) {
    console.error('Delete pegawai error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + errorMessage },
      { status: 500 }
    );
  }
}
