import prisma from './prisma';

const MANAGED_DOJOS_KEY_PREFIX = 'user.managedDojos.';

const ADMIN_ROLE_NAMES = [
  'ADMINISTRATOR',
  'ADMIN_PUSAT',
  'ADMIN_PROVINCE',
  'ADMIN_BRANCH',
  'ADMIN',
  'ADMIN_DOJO',
] as const;

export type NotificationAudience = 'MEMBER' | 'ADMIN' | 'BROADCAST';

function asManagedDojoIds(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const dojoIds = (raw as { dojoIds?: unknown }).dojoIds;
  if (!Array.isArray(dojoIds)) return [];
  return [
    ...new Set(
      dojoIds.filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ];
}

export const createNotification = async (params: {
  userId?: string;
  title: string;
  content: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS';
  audience?: NotificationAudience;
}) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        content: params.content,
        type: params.type || 'INFO',
        audience: params.audience || (params.userId ? 'MEMBER' : 'BROADCAST'),
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

/**
 * Notify scoped administrators. Never fans out to all users.
 * Requires at least one of: role, provinceId, branchId, dojoId.
 */
export const notifyAdmins = async (params: {
  title: string;
  content: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS';
  role?: 'ADMINISTRATOR' | 'ADMIN_PUSAT' | 'ADMIN_PROVINCE' | 'ADMIN_BRANCH';
  provinceId?: string;
  branchId?: string;
  /** Akun ADMIN_DOJO yang mengurus dojo ini (ketua ranting / multi-ranting). */
  dojoId?: string;
}) => {
  try {
    if (!params.role && !params.provinceId && !params.branchId && !params.dojoId) {
      console.error(
        '[notifyAdmins] Refused empty scope — would fan out to all users',
        params.title,
      );
      return;
    }

    const recipientIds = new Set<string>();

    const hasGeoOrRole = !!(params.role || params.provinceId || params.branchId);
    if (hasGeoOrRole) {
      const where: Record<string, unknown> = {
        isActive: true,
        isDeleted: false,
      };

      if (params.role) {
        where.roles = { some: { name: params.role } };
      } else {
        // Geography without role → only admin accounts, never anggota.
        where.roles = {
          some: {
            name: {
              in: [
                'ADMINISTRATOR',
                'ADMIN_PUSAT',
                'ADMIN_PROVINCE',
                'ADMIN_BRANCH',
                'ADMIN',
              ],
            },
          },
        };
      }
      if (params.provinceId) where.managedProvinceId = params.provinceId;
      if (params.branchId) where.managedBranchId = params.branchId;

      const admins = await prisma.user.findMany({
        where,
        select: { id: true },
      });
      for (const admin of admins) recipientIds.add(admin.id);
    }

    if (params.dojoId) {
      const [homes, settings] = await Promise.all([
        prisma.user.findMany({
          where: {
            managedDojoId: params.dojoId,
            isActive: true,
            isDeleted: false,
            roles: { some: { name: 'ADMIN_DOJO' } },
          },
          select: { id: true },
        }),
        prisma.appSetting.findMany({
          where: { key: { startsWith: MANAGED_DOJOS_KEY_PREFIX } },
          select: { key: true, value: true },
        }),
      ]);

      for (const admin of homes) recipientIds.add(admin.id);

      const candidateIds: string[] = [];
      for (const row of settings) {
        const ids = asManagedDojoIds(row.value);
        if (!ids.includes(params.dojoId)) continue;
        const userId = row.key.slice(MANAGED_DOJOS_KEY_PREFIX.length);
        if (userId && !recipientIds.has(userId)) candidateIds.push(userId);
      }
      if (candidateIds.length > 0) {
        const extras = await prisma.user.findMany({
          where: {
            id: { in: candidateIds },
            isActive: true,
            isDeleted: false,
            roles: { some: { name: 'ADMIN_DOJO' } },
          },
          select: { id: true },
        });
        for (const admin of extras) recipientIds.add(admin.id);
      }
    }

    if (recipientIds.size === 0) return;

    await prisma.notification.createMany({
      data: [...recipientIds].map((userId) => ({
        userId,
        title: params.title,
        content: params.content,
        type: params.type || 'INFO',
        audience: 'ADMIN' as const,
      })),
    });
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};

export { ADMIN_ROLE_NAMES };
