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
    console.error('[VerificationController] Error:', error);
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
    console.error('[VerificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getPendingClaims = async (req: any, res: Response) => {
  try {
    const { roles, managedProvinceId, managedBranchId, managedDojoId } = req.user;
    
    let where: any = { status: 'PENDING' };

    // Apply scoping based on admin role
    const isSuperAdmin = roles.includes('ADMINISTRATOR') || roles.includes('ADMIN_PUSAT');
    
    if (!isSuperAdmin) {
      if (roles.includes('ADMIN_PROVINCE') && managedProvinceId) {
        where.member = { dojo: { branch: { provinceId: managedProvinceId } } };
      } else if (roles.includes('ADMIN_BRANCH') && managedBranchId) {
        where.member = { dojo: { branchId: managedBranchId } };
      } else if (roles.includes('ADMIN_DOJO') && managedDojoId) {
        where.member = { dojoId: managedDojoId };
      }
    }

    const claims = await prisma.verification.findMany({
      where,
      include: { 
        member: { 
          select: { 
            fullName: true, 
            nia: true, 
            currentRank: true,
            dojo: {
              select: {
                name: true,
                branch: {
                  select: {
                    name: true,
                    province: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          } 
        } 
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ status: 'success', data: claims });
  } catch (error: any) {
    console.error('[VerificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const processClaim = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const { roles, managedProvinceId, managedBranchId, managedDojoId } = req.user;

    const existingVerification = await prisma.verification.findUnique({ 
      where: { id },
      include: { 
        member: {
          include: {
            dojo: {
              include: {
                branch: true
              }
            }
          }
        }
      }
    });
    
    if (!existingVerification) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    if (existingVerification.status !== 'PENDING') {
      return res.status(400).json({ status: 'error', message: 'Claim has already been processed' });
    }

    // Scoping check
    const isSuperAdmin = roles.includes('ADMINISTRATOR') || roles.includes('ADMIN_PUSAT');
    if (!isSuperAdmin) {
      let hasAccess = false;
      const memberDojo = existingVerification.member.dojo;
      
      if (roles.includes('ADMIN_PROVINCE') && managedProvinceId) {
        hasAccess = memberDojo.branch.provinceId === managedProvinceId;
      } else if (roles.includes('ADMIN_BRANCH') && managedBranchId) {
        hasAccess = memberDojo.branchId === managedBranchId;
      } else if (roles.includes('ADMIN_DOJO') && managedDojoId) {
        hasAccess = existingVerification.member.dojoId === managedDojoId;
      }

      if (!hasAccess) {
        return res.status(403).json({ status: 'error', message: 'Access denied: You cannot process claims outside your jurisdiction' });
      }
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
    console.error('[VerificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
