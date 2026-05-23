import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    const dojoWhere: any = {};
    const branchWhere: any = {};
    const provinceWhere: any = {};

    if (req.user) {
      if (req.user.managedProvinceId) {
        where.dojo = { branch: { provinceId: req.user.managedProvinceId } };
        dojoWhere.branch = { provinceId: req.user.managedProvinceId };
        provinceWhere.id = req.user.managedProvinceId;
      } else if (req.user.managedBranchId) {
        where.dojo = { branchId: req.user.managedBranchId };
        dojoWhere.branchId = req.user.managedBranchId;
        // For branch admin, provinces might not be directly relevant, 
        // but we can show the parent province if needed.
      } else if (req.user.managedDojoId) {
        where.dojoId = req.user.managedDojoId;
        dojoWhere.id = req.user.managedDojoId;
      }
    }

    const totalMembers = await prisma.member.count({ where });
    const totalDojos = await prisma.dojo.count({ where: dojoWhere });
    const totalBranches = await prisma.branch.count({ where: branchWhere });
    const totalProvinces = await prisma.province.count({ where: provinceWhere });
    
    // Summary of monthly iuran
    const iuranSum = await prisma.billing.aggregate({
      where: { 
        type: 'MONTHLY_IURAN', 
        status: 'PAID',
        member: where
      },
      _sum: { amount: true }
    });

    const membersByRank = await prisma.member.groupBy({
      by: ['dojoId', 'currentRank'],
      where,
      _count: { id: true },
    });

    const dojosInStats = await prisma.dojo.findMany({
      where: { id: { in: membersByRank.map(m => m.dojoId).filter(id => id !== null) as string[] } },
      select: { id: true, name: true }
    });
    const dojoMap = new Map(dojosInStats.map(d => [d.id, d.name]));

    const rantingStatsMap = new Map<string, { rantingId: string, rantingName: string, totalMembers: number, kyuBreakdown: Record<string, number> }>();
    for (const m of membersByRank) {
      if (!m.dojoId) continue;
      const dojoName = dojoMap.get(m.dojoId) || 'Unknown';
      if (!rantingStatsMap.has(m.dojoId)) {
        rantingStatsMap.set(m.dojoId, { rantingId: m.dojoId, rantingName: dojoName, totalMembers: 0, kyuBreakdown: {} });
      }
      const stat = rantingStatsMap.get(m.dojoId)!;
      stat.totalMembers += m._count.id;
      const rank = (m.currentRank || 'Unknown').trim().toUpperCase();
      stat.kyuBreakdown[rank] = (stat.kyuBreakdown[rank] || 0) + m._count.id;
    }

    const pendingVerifications = 0; 

    res.json({
      status: 'success',
      data: {
        totalMembers,
        totalDojos,
        totalBranches,
        totalProvinces,
        iuranTotal: iuranSum._sum.amount || 0,
        pendingVerifications,
        rantingStats: Array.from(rantingStatsMap.values())
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.user) {
      if (req.user.managedProvinceId) {
        where.dojo = { branch: { provinceId: req.user.managedProvinceId } };
      } else if (req.user.managedBranchId) {
        where.dojo = { branchId: req.user.managedBranchId };
      } else if (req.user.managedDojoId) {
        where.dojoId = req.user.managedDojoId;
      }
    }

    const members = await prisma.member.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { dojo: true }
    });
    res.json({ status: 'success', data: members });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
