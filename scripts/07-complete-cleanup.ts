import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEMENDIKBUD_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/640px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png';

async function completeCleanup() {
  try {
    console.log('🔍 Starting comprehensive cleanup...');
    
    // Get all the unwanted operators (newly created ones)
    const unwantedOperators = await prisma.user.findMany({
      where: {
        role: 'OPERATOR',
        OR: [
          { name: { contains: 'Operator Dinas Pendidikan' } },
          { unitKerja: { contains: 'Dinas Pendidikan' } }
        ]
      },
      select: {
        id: true,
        name: true,
        nip: true,
        unitKerja: true
      }
    });

    if (unwantedOperators.length > 0) {
      console.log(`🗑️  Found ${unwantedOperators.length} unwanted operators to delete:`);
      unwantedOperators.forEach(op => {
        console.log(`   - ${op.name} (${op.id})`);
      });

      for (const op of unwantedOperators) {
        try {
          // First, delete all activity logs for this user
          const deletedLogs = await prisma.activityLog.deleteMany({
            where: { userId: op.id }
          });
          console.log(`   🗑️  Deleted ${deletedLogs.count} activity logs for ${op.name}`);

          // Delete any promotion proposals where this user is the operator
          const deletedProposals = await prisma.promotionProposal.deleteMany({
            where: { operatorId: op.id }
          });
          console.log(`   🗑️  Deleted ${deletedProposals.count} promotion proposals for ${op.name}`);

          // Now delete the user
          await prisma.user.delete({
            where: { id: op.id }
          });
          console.log(`   ✅ Successfully deleted operator: ${op.name}`);

        } catch (error) {
          console.error(`   ❌ Failed to delete ${op.name}: ${error}`);
        }
      }
    } else {
      console.log('✅ No unwanted operators found');
    }

    // Update profile pictures for all remaining operators
    console.log('\n🖼️  Updating profile pictures for all operators...');
    const updateResult = await prisma.user.updateMany({
      where: {
        role: 'OPERATOR'
      },
      data: {
        profilePictureUrl: KEMENDIKBUD_LOGO_URL
      }
    });

    console.log(`✅ Updated profile pictures for ${updateResult.count} operators`);

    // Final verification
    console.log('\n📋 Final operator list:');
    const finalOperators = await prisma.user.findMany({
      where: {
        role: 'OPERATOR'
      },
      select: {
        id: true,
        name: true,
        nip: true,
        unitKerja: true,
        wilayah: true,
        profilePictureUrl: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    finalOperators.forEach((op, index) => {
      const hasCorrectLogo = op.profilePictureUrl === KEMENDIKBUD_LOGO_URL;
      console.log(`${index + 1}. ${op.name} (${op.nip}) - ${op.wilayah || 'No Wilayah'} - Logo: ${hasCorrectLogo ? '✅' : '❌'}`);
    });

    console.log(`\n🎉 Cleanup completed! Now have ${finalOperators.length} operators with proper profile pictures.`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeCleanup();
