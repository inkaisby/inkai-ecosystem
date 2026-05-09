import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const syncAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { logs } = req.body; // Array of { memberId, dojoId, checkInAt, method }

    if (!Array.isArray(logs)) {
      return res.status(400).json({ message: 'Logs must be an array' });
    }

    // Process logs in a transaction
    const results = await prisma.$transaction(
      logs.map((log: any) => 
        prisma.attendance.upsert({
          where: { id: log.id || 'new-id' }, // Use UUID from client if available
          update: {}, // Don't update if already exists
          create: {
            id: log.id,
            memberId: log.memberId,
            dojoId: log.dojoId,
            checkInAt: new Date(log.checkInAt),
            method: log.method || 'QR_SCAN'
          }
        })
      )
    );

    res.json({
      status: 'success',
      message: `${results.length} logs synchronized`,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDojoAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { dojoId } = req.params;
    const { date } = req.query; // Optional date filter

    const startOfDay = date ? new Date(date as string) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        dojoId,
        checkInAt: { gte: startOfDay, lte: endOfDay }
      },
      include: { member: { select: { fullName: true, nia: true, currentRank: true } } }
    });

    res.json({ status: 'success', data: attendances });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { date, limit = 50 } = req.query;
    
    const startOfDay = date ? new Date(date as string) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        checkInAt: { gte: startOfDay, lte: endOfDay }
      },
      include: {
        member: { select: { fullName: true, nia: true } },
        dojo: { select: { name: true } }
      },
      orderBy: { checkInAt: 'desc' },
      take: Number(limit)
    });

    res.json({ status: 'success', data: attendances });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Haversine formula to calculate distance between two points in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const checkIn = async (req: AuthRequest, res: Response) => {
  try {
    const { dojoId, method = 'QR_SCAN', latitude, longitude } = req.body;
    const memberId = req.user.memberId;

    if (!memberId) {
      return res.status(403).json({ status: 'error', message: 'Hanya anggota yang dapat melakukan absensi.' });
    }

    // Fetch Dojo for geofencing validation
    const dojo = await prisma.dojo.findUnique({ where: { id: dojoId } });
    if (!dojo) {
      return res.status(404).json({ status: 'error', message: 'Dojo tidak ditemukan.' });
    }

    // Geofencing Validation
    if (dojo.latitude && dojo.longitude && latitude && longitude) {
      const distance = getDistance(dojo.latitude, dojo.longitude, latitude, longitude);
      if (distance > dojo.geofenceRadius) {
        return res.status(400).json({ 
          status: 'error', 
          message: `Lokasi Anda terlalu jauh dari Dojo (${Math.round(distance)}m). Silakan dekati area latihan.` 
        });
      }
    }

    // Check for existing check-in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: {
        memberId,
        checkInAt: { gte: startOfDay, lte: endOfDay }
      }
    });

    if (existing) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Anda sudah melakukan absensi hari ini.',
        data: existing
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        memberId,
        dojoId,
        method,
        latitude,
        longitude,
        checkInAt: new Date()
      },
      include: {
        dojo: { select: { name: true } },
        member: { select: { fullName: true } }
      }
    });

    res.status(201).json({
      status: 'success',
      message: `Berhasil absen di ${attendance.dojo.name}`,
      data: attendance
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

