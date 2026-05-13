import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createNotification } from '../utils/notification';

/** RANK_PROMOTION: legacy plain rank string atau JSON `{ title, date?, location? }` */
function parseRankPromotionData(raw: string): { title: string; eventDate: Date; location: string | null } {
  if (!raw || !raw.trim()) {
    return { title: 'Tanpa nama', eventDate: new Date(), location: null };
  }
  try {
    const o = JSON.parse(raw) as { title?: string; date?: string; location?: string };
    if (o && typeof o === 'object' && typeof o.title === 'string' && o.title.trim()) {
      let eventDate = new Date();
      if (o.date) {
        const d = new Date(o.date);
        if (!Number.isNaN(d.getTime())) eventDate = d;
      }
      const loc =
        typeof o.location === 'string' && o.location.trim() ? o.location.trim() : null;
      return { title: o.title.trim(), eventDate, location: loc };
    }
  } catch {
    /* plain string */
  }
  const title = raw.trim();
  return { title: title || 'Tanpa nama', eventDate: new Date(), location: null };
}

const ACHIEVEMENT_CLAIM_TYPES = ['RANK_PROMOTION', 'ACHIEVEMENT'];

export const createClaim = async (req: any, res: Response) => {
  try {
    const { type, data, proofUrl } = req.body;
    const memberId = req.user.memberId;

    if (!memberId) {
      return res.status(400).json({ status: 'error', message: 'Akun Anda tidak terhubung ke data anggota.' });
    }

    const roles = req.user.roles || [];
    const isPrivileged =
      Array.isArray(roles) && roles.some((r: unknown) => r && String(r).includes('ADMIN'));

    if (!isPrivileged && ACHIEVEMENT_CLAIM_TYPES.includes(String(type))) {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: {
          nia: true,
          birthCertificateUrl: true,
          bpjsCardUrl: true,
        },
      });
      if (!member) {
        return res.status(400).json({ status: 'error', message: 'Data anggota tidak ditemukan.' });
      }
      const hasNia = typeof member.nia === 'string' && member.nia.trim().length > 0;
      const hasBirthCert =
        typeof member.birthCertificateUrl === 'string' && member.birthCertificateUrl.trim().length > 0;
      const hasBpjs = typeof member.bpjsCardUrl === 'string' && member.bpjsCardUrl.trim().length > 0;
      if (!hasNia || !hasBirthCert || !hasBpjs) {
        return res.status(403).json({
          status: 'error',
          message:
            'Pengajuan prestasi tidak dapat dilakukan. Pastikan NIA Anda telah aktif dan dokumen Akte/KK serta BPJS sudah diunggah di halaman Dokumen.',
        });
      }
    }

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
      const memberDojo = existingVerification.member?.dojo;
      const branch = memberDojo?.branch;

      if (roles.includes('ADMIN_PROVINCE') && managedProvinceId) {
        hasAccess = !!branch && branch.provinceId === managedProvinceId;
      } else if (roles.includes('ADMIN_BRANCH') && managedBranchId) {
        hasAccess = !!memberDojo && memberDojo.branchId === managedBranchId;
      } else if (roles.includes('ADMIN_DOJO') && managedDojoId) {
        hasAccess = existingVerification.member.dojoId === managedDojoId;
      }

      if (!hasAccess) {
        return res.status(403).json({
          status: 'error',
          message:
            'Anda tidak memiliki wewenang untuk memproses pengajuan ini (di luar wilayah administrasi Anda).',
        });
      }
    }

    const verification = await prisma.verification.update({
      where: { id },
      data: { status, adminNotes },
      include: { member: true }
    });

    // If approved and type is RANK_PROMOTION, update member's rank
    if (status === 'APPROVED' && verification.type === 'RANK_PROMOTION') {
      const { title, eventDate, location } = parseRankPromotionData(verification.data);

      await prisma.member.update({
        where: { id: verification.memberId },
        data: { currentRank: title }
      });

      await prisma.memberRank.create({
        data: {
          memberId: verification.memberId,
          rank: title,
          date: eventDate,
          location: location ?? undefined,
          isVerified: true
        }
      });
    }

    // Notify member about the outcome
    const memberUserId = verification.member?.userId;

    if (verification.type === 'DOJO_TRANSFER' && memberUserId) {
      await createNotification({
        userId: memberUserId,
        title: `Pengajuan Mutasi ${status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`,
        content:
          status === 'APPROVED'
            ? 'Selamat! Pengajuan pindah dojo Anda telah disetujui. Data Anda akan segera diperbarui.'
            : `Maaf, pengajuan pindah dojo Anda ditolak. ${adminNotes ? 'Alasan: ' + adminNotes : ''}`,
        type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      });
    } else if (memberUserId && (verification.type === 'RANK_PROMOTION' || verification.type === 'ACHIEVEMENT')) {
      const approved = status === 'APPROVED';
      const kind =
        verification.type === 'RANK_PROMOTION'
          ? 'kenaikan tingkat (sabuk)'
          : 'prestasi (piagam / pelatihan)';
      await createNotification({
        userId: memberUserId,
        title: approved ? 'Pengajuan prestasi disetujui' : 'Pengajuan prestasi ditolak',
        content: approved
          ? `Pengajuan ${kind} Anda telah disetujui pusat.${adminNotes ? ' Catatan: ' + adminNotes : ''}`
          : `Maaf, pengajuan ${kind} Anda ditolak.${adminNotes ? ' Alasan: ' + adminNotes : ''}`,
        type: approved ? 'SUCCESS' : 'WARNING',
      });
    }

    res.json({ status: 'success', message: `Claim ${status.toLowerCase()} successfully` });
  } catch (error: any) {
    console.error('[VerificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
