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
  userCanBulkRegisterMembersForEvents,
  staffCanRegisterMemberForEvent,
  shouldRestrictEventRegistrationsToManagedDojo,
} from '../utils/eventScope';
import { pickUniqueEventFeeAmount } from '../utils/eventFeeBilling';

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const jwtUser = (req as Request & { user?: JwtEventUser }).user as JwtEventUser | undefined;
    const vis = await buildEventVisibilityWhere(jwtUser ?? null);

    const countRegistrationsByDojoOnly =
      jwtUser &&
      shouldRestrictEventRegistrationsToManagedDojo(jwtUser);

    const events = await prisma.event.findMany({
      where: { isDeleted: false, ...vis },
      include: {
        categories: true,
        branch: { select: { id: true, name: true, city: true } },
        _count: {
          select: {
            registrations: countRegistrationsByDojoOnly
              ? {
                  where: {
                    member: {
                      dojoId: jwtUser.managedDojoId,
                    },
                  },
                }
              : true,
          },
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
                user: { select: { photoUrl: true, phoneNumber: true } },
                dojo: {
                  include: { branch: true },
                },
                billings: {
                  where: { type: 'EVENT_FEE', isDeleted: false },
                  include: { payment: true },
                },
              },
            },
            category: true,
          },
        },
      },
    });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (jwtUser && shouldRestrictEventRegistrationsToManagedDojo(jwtUser)) {
      const dojoOnly = jwtUser.managedDojoId;
      return res.json({
        status: 'success',
        data: {
          ...event,
          registrations: event.registrations.filter((r) => r.member.dojoId === dojoOnly),
          /** Membantu klien: roster ini dibatasi ke dojo yang dikelola ketua */
          registrationsScopedToManagedDojo: true,
          managedDojoId: jwtUser.managedDojoId,
        },
      });
    }

    res.json({ status: 'success', data: event });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, startDate, endDate, location, categories, registrationCloseAt } =
      req.body;
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

    const start = new Date(startDate);
    const end = new Date(endDate);
    let regClose: Date | null = null;
    if (
      registrationCloseAt !== undefined &&
      registrationCloseAt !== null &&
      String(registrationCloseAt).trim() !== ''
    ) {
      regClose = new Date(registrationCloseAt as string);
      if (Number.isNaN(regClose.getTime())) {
        return res.status(400).json({ status: 'error', message: 'Batas pendaftaran tidak valid.' });
      }
      if (regClose.getTime() > start.getTime()) {
        return res.status(400).json({
          status: 'error',
          message: 'Batas pendaftaran tidak boleh setelah waktu mulai agenda.',
        });
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: start,
        endDate: end,
        registrationCloseAt: regClose,
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
    const { eventId, memberId: bodyMemberId, categoryId } = req.body;
    const jwtUser = (req as Request & { user?: JwtEventUser }).user;

    let memberId =
      typeof bodyMemberId === 'string' && bodyMemberId.trim() !== ''
        ? bodyMemberId.trim()
        : typeof jwtUser?.memberId === 'string' && jwtUser.memberId.trim() !== ''
          ? jwtUser.memberId.trim()
          : '';

    if (!memberId && jwtUser?.userId) {
      const linked = await prisma.member.findUnique({
        where: { userId: jwtUser.userId },
        select: { id: true },
      });
      memberId = linked?.id ?? '';
    }

    if (!memberId) {
      return res.status(400).json({
        status: 'error',
        message:
          'Profil anggota tidak ditemukan. Pastikan Anda login sebagai anggota yang sudah terdaftar di dojo.',
      });
    }

    const eventRecord = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!eventRecord || eventRecord.isDeleted) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const nowMs = Date.now();
    const effectiveCloseMs = eventRecord.registrationCloseAt
      ? eventRecord.registrationCloseAt.getTime()
      : eventRecord.startDate.getTime();
    if (nowMs > effectiveCloseMs) {
      return res.status(400).json({
        status: 'error',
        message:
          'Batas waktu pendaftaran untuk agenda ini sudah lewat. Hubungi pengurus jika perlu pendaftaran khusus.',
      });
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
        registeredByUserId: jwtUser?.userId ?? null,
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
      const fee = await pickUniqueEventFeeAmount(prisma, eventId, registration.category.fee);
      await prisma.billing.create({
        data: {
          memberId: registration.memberId,
          registrationId: registration.id,
          type: 'EVENT_FEE',
          amount: fee.total,
          baseFeeAmount: fee.baseRounded,
          uniqueTail: fee.uniqueTail,
          description: `Biaya pendaftaran ${registration.event.title} - ${registration.category.name}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
        },
      });

      if (registration.member.userId) {
        await createNotification({
          userId: registration.member.userId,
          title: 'Tagihan Pendaftaran Event',
          content: `Silakan lanjut pembayaran untuk ${registration.event.title} kategori ${registration.category.name} sebesar Rp ${fee.total.toLocaleString('id-ID')} (nominal termasuk kode unik untuk pencocokan pembayaran).`,
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

    /** Pendaftaran mandiri selalu mencatat pemahaman ketua dojo/ranting atas anggota asal mereka. */
    await notifyAdmins({
      title: 'Anggota mendaftar kegiatan mandiri',
      content: `${registration.member.fullName} (${registration.member.dojo.name}) mendaftar sendiri untuk "${registration.event.title}"${registration.category ? ` — ${registration.category.name}` : ''}.`,
      type: 'INFO',
      dojoId: registration.member.dojoId,
    });

    res.status(201).json({ status: 'success', data: registration });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] Error:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const bulkRegisterForEvent = async (req: Request, res: Response) => {
  try {
    const jwtUser = (req as Request & { user?: JwtEventUser }).user as JwtEventUser | undefined;

    if (!userCanBulkRegisterMembersForEvents(jwtUser)) {
      return res.status(403).json({
        status: 'error',
        message:
          'Hanya pengurus (admin pusat/provinsi/cabang/dojo) yang dapat mendaftar anggota secara massal.',
      });
    }

    const { eventId, memberIds, categoryId: bodyCategoryId } = req.body;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ status: 'error', message: 'eventId wajib diisi.' });
    }

    const vis = await buildEventVisibilityWhere(jwtUser ?? null);
    const eventRecord = await prisma.event.findFirst({
      where: { id: eventId, isDeleted: false, ...vis },
      include: { categories: true },
    });

    if (!eventRecord) {
      return res.status(404).json({ status: 'error', message: 'Event tidak ditemukan atau tidak dapat diakses.' });
    }

    const hasCategories = Array.isArray(eventRecord.categories) && eventRecord.categories.length > 0;
    let resolvedCategoryId: string | null = null;

    if (hasCategories) {
      if (!bodyCategoryId || typeof bodyCategoryId !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Pilih satu kategori. Nominal tagihan mengikuti biaya yang ditetapkan cabang untuk agenda ini.',
        });
      }
      const cat = eventRecord.categories.find((c) => c.id === bodyCategoryId);
      if (!cat) {
        return res.status(400).json({ status: 'error', message: 'Kategori tidak berlaku untuk agenda ini.' });
      }
      resolvedCategoryId = cat.id;
    }

    const rawIds = Array.isArray(memberIds) ? memberIds : [];
    const uniqueMemberIds = Array.from(
      new Set(
        rawIds.filter((id): id is string => typeof id === 'string' && String(id).trim() !== '').map((id) => id.trim()),
      ),
    );

    if (uniqueMemberIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Pilih minimal satu anggota.' });
    }

    const MAX_BATCH = 200;
    if (uniqueMemberIds.length > MAX_BATCH) {
      return res.status(400).json({
        status: 'error',
        message: `Maksimal ${MAX_BATCH} anggota per permintaan. Kurangi seleksi Anda.`,
      });
    }

    const membersFetched = await prisma.member.findMany({
      where: { id: { in: uniqueMemberIds } },
      select: {
        id: true,
        isDeleted: true,
        dojoId: true,
        userId: true,
        fullName: true,
        dojo: { select: { branchId: true, branch: { select: { provinceId: true } } } },
      },
    });

    const memberById = new Map(membersFetched.map((m) => [m.id, m]));

    const skippedNotFound: string[] = [];
    const skippedForbidden: string[] = [];
    const skippedAlreadyRegistered: string[] = [];
    const succeeded: { memberId: string; registrationId: string; fullName: string }[] = [];

    for (const mid of uniqueMemberIds) {
      const memberRow = memberById.get(mid);
      if (!memberRow) {
        skippedNotFound.push(mid);
        continue;
      }

      if (!staffCanRegisterMemberForEvent(jwtUser, memberRow, eventRecord.branchId)) {
        skippedForbidden.push(mid);
        continue;
      }

      const dup = await prisma.eventRegistration.findFirst({
        where: { eventId, memberId: mid },
      });
      if (dup) {
        skippedAlreadyRegistered.push(mid);
        continue;
      }

      let bulkNotifyAmount: number | null = null;
      const registration = await prisma.$transaction(async (tx) => {
        const reg = await tx.eventRegistration.create({
          data: {
            eventId,
            memberId: mid,
            registeredByUserId: jwtUser?.userId ?? null,
            categoryId: resolvedCategoryId,
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

        if (reg.category && reg.category.fee > 0) {
          const fee = await pickUniqueEventFeeAmount(tx, eventId, reg.category.fee);
          bulkNotifyAmount = fee.total;
          await tx.billing.create({
            data: {
              memberId: reg.memberId,
              registrationId: reg.id,
              type: 'EVENT_FEE',
              amount: fee.total,
              baseFeeAmount: fee.baseRounded,
              uniqueTail: fee.uniqueTail,
              description: `Biaya pendaftaran ${reg.event.title} - ${reg.category.name}`,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'PENDING',
            },
          });
        }

        return reg;
      });

      succeeded.push({
        memberId: mid,
        registrationId: registration.id,
        fullName: registration.member.fullName,
      });

      if (registration.category && registration.category.fee > 0 && registration.member.userId) {
        const showAmount = bulkNotifyAmount ?? registration.category.fee;
        await createNotification({
          userId: registration.member.userId,
          title: 'Tagihan Pendaftaran Event',
          content: `Anda didaftarkan ke ${registration.event.title} (kategori ${registration.category.name}) sebesar Rp ${showAmount.toLocaleString(
            'id-ID',
          )} (nominal termasuk kode unik). Silakan cek menu tagihan.`,
          type: 'INFO',
        });
      }

      if (registration.member.dojo.branchId) {
        await notifyAdmins({
          title: 'Pendaftaran Event (oleh pengurus)',
          content: `${registration.member.fullName} didaftarkan ke ${registration.event.title}${registration.category ? ` (${registration.category.name})` : ''}`,
          branchId: registration.member.dojo.branchId,
          type: 'SUCCESS',
        });
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        succeeded,
        skippedNotFound,
        skippedForbidden,
        skippedAlreadyRegistered,
      },
      message:
        succeeded.length === 0
          ? 'Tidak ada pendaftaran baru. Periksa akses wilayah atau status peserta.'
          : `Berhasil mendaftar ${succeeded.length} anggota.`,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] bulkRegisterForEvent:', error);
    res.status(500).json({ status: 'error', message: errMessage });
  }
};

export const updateRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryId, status } = req.body as { categoryId?: unknown; status?: unknown };
    const jwtUser = (req as Request & { user?: JwtEventUser }).user as JwtEventUser | undefined;

    if (!userCanBulkRegisterMembersForEvents(jwtUser)) {
      return res.status(403).json({
        status: 'error',
        message: 'Hanya pengurus yang dapat mengubah pendaftaran agenda.',
      });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { id },
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

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Pendaftaran tidak ditemukan' });
    }

    if (!staffCanRegisterMemberForEvent(jwtUser, existing.member, existing.event.branchId)) {
      return res.status(403).json({ status: 'error', message: 'Akses wilayah ditolak' });
    }

    const patch: { categoryId?: string | null; status?: string } = {};
    if (categoryId !== undefined) {
      patch.categoryId =
        categoryId === null || categoryId === '' ? null : String(categoryId);
    }
    const allowedStatus = new Set(['PENDING', 'APPROVED', 'REJECTED']);
    if (status !== undefined) {
      if (typeof status !== 'string' || !allowedStatus.has(status)) {
        return res.status(400).json({ status: 'error', message: 'Status tidak valid' });
      }
      patch.status = status;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ status: 'error', message: 'Tidak ada perubahan' });
    }

    if (patch.status === 'REJECTED') {
      await prisma.$transaction(async (tx) => {
        const pending = await tx.billing.findMany({
          where: { registrationId: id, type: 'EVENT_FEE', status: 'PENDING' },
        });
        for (const b of pending) {
          const pay = await tx.payment.findUnique({ where: { billingId: b.id } });
          if (!pay) {
            await tx.billing.delete({ where: { id: b.id } });
          }
        }
      });
    }

    const registration = await prisma.eventRegistration.update({
      where: { id },
      data: patch,
      include: {
        member: {
          include: {
            user: { select: { photoUrl: true, phoneNumber: true } },
            dojo: {
              include: { branch: true },
            },
            billings: {
              where: { type: 'EVENT_FEE' },
              include: { payment: true },
            },
          },
        },
        event: true,
        category: true,
      },
    });

    if (categoryId !== undefined && registration.category && registration.category.fee > 0) {
      const existingBilling = await prisma.billing.findFirst({
        where: {
          memberId: registration.memberId,
          registrationId: registration.id,
          type: 'EVENT_FEE',
          status: 'PENDING',
        },
      });

      const fee = await pickUniqueEventFeeAmount(
        prisma,
        registration.eventId,
        registration.category.fee,
        existingBilling?.id,
      );

      if (existingBilling) {
        await prisma.billing.update({
          where: { id: existingBilling.id },
          data: {
            amount: fee.total,
            baseFeeAmount: fee.baseRounded,
            uniqueTail: fee.uniqueTail,
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
            amount: fee.total,
            baseFeeAmount: fee.baseRounded,
            uniqueTail: fee.uniqueTail,
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

    if (registration.member.dojo.branchId && categoryId !== undefined) {
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

export const deleteRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jwtUser = (req as Request & { user?: JwtEventUser }).user as JwtEventUser | undefined;

    if (!userCanBulkRegisterMembersForEvents(jwtUser)) {
      return res.status(403).json({
        status: 'error',
        message: 'Hanya pengurus yang dapat menghapus pendaftaran.',
      });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { id },
      include: {
        member: {
          include: {
            dojo: {
              include: { branch: true },
            },
          },
        },
        event: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Pendaftaran tidak ditemukan' });
    }

    if (!staffCanRegisterMemberForEvent(jwtUser, existing.member, existing.event.branchId)) {
      return res.status(403).json({ status: 'error', message: 'Akses wilayah ditolak' });
    }

    const billings = await prisma.billing.findMany({
      where: { registrationId: id, type: 'EVENT_FEE' },
    });

    if (billings.some((b) => b.status === 'PAID')) {
      return res.status(400).json({
        status: 'error',
        message: 'Tidak dapat menghapus pendaftaran yang tagihannya sudah lunas.',
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const b of billings) {
        const pay = await tx.payment.findUnique({ where: { billingId: b.id } });
        if (pay) {
          await tx.payment.delete({ where: { billingId: b.id } });
        }
        await tx.billing.delete({ where: { id: b.id } });
      }
      await tx.eventRegistration.delete({ where: { id } });
    });

    res.json({ status: 'success', message: 'Pendaftaran dihapus' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('[EventController] deleteRegistration:', error);
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
    const { title, description, startDate, endDate, location, categories, branchId: bodyBranchId, registrationCloseAt } = req.body;
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

    const start = new Date(startDate);
    const end = new Date(endDate);
    let regClose: Date | null | undefined = undefined;
    if (registrationCloseAt === null) {
      regClose = null;
    } else if (
      registrationCloseAt !== undefined &&
      String(registrationCloseAt).trim() !== ''
    ) {
      regClose = new Date(registrationCloseAt as string);
      if (Number.isNaN(regClose.getTime())) {
        return res.status(400).json({ message: 'Batas pendaftaran tidak valid.' });
      }
      if (regClose.getTime() > start.getTime()) {
        return res.status(400).json({
          message: 'Batas pendaftaran tidak boleh setelah waktu mulai agenda.',
        });
      }
    }

    const event = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: {
          title,
          description,
          startDate: start,
          endDate: end,
          ...(regClose !== undefined ? { registrationCloseAt: regClose } : {}),
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
