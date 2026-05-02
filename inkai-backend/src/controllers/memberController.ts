import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user.userId },
      include: {
        dojo: { include: { branch: { include: { province: true } } } },
        ranks: { orderBy: { date: 'desc' } },
        _count: { select: { attendances: true, eventRegistrations: true } }
      }
    });

    if (!member) return res.status(404).json({ message: 'Member not found' });

    res.json({ status: 'success', data: member });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, phoneNumber, gender, birthDate } = req.body;
    
    const updatedMember = await prisma.member.update({
      where: { userId: req.user.userId },
      data: {
        fullName,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        user: {
          update: { phoneNumber }
        }
      }
    });

    res.json({ status: 'success', data: updatedMember });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllMembers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const members = await prisma.member.findMany({
      where: {
        OR: [
          { fullName: { contains: String(search), mode: 'insensitive' } },
          { nia: { contains: String(search), mode: 'insensitive' } }
        ]
      },
      include: {
        dojo: { select: { name: true, branch: { select: { province: { select: { name: true } } } } } }
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.member.count({
      where: {
        OR: [
          { fullName: { contains: String(search), mode: 'insensitive' } },
          { nia: { contains: String(search), mode: 'insensitive' } }
        ]
      }
    });

    res.json({
      status: 'success',
      data: members,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyChildren = async (req: AuthRequest, res: Response) => {
  try {
    const children = await prisma.member.findMany({
      where: { parentUserId: req.user.userId },
      include: {
        dojo: { include: { branch: true } },
        ranks: { orderBy: { date: 'desc' }, take: 1 }
      }
    });

    res.json({ status: 'success', data: children });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addChildMember = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, dojoId, gender, birthDate } = req.body;
    const parentUserId = req.user.userId;

    // Check if user has PARENT role (optional but good practice)
    const user = await prisma.user.findUnique({
      where: { id: parentUserId },
      include: { roles: true }
    });

    if (!user?.roles.some(r => r.name === 'PARENT')) {
      // Auto-assign PARENT role if not already assigned
      await prisma.user.update({
        where: { id: parentUserId },
        data: {
          roles: {
            connectOrCreate: {
              where: { name: 'PARENT' },
              create: { name: 'PARENT' }
            }
          }
        }
      });
    }

    const newMember = await prisma.member.create({
      data: {
        fullName,
        dojoId,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        parentUserId,
        status: 'PENDING'
      }
    });

    res.status(201).json({ status: 'success', data: newMember });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

