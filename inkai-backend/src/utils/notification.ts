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
}) => {
  try {
    const where: any = {};
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
      select: { id: true }
    });

    if (admins.length === 0) return;

    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        title: params.title,
        content: params.content,
        type: params.type || 'INFO',
      }))
    });
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};
