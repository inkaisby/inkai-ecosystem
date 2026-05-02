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

