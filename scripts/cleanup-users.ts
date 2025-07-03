import { prisma } from '../lib/prisma';

async function cleanupUserData() {
  try {
    console.log('Starting user data cleanup...');

    // Get all users except OPERATOR and ADMIN
    const usersToDelete = await prisma.user.findMany({
      where: {
        role: {
          notIn: ['OPERATOR', 'ADMIN']
        }
      },
      select: {
        id: true,
        name: true,
        nip: true,
        role: true
      }
    });

    console.log(`Found ${usersToDelete.length} users to delete:`);
    usersToDelete.forEach(user => {
      console.log(`- ${user.name} (${user.nip}) - ${user.role}`);
    });

    if (usersToDelete.length === 0) {
      console.log('No users to delete. Cleanup complete.');
      return;
    }

    // Get user IDs to delete
    const userIdsToDelete = usersToDelete.map(user => user.id);

    // Delete related data first (to avoid foreign key constraints)
    console.log('Deleting related data...');

    // Delete activity logs
    const deletedActivityLogs = await prisma.activityLog.deleteMany({
      where: {
        userId: {
          in: userIdsToDelete
        }
      }
    });
    console.log(`Deleted ${deletedActivityLogs.count} activity logs`);

    // Delete promotion proposals and related data
    const proposalsToDelete = await prisma.promotionProposal.findMany({
      where: {
        pegawaiId: {
          in: userIdsToDelete
        }
      },
      select: { id: true }
    });

    if (proposalsToDelete.length > 0) {
      const proposalIds = proposalsToDelete.map(p => p.id);

      // Delete proposal documents
      const deletedDocuments = await prisma.proposalDocument.deleteMany({
        where: {
          proposalId: {
            in: proposalIds
          }
        }
      });
      console.log(`Deleted ${deletedDocuments.count} proposal documents`);

      // Delete promotion proposals
      const deletedProposals = await prisma.promotionProposal.deleteMany({
        where: {
          pegawaiId: {
            in: userIdsToDelete
          }
        }
      });
      console.log(`Deleted ${deletedProposals.count} promotion proposals`);
    }

    // Delete subordinate relationships
    await prisma.user.updateMany({
      where: {
        superiorId: {
          in: userIdsToDelete
        }
      },
      data: {
        superiorId: null
      }
    });
    console.log('Updated subordinate relationships');

    // Finally, delete the users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          in: userIdsToDelete
        }
      }
    });

    console.log(`Successfully deleted ${deletedUsers.count} users`);
    console.log('User data cleanup completed successfully!');

    // Show remaining users
    const remainingUsers = await prisma.user.findMany({
      select: {
        name: true,
        nip: true,
        email: true,
        role: true
      },
      orderBy: {
        role: 'asc'
      }
    });

    console.log('\nRemaining users:');
    remainingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.nip || 'No NIP'}) - ${user.role} - ${user.email}`);
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
cleanupUserData()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  });
