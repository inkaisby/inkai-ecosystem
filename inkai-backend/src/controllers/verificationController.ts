import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createClaim = async (req: any, res: Response) => {
  try {
    const { type, data, proofUrl } = req.body;
    const memberId = req.user.memberId;

    const verification = await prisma.verification.create({
      data: {
        memberId,
        type,
        data,
        proofUrl,
        status: 'PENDING'
      }
    });

    res.json({ status: 'success', data: verification });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getPendingClaims = async (req: Request, res: Response) => {
  try {
    const claims = await prisma.verification.findMany({
      where: { status: 'PENDING' },
      include: { member: { select: { fullName: true, nia: true, currentRank: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ status: 'success', data: claims });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const processClaim = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const existingVerification = await prisma.verification.findUnique({ where: { id } });
    
    if (!existingVerification) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    if (existingVerification.status !== 'PENDING') {
      return res.status(400).json({ status: 'error', message: 'Claim has already been processed' });
    }

    const verification = await prisma.verification.update({
      where: { id },
      data: { status, adminNotes },
      include: { member: true }
    });

    // If approved and type is RANK_PROMOTION, update member's rank
    if (status === 'APPROVED' && verification.type === 'RANK_PROMOTION') {
      await prisma.member.update({
        where: { id: verification.memberId },
        data: { currentRank: verification.data }
      });

      // Also add to rank history
      await prisma.memberRank.create({
        data: {
          memberId: verification.memberId,
          rank: verification.data,
          date: new Date(),
          isVerified: true
        }
      });
    }

    res.json({ status: 'success', message: `Claim ${status.toLowerCase()} successfully` });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
