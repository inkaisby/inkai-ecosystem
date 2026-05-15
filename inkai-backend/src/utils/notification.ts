import prisma from './prisma';

export const createNotification = async (params: {
  userId?: string;
  title: string;
  content: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS';
}) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        content: params.content,
        type: params.type || 'INFO',
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

/**
 * Notify all administrators or a specific group of admins
 */
export const notifyAdmins = async (params: {
  title: string;
  content: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS';
  role?: 'ADMINISTRATOR' | 'ADMIN_PUSAT' | 'ADMIN_PROVINCE' | 'ADMIN_BRANCH';
  provinceId?: string;
  branchId?: string;
  /** Akun ADMIN_DOJO yang mengurus dojo ini (ketua ranting / administrator dojo). */
  dojoId?: string;
}) => {
  try {
    const where: Record<string, unknown> = {};
    if (params.role) {
      where.roles = { some: { name: params.role } };
    }
    if (params.provinceId) {
      where.managedProvinceId = params.provinceId;
    }
    if (params.branchId) {
      where.managedBranchId = params.branchId;
    }

    const admins = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: params.title,
          content: params.content,
          type: params.type || 'INFO',
        })),
      });
    }

    if (params.dojoId) {
      const dojoHeads = await prisma.user.findMany({
        where: {
          managedDojoId: params.dojoId,
          isActive: true,
          isDeleted: false,
          roles: { some: { name: 'ADMIN_DOJO' } },
        },
        select: { id: true },
      });
      if (dojoHeads.length > 0) {
        await prisma.notification.createMany({
          data: dojoHeads.map((admin) => ({
            userId: admin.id,
            title: params.title,
            content: params.content,
            type: params.type || 'INFO',
          })),
        });
      }
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};
