import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('Checking current data structure...');

  const pegawai = await prisma.user.findMany({
    where: { role: 'PEGAWAI' },
    select: {
      name: true,
      wilayah: true,
      jabatan: true,
      unitKerja: {
        select: {
          nama: true,
          jenjang: true,
        },
      },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  console.log('\nSample pegawai data:');
  for (const p of pegawai) {
    const unitKerjaLabel = p.unitKerja ? `${p.unitKerja.nama} (${p.unitKerja.jenjang})` : 'No unit kerja';
    console.log(`- ${p.name}: ${unitKerjaLabel} | wilayah=${p.wilayah || 'N/A'} | jabatan=${p.jabatan || 'N/A'}`);
  }

  const unitKerjaStats = await prisma.unitKerja.findMany({
    select: {
      nama: true,
      wilayah: true,
      _count: {
        select: {
          pegawai: true,
        },
      },
    },
    orderBy: {
      pegawai: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  console.log('\nTop unit kerja by pegawai count:');
  for (const unit of unitKerjaStats) {
    console.log(`- ${unit.nama} (${unit.wilayah}): ${unit._count.pegawai} pegawai`);
  }

  const summary = {
    users: await prisma.user.count(),
    unitKerja: await prisma.unitKerja.count(),
    proposals: await prisma.promotionProposal.count(),
    documents: await prisma.proposalDocument.count(),
    timelines: await prisma.timeline.count(),
  };

  console.log('\nSummary counts:');
  console.table(summary);
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
