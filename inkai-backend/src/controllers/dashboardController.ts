import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalMembers = await prisma.member.count();
    const totalDojos = await prisma.dojo.count();
    const totalProvinces = await prisma.province.count();
    
    // Summary of monthly iuran
    const iuranSum = await prisma.billing.aggregate({
      where: { type: 'MONTHLY_IURAN', status: 'PAID' },
      _sum: { amount: true }
    });

    const pendingVerifications = 0; // Placeholder until we have a Verification model

    res.json({
      status: 'success',
      data: {
        totalMembers,
        totalDojos,
        totalProvinces,
        iuranTotal: iuranSum._sum.amount || 0,
        pendingVerifications
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const members = await prisma.member.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { dojo: true }
    });
    res.json({ status: 'success', data: members });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
