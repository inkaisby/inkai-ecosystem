import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const branches = await prisma.branch.findMany({
      include: { 
        province: { select: { name: true } },
        _count: { select: { dojos: true } }
      }
    });
    console.log('--- BRANCHES LIST ---');
    branches.forEach(b => {
      console.log(`- ${b.name} (Province: ${b.province.name}) | Dojos: ${b._count.dojos}`);
    });

    const jatim = await prisma.province.findFirst({
      where: { name: 'JAWA TIMUR' },
      include: { branches: { include: { _count: { select: { dojos: true } } } } }
    });
    console.log('\n--- JAWA TIMUR DATA ---');
    if (jatim) {
      console.log(`Province ID: ${jatim.id}`);
      console.log(`Branches in Jatim: ${jatim.branches.length}`);
      jatim.branches.forEach(b => {
        console.log(`  - ${b.name} (ID: ${b.id}) | Dojos: ${b._count.dojos}`);
      });
    } else {
      console.log('Province JAWA TIMUR not found!');
    }

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
