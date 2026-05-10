import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createNotification } from '../utils/notification';

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

    // Notify member
    if (type === 'DOJO_TRANSFER') {
      const member = await prisma.member.findUnique({ where: { id: memberId }, select: { userId: true } });
      if (member?.userId) {
        await createNotification({
          userId: member.userId,
          title: 'Pengajuan Mutasi Terkirim',
          content: 'Permohonan pindah dojo Anda telah berhasil diajukan dan sedang menunggu verifikasi.',
          type: 'INFO'
        });
      }
    }

    res.json({ status: 'success', data: verification });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMyClaims = async (req: any, res: Response) => {
  try {
    const memberId = req.user.memberId;
    
    if (!memberId) {
      return res.status(400).json({ status: 'error', message: 'User is not a member' });
    }

    const claims = await prisma.verification.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ status: 'success', data: claims });
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

    // Notify member about the outcome
    if (verification.type === 'DOJO_TRANSFER') {
      const member = await prisma.member.findUnique({ where: { id: verification.memberId }, select: { userId: true } });
      if (member?.userId) {
        await createNotification({
          userId: member.userId,
          title: `Pengajuan Mutasi ${status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`,
          content: status === 'APPROVED' 
            ? 'Selamat! Pengajuan pindah dojo Anda telah disetujui. Data Anda akan segera diperbarui.'
            : `Maaf, pengajuan pindah dojo Anda ditolak. ${adminNotes ? 'Alasan: ' + adminNotes : ''}`,
          type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING'
        });
      }
    }

    res.json({ status: 'success', message: `Claim ${status.toLowerCase()} successfully` });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
