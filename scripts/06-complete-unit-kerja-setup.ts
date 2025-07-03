import { PrismaClient } from '@prisma/client';
import seedUnitKerjaData from './04-seed-unit-kerja-data';
import seedProposalUnitKerja from './05-seed-proposal-unit-kerja';

const prisma = new PrismaClient();

async function setupUnitKerjaCompleteData() {
  console.log('🚀 Setting up complete Unit Kerja data for testing...\n');

  try {
    // Step 1: Seed Unit Kerja (Pegawai) Data
    console.log('📋 Step 1: Seeding Unit Kerja (Pegawai) Data...');
    await seedUnitKerjaData();
    console.log('✅ Unit Kerja data seeding completed!\n');

    // Step 2: Seed Proposal Data
    console.log('📋 Step 2: Seeding Proposal Data...');
    await seedProposalUnitKerja();
    console.log('✅ Proposal data seeding completed!\n');

    // Step 3: Verify data
    console.log('📋 Step 3: Verifying complete data...');
    
    const totalPegawai = await prisma.user.count({
      where: { role: 'PEGAWAI' }
    });

    const totalProposals = await prisma.promotionProposal.count();

    const uniqueUnitKerja = await prisma.user.groupBy({
      by: ['unitKerja'],
      where: { 
        role: 'PEGAWAI',
        unitKerja: { not: null }
      }
    });

    const wilayahDistribution = await prisma.user.groupBy({
      by: ['wilayah'],
      where: { 
        role: 'PEGAWAI',
        wilayah: { not: null }
      },
      _count: { id: true }
    });

    console.log('📊 Final Data Summary:');
    console.log(`   Total Pegawai: ${totalPegawai}`);
    console.log(`   Total Proposals: ${totalProposals}`);
    console.log(`   Unique Unit Kerja: ${uniqueUnitKerja.length}`);
    console.log('   Wilayah Distribution:');
    wilayahDistribution.forEach(w => {
      console.log(`     ${w.wilayah}: ${w._count.id} pegawai`);
    });

    console.log('\n🎯 Ready for Testing!');
    console.log('Now you can test the operator unit kerja page at:');
    console.log('http://localhost:3000/operator/unit-kerja');
    console.log('\nFeatures to test:');
    console.log('✅ Real data from database');
    console.log('✅ Search by unit kerja name');
    console.log('✅ Filter by jenjang (SD, SMP, SMA, SMK)');
    console.log('✅ Statistics per unit kerja');
    console.log('✅ Wilayah-based filtering');

  } catch (error) {
    console.error('❌ Error in complete setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupUnitKerjaCompleteData()
    .then(() => {
      console.log('\n🎉 Complete Unit Kerja setup finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

export default setupUnitKerjaCompleteData;
