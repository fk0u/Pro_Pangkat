import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEMENDIKBUD_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/640px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png';

async function cleanupAndUpdateOperators() {
  try {
    console.log('🔍 Checking existing operators...');
    
    // Get all operator users
    const operators = await prisma.user.findMany({
      where: {
        role: 'OPERATOR'
      },
      select: {
        id: true,
        name: true,
        nip: true,
        unitKerja: true,
        wilayah: true,
        profilePictureUrl: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${operators.length} operator users:`);
    operators.forEach((op, index) => {
      console.log(`${index + 1}. ${op.name} (${op.nip}) - ${op.unitKerja || 'No Unit'} - ${op.wilayah || 'No Wilayah'} - Created: ${op.createdAt.toISOString().split('T')[0]}`);
    });

    // Find duplicates based on name pattern
    const operatorNames = ['Operator 1', 'Operator 2', 'Operator 3', 'Operator 4', 'Operator 5', 'Operator 6', 'Operator 7'];
    const duplicatesToDelete = [];
    const operatorsToUpdate = [];

    for (const targetName of operatorNames) {
      const matchingOps = operators.filter(op => op.name === targetName);
      
      if (matchingOps.length > 1) {
        // Keep the oldest one, mark others for deletion
        matchingOps.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const keepOperator = matchingOps[0];
        const deleteOperators = matchingOps.slice(1);
        
        operatorsToUpdate.push(keepOperator);
        duplicatesToDelete.push(...deleteOperators);
        
        console.log(`⚠️  Found ${matchingOps.length} operators named "${targetName}"`);
        console.log(`   ✅ Keeping: ${keepOperator.id} (created: ${keepOperator.createdAt.toISOString()})`);
        deleteOperators.forEach(op => {
          console.log(`   ❌ Will delete: ${op.id} (created: ${op.createdAt.toISOString()})`);
        });
      } else if (matchingOps.length === 1) {
        operatorsToUpdate.push(matchingOps[0]);
        console.log(`✅ Found single operator "${targetName}": ${matchingOps[0].id}`);
      }
    }

    // Find any operators not matching the expected names (potentially newly created)
    const unexpectedOperators = operators.filter(op => !operatorNames.includes(op.name));
    if (unexpectedOperators.length > 0) {
      console.log(`⚠️  Found ${unexpectedOperators.length} unexpected operators:`);
      unexpectedOperators.forEach(op => {
        console.log(`   - ${op.name} (${op.id}) - ${op.unitKerja || 'No Unit'}`);
        // Add to deletion list if they look like automatically generated operators
        if (op.name.includes('Operator Dinas Kota') || op.unitKerja?.includes('Dinas Pendidikan')) {
          duplicatesToDelete.push(op);
          console.log(`     ❌ Will delete (appears to be auto-generated)`);
        }
      });
    }

    // Delete duplicates
    if (duplicatesToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${duplicatesToDelete.length} duplicate/unwanted operators...`);
      
      for (const opToDelete of duplicatesToDelete) {
        try {
          await prisma.user.delete({
            where: { id: opToDelete.id }
          });
          console.log(`   ✅ Deleted: ${opToDelete.name} (${opToDelete.id})`);
        } catch (error) {
          console.error(`   ❌ Failed to delete ${opToDelete.name}: ${error}`);
        }
      }
    } else {
      console.log('✅ No duplicates to delete');
    }

    // Update profile pictures for remaining operators
    if (operatorsToUpdate.length > 0) {
      console.log(`\n🖼️  Updating profile pictures for ${operatorsToUpdate.length} operators...`);
      
      for (const op of operatorsToUpdate) {
        try {
          await prisma.user.update({
            where: { id: op.id },
            data: {
              profilePictureUrl: KEMENDIKBUD_LOGO_URL
            }
          });
          console.log(`   ✅ Updated profile picture for: ${op.name} (${op.id})`);
        } catch (error) {
          console.error(`   ❌ Failed to update ${op.name}: ${error}`);
        }
      }
    }

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
      console.log(`${index + 1}. ${op.name} (${op.nip}) - ${op.unitKerja || 'No Unit'} - Logo: ${hasCorrectLogo ? '✅' : '❌'}`);
    });

    console.log('\n🎉 Cleanup and update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAndUpdateOperators();
