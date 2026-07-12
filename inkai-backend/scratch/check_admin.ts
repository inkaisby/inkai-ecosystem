import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'inkaisby@gmail.com' },
      include: { roles: true }
    });
    
    if (user) {
      console.log('User found:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Is Active:', user.isActive);
      console.log('Roles:', user.roles.map(r => r.name));
      
      const isPasswordMatch = await bcrypt.compare('h413ib', user.passwordHash);
      console.log('Password "h413ib" match:', isPasswordMatch);
    } else {
      console.log('User inkaisby@gmail.com not found in the database.');
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
