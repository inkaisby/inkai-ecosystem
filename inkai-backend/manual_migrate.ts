import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Running manual migration SQL...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Conversation" (
          "id" TEXT NOT NULL,
          "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Message" (
          "id" TEXT NOT NULL,
          "conversationId" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_UserConversations" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL
      );
    `);

    try {
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "_UserConversations_AB_unique" ON "_UserConversations"("A", "B");`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "_UserConversations_B_index" ON "_UserConversations"("B");`);
    } catch (e) {}

    console.log('Tables created. Adding constraints...');

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "_UserConversations" ADD CONSTRAINT "_UserConversations_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "_UserConversations" ADD CONSTRAINT "_UserConversations_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
    } catch (e: any) {
        console.log('Constraints might already exist or failed:', e.message);
    }

    console.log('Manual migration finished successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
