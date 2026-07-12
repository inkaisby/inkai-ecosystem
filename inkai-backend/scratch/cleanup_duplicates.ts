import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  console.log('=== CLEANING UP DUPLICATE MEMBERS AND USERS ===');

  // Helper to delete a member and their user account
  async function removeMemberAndUser(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true }
    });

    if (!member) {
      console.log(`Member with ID ${memberId} not found.`);
      return;
    }

    console.log(`Processing deletion for: ${member.fullName} (ID: ${memberId})`);

    // 1. Delete member record
    await prisma.member.delete({
      where: { id: memberId }
    });
    console.log(`- Member record deleted.`);

    // 2. Delete user account if it exists
    if (member.userId) {
      // Disconnect roles first
      await prisma.user.update({
        where: { id: member.userId },
        data: { roles: { disconnect: [] } }
      });
      await prisma.user.delete({
        where: { id: member.userId }
      });
      console.log(`- Associated User account ${member.user?.email} deleted.`);
    }
  }

  // 1. Clean up duplicate Thersayang Btari Aruta
  // Delete the one in Dojo Pusat Manggala (id: 6792aadb-0938-473c-963e-da46929b3d4a)
  // Keep the one in Dojo Airlangga (id: 6bee6740-9ffb-4494-aacd-fb8be8b1bdd1)
  console.log('\n--- Cleaning up Thersayang Btari Aruta ---');
  await removeMemberAndUser('6792aadb-0938-473c-963e-da46929b3d4a');

  // 2. Clean up duplicate Reynard Nathanael Giovanni
  // Delete the one with null NIA in Dojo Airlangga (id: 96d03149-6814-4ee1-a406-ab4db807924c)
  // Keep the one with NIA 23.29321 in Dojo Gading (id: 52af6a02-65cc-488b-a2e5-7a1c5ab6ad93)
  console.log('\n--- Cleaning up Reynard Nathanael Giovanni ---');
  await removeMemberAndUser('96d03149-6814-4ee1-a406-ab4db807924c');

  await prisma.$disconnect();
  console.log('\n=== Cleanup Completed ===');
}

main().catch(err => {
  console.error(err);
});
