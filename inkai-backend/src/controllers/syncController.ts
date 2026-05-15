import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const pull = async (req: Request, res: Response) => {
  try {
    const { lastPulledAt } = req.query;
    const date = lastPulledAt ? new Date(lastPulledAt as string) : new Date(0);

    const provinces = await prisma.province.findMany({ where: { updatedAt: { gt: date } } });
    const branches = await prisma.branch.findMany({ where: { updatedAt: { gt: date } } });
    const dojos = await prisma.dojo.findMany({ where: { updatedAt: { gt: date } } });
    const attendances = await prisma.attendance.findMany({ where: { updatedAt: { gt: date } } });
    const members = await prisma.member.findMany({ where: { updatedAt: { gt: date } } });

    res.json({
      status: 'success',
      data: {
        provinces,
        branches,
        dojos,
        attendances,
        members,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const push = async (req: Request, res: Response) => {
  try {
    const { attendances, members } = req.body;

    // Sync Attendances (Batch Upsert)
    if (attendances && Array.isArray(attendances)) {
      for (const att of attendances) {
        await prisma.attendance.upsert({
          where: { id: att.id },
          update: {
            memberId: att.memberId,
            dojoId: att.dojoId,
            checkInAt: new Date(att.checkInAt),
            method: att.method,
            isDeleted: att.isDeleted || false,
            ...(typeof att.eventId === 'string' || att.eventId === null
              ? { eventId: att.eventId }
              : {}),
            updatedAt: new Date(),
          },
          create: {
            id: att.id,
            memberId: att.memberId,
            dojoId: att.dojoId,
            ...(typeof att.eventId !== 'undefined' ? { eventId: att.eventId } : {}),
            checkInAt: new Date(att.checkInAt),
            method: att.method,
            isDeleted: att.isDeleted || false,
          },
        });
      }
    }

    // Sync Members
    if (members && Array.isArray(members)) {
      for (const m of members) {
        await prisma.member.upsert({
          where: { id: m.id },
          update: {
            fullName: m.fullName,
            status: m.status,
            isDeleted: m.isDeleted || false,
            updatedAt: new Date()
          },
          create: {
            id: m.id,
            userId: m.userId,
            dojoId: m.dojoId,
            fullName: m.fullName,
            status: m.status,
            isDeleted: m.isDeleted || false
          }
        });
      }
    }

    res.json({ status: 'success', message: 'Sync push successful' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
