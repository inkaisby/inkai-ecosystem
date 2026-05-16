import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: {
    memberId?: string;
    roles?: string[];
    managedProvinceId?: string | null;
    managedBranchId?: string | null;
    managedDojoId?: string | null;
  };
}

/** Tidak ada baris absensi dengan memberId ini — dipakai untuk mengembalikan hasil kosong aman. */
const NO_MATCH_MEMBER_ID = '00000000-0000-4000-8000-000000000000';

function startEndOfToday(): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

/** Zona waktu untuk "hari jadwal agenda" (selaras dengan absensi member). Default WIB. */
const EVENT_CALENDAR_TZ = process.env.EVENT_CALENDAR_TZ || 'Asia/Jakarta';

/** YYYY-MM-DD di zona waktu tertentu untuk membandingkan hari kalender agenda. */
function calendarYmdInTimeZone(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '0';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${day}`;
}

function isNowWithinEventCalendarDays(
  now: Date,
  startDate: Date,
  endDate: Date,
  timeZone: string,
): boolean {
  const end = endDate.getTime() < startDate.getTime() ? startDate : endDate;
  const nowYmd = calendarYmdInTimeZone(now, timeZone);
  const startYmd = calendarYmdInTimeZone(startDate, timeZone);
  const endYmd = calendarYmdInTimeZone(end, timeZone);
  return nowYmd >= startYmd && nowYmd <= endYmd;
}

/** Admin boleh mengubah/menghapus baris absensi ini? */
async function staffCanAccessAttendance(user: AuthRequest['user'], attendanceMemberDojoId: string): Promise<boolean> {
  if (!user?.roles?.length) return false;
  const roles = user.roles;
  if (roles.includes('ADMINISTRATOR') || roles.includes('ADMIN_PUSAT')) return true;
  if (roles.includes('ADMIN_PROVINCE') && user.managedProvinceId) {
    const pid = await prisma.dojo.findUnique({
      where: { id: attendanceMemberDojoId },
      select: { branch: { select: { provinceId: true } } },
    });
    return pid?.branch?.provinceId === user.managedProvinceId;
  }
  if (roles.includes('ADMIN_BRANCH') && user.managedBranchId) {
    const bid = await prisma.dojo.findUnique({
      where: { id: attendanceMemberDojoId },
      select: { branchId: true },
    });
    return bid?.branchId === user.managedBranchId;
  }
  if (roles.includes('ADMIN_DOJO') && user.managedDojoId) {
    return attendanceMemberDojoId === user.managedDojoId;
  }
  return false;
}

function prismaWhereAttendanceForStaff(req: AuthRequest): Record<string, unknown> | undefined {
  const user = req.user;
  if (!user?.roles?.length) return { memberId: NO_MATCH_MEMBER_ID };
  const roles = user.roles;
  if (roles.includes('ADMINISTRATOR') || roles.includes('ADMIN_PUSAT')) {
    return undefined;
  }
  if (roles.includes('ADMIN_PROVINCE') && user.managedProvinceId) {
    return {
      member: {
        dojo: {
          branch: { provinceId: user.managedProvinceId },
        },
      },
    };
  }
  if (roles.includes('ADMIN_BRANCH') && user.managedBranchId) {
    return { member: { dojo: { branchId: user.managedBranchId } } };
  }
  if (roles.includes('ADMIN_DOJO') && user.managedDojoId) {
    return { member: { dojoId: user.managedDojoId } };
  }
  return { memberId: NO_MATCH_MEMBER_ID };
}

export const syncAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { logs } = req.body; // Array of { memberId, dojoId, checkInAt, method }

    if (!Array.isArray(logs)) {
      return res.status(400).json({ message: 'Logs must be an array' });
    }

    const results = await prisma.$transaction(
      logs.map((log: any) =>
        prisma.attendance.upsert({
          where: { id: log.id || 'new-id' },
          update: {},
          create: {
            id: log.id,
            memberId: log.memberId,
            dojoId: log.dojoId,
            checkInAt: new Date(log.checkInAt),
            method: log.method || 'QR_SCAN',
          },
        }),
      ),
    );

    res.json({
      status: 'success',
      message: `${results.length} logs synchronized`,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDojoAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { dojoId } = req.params;
    const { date } = req.query;

    const startOfDay = date ? new Date(date as string) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        dojoId,
        isDeleted: false,
        checkInAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        member: { select: { fullName: true, nia: true, currentRank: true } },
        event: { select: { id: true, title: true } },
      },
    });

    res.json({ status: 'success', data: attendances });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/** Rentang satu hari kalender WIB untuk query ?date=YYYY-MM-DD (default: hari ini WIB). */
function jakartaDayRange(dateParam?: string): { gte: Date; lte: Date } {
  const ymd =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());
  const gte = new Date(`${ymd}T00:00:00.000+07:00`);
  const lte = new Date(`${ymd}T23:59:59.999+07:00`);
  return { gte, lte };
}

export const getAllAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { date, limit = 50 } = req.query;
    const take = Math.min(Math.max(Number(limit) || 50, 1), 500);

    const { gte, lte } = jakartaDayRange(typeof date === 'string' ? date : undefined);

    const scope = prismaWhereAttendanceForStaff(req);

    const attendances = await prisma.attendance.findMany({
      where: {
        isDeleted: false,
        checkInAt: { gte, lte },
        ...(scope ?? {}),
      },
      include: {
        member: { select: { fullName: true, nia: true } },
        dojo: { select: { name: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { checkInAt: 'desc' },
      take,
    });

    res.json({ status: 'success', data: attendances });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/** Riwayat absensi untuk akun anggota (read-only). */
export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.user?.memberId;
    if (!memberId) {
      return res.status(403).json({
        status: 'error',
        message: 'Hanya akun anggota yang dapat melihat riwayat absensi.',
      });
    }

    const limit = Math.min(Number(req.query.limit) || 80, 200);

    const rows = await prisma.attendance.findMany({
      where: { memberId, isDeleted: false },
      orderBy: { checkInAt: 'desc' },
      take: limit,
      include: {
        dojo: { select: { id: true, name: true } },
        event: { select: { id: true, title: true, startDate: true, endDate: true } },
      },
    });

    res.json({ status: 'success', data: rows });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateAttendanceStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { checkInAt } = req.body as { checkInAt?: string };

    if (!checkInAt || typeof checkInAt !== 'string') {
      return res.status(400).json({ status: 'error', message: 'checkInAt (ISO datetime) wajib.' });
    }

    const dt = new Date(checkInAt);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ status: 'error', message: 'Format waktu tidak valid.' });
    }

    const existing = await prisma.attendance.findFirst({
      where: { id, isDeleted: false },
      include: {
        member: { select: { dojoId: true, fullName: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Data absensi tidak ditemukan.' });
    }

    const ok = await staffCanAccessAttendance(req.user, existing.member.dojoId);
    if (!ok) {
      return res.status(403).json({ status: 'error', message: 'Tidak ada wewenang mengubah absensi ini.' });
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: { checkInAt: dt },
      include: {
        member: { select: { fullName: true, nia: true } },
        dojo: { select: { name: true } },
        event: { select: { id: true, title: true } },
      },
    });

    res.json({ status: 'success', message: 'Waktu absensi diperbarui.', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const softDeleteAttendanceStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.attendance.findFirst({
      where: { id, isDeleted: false },
      include: {
        member: { select: { dojoId: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Data absensi tidak ditemukan.' });
    }

    const ok = await staffCanAccessAttendance(req.user, existing.member.dojoId);
    if (!ok) {
      return res.status(403).json({ status: 'error', message: 'Tidak ada wewenang menghapus absensi ini.' });
    }

    await prisma.attendance.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ status: 'success', message: 'Absensi dihapus dari laporan (soft delete).' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const APPROVED_REGISTRATION_STATUSES = ['APPROVED', 'SUCCESS', 'PAID'];

export const checkIn = async (req: AuthRequest, res: Response) => {
  try {
    const { dojoId, eventId, method = 'QR_SCAN', latitude, longitude } = req.body;
    const memberId = req.user?.memberId;

    if (!memberId) {
      return res.status(403).json({ status: 'error', message: 'Hanya anggota yang dapat melakukan absensi.' });
    }

    const { startOfDay, endOfDay } = startEndOfToday();

    if (eventId) {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { id: true, dojoId: true },
      });
      if (!member) {
        return res.status(404).json({ status: 'error', message: 'Data anggota tidak ditemukan.' });
      }

      const event = await prisma.event.findFirst({
        where: { id: String(eventId), isDeleted: false },
      });
      if (!event) {
        return res.status(404).json({ status: 'error', message: 'Agenda tidak ditemukan.' });
      }

      const now = new Date();
      if (!isNowWithinEventCalendarDays(now, event.startDate, event.endDate, EVENT_CALENDAR_TZ)) {
        return res.status(400).json({
          status: 'error',
          message: 'Absensi agenda hanya dapat dilakukan pada rentang jadwal event.',
        });
      }

      const reg = await prisma.eventRegistration.findFirst({
        where: {
          eventId: String(eventId),
          memberId,
          status: { in: APPROVED_REGISTRATION_STATUSES },
        },
      });
      if (!reg) {
        return res.status(403).json({
          status: 'error',
          message: 'Anda belum terdaftar atau pendaftaran belum disetujui untuk agenda ini.',
        });
      }

      const dupEvent = await prisma.attendance.findFirst({
        where: {
          memberId,
          eventId: String(eventId),
          isDeleted: false,
          checkInAt: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (dupEvent) {
        return res.status(400).json({
          status: 'error',
          message: 'Anda sudah absen untuk agenda ini hari ini.',
          data: dupEvent,
        });
      }

      const attendance = await prisma.attendance.create({
        data: {
          memberId,
          dojoId: member.dojoId,
          eventId: String(eventId),
          method: typeof method === 'string' ? method : 'EVENT_APP',
          latitude,
          longitude,
          checkInAt: new Date(),
        },
        include: {
          dojo: { select: { name: true } },
          member: { select: { fullName: true } },
          event: { select: { title: true } },
        },
      });

      const title = attendance.event?.title;
      return res.status(201).json({
        status: 'success',
        message: title ? `Berhasil absen — ${title}` : `Berhasil absen di ${attendance.dojo.name}`,
        data: attendance,
      });
    }

    if (!dojoId) {
      return res.status(400).json({ status: 'error', message: 'dojoId wajib untuk absensi QR di dojo.' });
    }

    const dojo = await prisma.dojo.findUnique({ where: { id: dojoId } });
    if (!dojo) {
      return res.status(404).json({ status: 'error', message: 'Dojo tidak ditemukan.' });
    }

    if (dojo.latitude && dojo.longitude && latitude && longitude) {
      const distance = getDistance(dojo.latitude, dojo.longitude, latitude, longitude);
      if (distance > dojo.geofenceRadius) {
        return res.status(400).json({
          status: 'error',
          message: `Lokasi Anda terlalu jauh dari Dojo (${Math.round(distance)}m). Silakan dekati area latihan.`,
        });
      }
    }

    const existingQr = await prisma.attendance.findFirst({
      where: {
        memberId,
        eventId: null,
        isDeleted: false,
        checkInAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingQr) {
      return res.status(400).json({
        status: 'error',
        message: 'Anda sudah melakukan absensi QR di dojo hari ini.',
        data: existingQr,
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        memberId,
        dojoId,
        eventId: null,
        method,
        latitude,
        longitude,
        checkInAt: new Date(),
      },
      include: {
        dojo: { select: { name: true } },
        member: { select: { fullName: true } },
      },
    });

    res.status(201).json({
      status: 'success',
      message: `Berhasil absen di ${attendance.dojo.name}`,
      data: attendance,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
