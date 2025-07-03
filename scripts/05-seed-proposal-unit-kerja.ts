import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProposalUnitKerja() {
  console.log('🌱 Seeding Proposal data untuk Unit Kerja testing...');

  try {
    // Get some pegawai untuk dibuatkan proposal
    const pegawaiList = await prisma.user.findMany({
      where: { 
        role: 'PEGAWAI',
        unitKerja: { not: null }
      },
      select: { id: true, name: true, unitKerja: true, nip: true },
      take: 10
    });

    if (pegawaiList.length === 0) {
      console.log('⚠️  No pegawai found. Please run unit kerja seeding first.');
      return;
    }

    const proposalData = [];
    
    // Buat beberapa proposal dengan status yang berbeda
    const statusList = [
      'DIAJUKAN',
      'DIPROSES_OPERATOR', 
      'DISETUJUI_OPERATOR',
      'DIPROSES_ADMIN',
      'SELESAI',
      'DIKEMBALIKAN_OPERATOR',
      'PERLU_PERBAIKAN_DARI_DINAS'
    ];

    for (let i = 0; i < pegawaiList.length; i++) {
      const pegawai = pegawaiList[i];
      const status = statusList[i % statusList.length];
      
      // Proposal utama
      proposalData.push({
        periode: 'Agustus 2025',
        status: status,
        pegawaiId: pegawai.id,
        targetGolongan: 'IV/a',
        targetJabatan: 'Guru Madya',
        notes: `Proposal kenaikan pangkat untuk ${pegawai.name} dari ${pegawai.unitKerja}`,
        createdAt: new Date(2025, 6, Math.floor(Math.random() * 20) + 1), // Random date in July 2025
        updatedAt: new Date()
      });

      // Beberapa pegawai punya proposal tambahan (untuk testing multiple proposals)
      if (i % 3 === 0) {
        proposalData.push({
          periode: 'September 2025',
          status: 'DRAFT',
          pegawaiId: pegawai.id,
          targetGolongan: 'IV/b',
          targetJabatan: 'Guru Utama',
          notes: `Proposal lanjutan untuk ${pegawai.name}`,
          createdAt: new Date(2025, 6, Math.floor(Math.random() * 20) + 10),
          updatedAt: new Date()
        });
      }
    }

    // Insert proposal data
    let createdProposals = 0;
    for (const proposal of proposalData) {
      try {
        await prisma.promotionProposal.create({
          data: proposal
        });
        createdProposals++;
        console.log(`✅ Created proposal for pegawai ID: ${proposal.pegawaiId} (${proposal.status})`);
      } catch (error) {
        console.log(`⚠️  Failed to create proposal: ${error.message}`);
      }
    }

    console.log(`\n📊 Proposal Summary:`);
    console.log(`- Total proposals created: ${createdProposals}`);

    // Show statistics by status
    const statusStats = await prisma.promotionProposal.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    console.log(`\n📈 Proposal by Status:`);
    statusStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.id} proposals`);
    });

    // Show statistics by unit kerja (through pegawai relation)
    const unitKerjaStats = await prisma.promotionProposal.findMany({
      include: {
        pegawai: {
          select: { unitKerja: true }
        }
      }
    });

    const unitKerjaCount = unitKerjaStats.reduce((acc, proposal) => {
      const unitKerja = proposal.pegawai.unitKerja;
      if (unitKerja) {
        acc[unitKerja] = (acc[unitKerja] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n🏢 Proposals by Unit Kerja:`);
    Object.entries(unitKerjaCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([unitKerja, count]) => {
        console.log(`   ${unitKerja}: ${count} proposals`);
      });

    // Test query untuk operator unit kerja API
    console.log(`\n🔍 Testing Unit Kerja API Query:`);
    
    const unitKerjaData = await prisma.user.groupBy({
      by: ['unitKerja'],
      where: { 
        role: 'PEGAWAI',
        unitKerja: { not: null }
      },
      _count: { id: true }
    });

    for (const unit of unitKerjaData.slice(0, 3)) { // Test first 3 units
      const unitName = unit.unitKerja!;
      
      // Count total usulan
      const totalUsulan = await prisma.promotionProposal.count({
        where: {
          pegawai: {
            unitKerja: unitName
          }
        }
      });

      // Count active usulan
      const usulanAktif = await prisma.promotionProposal.count({
        where: {
          pegawai: {
            unitKerja: unitName
          },
          status: {
            notIn: ['SELESAI', 'DITOLAK']
          }
        }
      });

      console.log(`   ${unitName}:`);
      console.log(`     Pegawai: ${unit._count.id}`);
      console.log(`     Total Usulan: ${totalUsulan}`);
      console.log(`     Usulan Aktif: ${usulanAktif}`);
    }

  } catch (error) {
    console.error('❌ Error seeding proposal data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedProposalUnitKerja()
    .then(() => {
      console.log('✅ Proposal Unit Kerja seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Proposal seeding failed:', error);
      process.exit(1);
    });
}

export default seedProposalUnitKerja;
