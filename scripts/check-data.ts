import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking current data structure...');
  
  // Check pegawai data
  const pegawai = await prisma.user.findMany({
    where: { role: 'PEGAWAI' },
    select: { 
      name: true, 
      unitKerja: true, 
      wilayah: true,
      jabatan: true
    },
    take: 5
  });
  
  console.log('\n📋 Sample pegawai data:');
  pegawai.forEach(p => {
    console.log(`- ${p.name}: ${p.unitKerja || 'No unit'} (${p.wilayah || 'No wilayah'})`);
  });
  
  // Check unique unit kerja
  const uniqueUnits = await prisma.user.groupBy({
    by: ['unitKerja'],
    where: { 
      role: 'PEGAWAI',
      unitKerja: { not: null }
    },
    _count: { id: true }
  });
  
  console.log('\n🏢 Unique unit kerja:');
  uniqueUnits.forEach(unit => {
    console.log(`- ${unit.unitKerja}: ${unit._count.id} pegawai`);
  });
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
