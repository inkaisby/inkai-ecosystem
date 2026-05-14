import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { notifyAdmins, createNotification } from '../utils/notification';
import { invalidateCache } from '../utils/redis';
import {
  JwtEventUser,
  buildEventVisibilityWhere,
  resolveBranchIdForCreate,
  viewerCanMutateEvent,
  provinceOwnsBranch,
} from '../utils/eventScope';

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const jwtUser = (req as Request & { user?: JwtEventUser }).user as JwtEventUser | undefined;
    const vis = await buildEventVisibilityWhere(jwtUser ?? null);

    const events = await prisma.event.findMany({
      where: { isDeleted: false, ...vis },
      include: {
        categories: true,
        branch: { select: { id: true, name: true, city: true } },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json({ status: 'success', data: events });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const memberId = (req as Request & { user?: JwtEventUser }).user?.memberId;
    if (!memberId) {
      return res.json({ status: 'success', data: [] });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        memberId,
        event: {
          isDeleted: false,
        },
      },
      include: {
        event: {
          include: { categories: true },
        },
        category: true,
      },
      orderBy: { event: { startDate: 'desc' } },
    });

    const events = registrations.map((reg) => ({
      ...reg.event,
      registrationStatus: reg.status,
      selectedCategory: reg.category,
    }));

    res.json({ status: 'success', data: events });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jwtUser = (req as Request & { user?: JwtEventUser }).user as JwtEventUser | undefined;

    const vis = await buildEventVisibilityWhere(jwtUser ?? null);

    const event = await prisma.event.findFirst({
      where: { id, isDeleted: false, ...vis },
      include: {
        categories: true,
        branch: { select: { id: true, name: true, city: true } },
        registrations: {
          include: {
            member: {
              include: {
                dojo: {
                  include: { branch: true },
                },
                billings: {
                  where: { type: 'EVENT_FEE' },
                },
              },
            },
            category: true,
          },
        },
      },
    });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ status: 'success', data: event });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, startDate, endDate, location, categories } = req.body;
    const { branchId: rawBranchFromBody } = req.body;

    const userId = (req as Request & { user?: JwtEventUser }).user?.userId;
    const jwtUser = (req as Request & { user?: JwtEventUser }).user ?? {};
    let branchId: string | null;
    try {
      branchId = await resolveBranchIdForCreate(jwtUser, rawBranchFromBody);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Wilayah tidak valid untuk agenda ini';
      return res.status(400).json({ status: 'error', message: msg });
    }

    const categoryCreates =
      Array.isArray(categories) && categories.length > 0
        ? categories.map((c: { name: string; fee?: number | string }) => ({
            name: c.name,
            fee: parseFloat(String(c.fee ?? 0)),
          }))
        : [];

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        branchId,
        createdById: userId,
        ...(categoryCreates.length > 0
          ? {
              categories: {
                create: categoryCreates,
              },
            }
          : {}),
      },
      include: { categories: true, branch: { select: { id: true, name: true, city: true } } },
    });

    await invalidateCache('events:all');

    res.status(201).json({ status: 'success', data: event });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const { eventId, memberId, categoryId } = req.body;

    const eventRecord = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!eventRecord || eventRecord.isDeleted) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (eventRecord.branchId) {
      const memberRecord = await prisma.member.findUnique({
        where: { id: memberId },
        select: { dojo: { select: { branchId: true } } },
      });
      const mBranch = memberRecord?.dojo?.branchId;
      if (!mBranch || mBranch !== eventRecord.branchId) {
        return res.status(403).json({
          message: 'Acara ini hanya untuk anggota di wilayah cabang yang sama',
        });
      }
    }

    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, memberId },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event. Use update instead.' });
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        memberId,
        categoryId,
        status: 'PENDING',
      },
      include: {
        member: {
          include: {
            dojo: {
              include: { branch: true },
            },
          },
        },
        event: true,
        category: true,
      },
    });

    if (registration.category && registration.category.fee > 0) {
      await prisma.billing.create({
        data: {
          memberId: registration.memberId,
          registrationId: registration.id,
          type: 'EVENT_FEE',
          amount: registration.category.fee,
          description: `Biaya pendaftaran ${registration.event.title} - ${registration.category.name}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
        },
      });

      if (registration.member.userId) {
        await createNotification({
          userId: registration.member.userId,
          title: 'Tagihan Pendaftaran Event',
          content: `Silakan lanjut pembayaran untuk ${registration.event.title} kategori ${registration.category.name} sebesar Rp ${registration.category.fee.toLocaleString('id-ID')}`,
          type: 'INFO',
        });
      }
    }

    if (registration.member.dojo.branchId) {
      await notifyAdmins({
        title: 'Pendaftaran Event Baru',
        content: `Anggota ${registration.member.fullName} mendaftar ke ${registration.event.title}${registration.category ? ` (Kategori: ${registration.category.name})` : ''}`,
        branchId: registration.member.dojo.branchId,
        type: 'SUCCESS',
      });
    }

    res.status(201).json({ status: 'success', data: registration });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const updateRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;

    const registration = await prisma.eventRegistration.update({
      where: { id },
      data: { categoryId },
      include: {
        member: {
          include: {
            dojo: {
              include: { branch: true },
            },
          },
        },
        event: true,
        category: true,
      },
    });

    if (registration.category && registration.category.fee > 0) {
      const existingBilling = await prisma.billing.findFirst({
        where: {
          memberId: registration.memberId,
          registrationId: registration.id,
          type: 'EVENT_FEE',
          status: 'PENDING',
        },
      });

      if (existingBilling) {
        await prisma.billing.update({
          where: { id: existingBilling.id },
          data: {
            amount: registration.category.fee,
            description: `Biaya pendaftaran ${registration.event.title} - ${registration.category.name}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        await prisma.billing.create({
          data: {
            memberId: registration.memberId,
            registrationId: registration.id,
            type: 'EVENT_FEE',
            amount: registration.category.fee,
            description: `Biaya pendaftaran ${registration.event.title} - ${registration.category.name}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
          },
        });
      }

      if (registration.member.userId) {
        await createNotification({
          userId: registration.member.userId,
          title: 'Pendaftaran Event Diperbarui',
          content: `Pendaftaran Anda untuk ${registration.event.title} telah diperbarui ke kategori ${registration.category.name}. Silakan cek tagihan Anda.`,
          type: 'INFO',
        });
      }
    }

    if (registration.member.dojo.branchId) {
      await notifyAdmins({
        title: 'Pendaftaran Event Diperbarui',
        content: `Anggota ${registration.member.fullName} memperbarui pendaftaran ke ${registration.event.title}${registration.category ? ` (Kategori Baru: ${registration.category.name})` : ''}`,
        branchId: registration.member.dojo.branchId,
        type: 'INFO',
      });
    }

    res.json({ status: 'success', data: registration });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

async function resolveBranchIdForUpdate(args: {
  jwtUser: JwtEventUser;
  existingBranchId: string | null;
  bodyBranchId: unknown;
}): Promise<string | null> {
  const { jwtUser, existingBranchId, bodyBranchId } = args;
  const roles = jwtUser.roles || [];

  if (roles.some((r) => ['ADMINISTRATOR', 'ADMIN_PUSAT'].includes(r))) {
    if (bodyBranchId === undefined) return existingBranchId;
    return bodyBranchId === null || bodyBranchId === '' ? null : String(bodyBranchId);
  }

  if (roles.includes('ADMIN_PROVINCE') && jwtUser.managedProvinceId) {
    if (bodyBranchId === undefined) return existingBranchId;
    if (bodyBranchId === null || bodyBranchId === '') return null;
    const ok = await provinceOwnsBranch(jwtUser.managedProvinceId, String(bodyBranchId));
    if (!ok) {
      throw new Error('Cabang tidak termasuk provinsi Anda');
    }
    return String(bodyBranchId);
  }

  return existingBranchId;
}

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, location, categories, branchId: bodyBranchId } = req.body;
    const jwtUser = (req as Request & { user?: JwtEventUser }).user ?? {};

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

    const allowed = await viewerCanMutateEvent(
      {
        branchId: existingEvent.branchId,
        createdById: existingEvent.createdById,
      },
      jwtUser,
    );

    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission to update this event' });
    }

    let nextBranchId: string | null;
    try {
      nextBranchId = await resolveBranchIdForUpdate({
        jwtUser,
        existingBranchId: existingEvent.branchId,
        bodyBranchId,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Wilayah tidak valid';
      return res.status(400).json({ message: msg });
    }

    const event = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          branchId: nextBranchId,
        },
      });

      if (categories && Array.isArray(categories)) {
        await tx.eventCategory.deleteMany({
          where: { eventId: id },
        });

        await tx.event.update({
          where: { id },
          data: {
            categories: {
              create: categories.map((c: { name: string; fee: number | string }) => ({
                name: c.name,
                fee: parseFloat(String(c.fee)),
              })),
            },
          },
        });
      }

      return tx.event.findUnique({
        where: { id },
        include: {
          categories: true,
          branch: { select: { id: true, name: true, city: true } },
        },
      });
    });

    await invalidateCache('events:all');

    res.json({ status: 'success', data: event });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jwtUser = (req as Request & { user?: JwtEventUser }).user ?? {};

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

    const allowed = await viewerCanMutateEvent(
      {
        branchId: existingEvent.branchId,
        createdById: existingEvent.createdById,
      },
      jwtUser,
    );

    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission to delete this event' });
    }

    await prisma.$transaction([
      prisma.eventCategory.deleteMany({ where: { eventId: id } }),
      prisma.eventRegistration.deleteMany({ where: { eventId: id } }),
      prisma.verification.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    await invalidateCache('events:all');

    res.json({ status: 'success', message: 'Event deleted successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};
