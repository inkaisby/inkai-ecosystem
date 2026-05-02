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

