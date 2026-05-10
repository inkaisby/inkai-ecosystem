import prisma from '../src/utils/prisma';

async function checkDocs() {
  const members = await prisma.member.findMany({
    where: {
      OR: [
        { birthCertificateUrl: { not: null } },
        { bpjsCardUrl: { not: null } }
      ]
    },
    select: {
      id: true,
      userId: true,
      fullName: true,
      birthCertificateUrl: true,
      bpjsCardUrl: true
    }
  });

  console.log(JSON.stringify(members, null, 2));
  process.exit(0);
}

checkDocs();
