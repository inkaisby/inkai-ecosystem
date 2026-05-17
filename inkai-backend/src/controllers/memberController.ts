import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { notifyAdmins, createNotification } from '../utils/notification';
import { supabase } from '../utils/supabase';
import path from 'path';

interface AuthRequest extends Request {
  user?: any;
}

function jwtRoleNames(user: AuthRequest['user']): string[] {
  if (!user?.roles || !Array.isArray(user.roles)) return [];
  return user.roles.filter((x: unknown): x is string => typeof x === 'string');
}

/** NIA dan sabuk/Kyu aktif hanya boleh diisi/diubah pengurus tingkat cabang ke atas (+ admin pusat/super). */
function canSetMemberNiaAndRank(roleNames: string[]): boolean {
  const allowed = new Set([
    'ADMINISTRATOR',
    'ADMIN_PUSAT',
    'ADMIN_PROVINCE',
    'ADMIN_BRANCH',
    'ADMIN'
  ]);
  return roleNames.some((r) => allowed.has(r));
}

/** Buat User + tautkan ke Member (satu klik); diizinkan untuk admin wilayah/dojo. */
function canProvisionMemberLogin(roleNames: string[]): boolean {
  const allowed = new Set([
    'ADMINISTRATOR',
    'ADMIN_PUSAT',
    'ADMIN_PROVINCE',
    'ADMIN_BRANCH',
    'ADMIN_DOJO',
    'ADMIN',
  ]);
  return roleNames.some((r) => allowed.has(r));
}

function adminScopedToMember(
  reqUser: AuthRequest['user'],
  member: {
    dojoId: string;
    dojo: { branchId: string; branch: { provinceId: string } };
  },
): boolean {
  if (!reqUser) return false;
  if (reqUser.managedDojoId) return member.dojoId === reqUser.managedDojoId;
  if (reqUser.managedProvinceId) {
    return member.dojo.branch.provinceId === reqUser.managedProvinceId;
  }
  if (reqUser.managedBranchId) return member.dojo.branchId === reqUser.managedBranchId;
  return true;
}

function syntheticLoginEmailForMember(member: { id: string; nia: string | null }): string {
  const nia = member.nia?.trim();
  if (nia) {
    return `${nia.replace(/\./g, '').toLowerCase()}@inkai.id`;
  }
  return `m.${member.id.replace(/-/g, '').toLowerCase()}@inkai.id`;
}

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        member: {
          include: {
            dojo: { include: { branch: { include: { province: true } } } },
            ranks: { orderBy: { date: 'desc' } },
            attendances: { take: 20, orderBy: { checkInAt: 'desc' }, include: { dojo: true } },
            eventRegistrations: { include: { event: true } },
            _count: { select: { attendances: true, eventRegistrations: true } }
          }
        },
        roles: true,
        managedProvince: { select: { name: true } },
        managedBranch: { select: { name: true } }
      }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // If user has a member profile, return it
    if (user.member) {
      return res.json({ 
        status: 'success', 
        data: { 
          ...user.member, 
          email: user.email,
          photoUrl: user.photoUrl,
          phoneNumber: user.phoneNumber,
          nik: user.member.nik,
          roles: user.roles.map(r => r.name),
          managedProvinceName: user.managedProvince?.name,
          managedBranchName: user.managedBranch?.name
        } 
      });
    }

    // Fallback for Parent users without their own member record
    res.json({ 
      status: 'success', 
      data: {
        fullName: user.fullName,
        email: user.email,
        photoUrl: user.photoUrl,
        phoneNumber: user.phoneNumber,
        roles: user.roles.map(r => r.name),
        managedProvinceName: user.managedProvince?.name,
        managedBranchName: user.managedBranch?.name,
        status: 'AKTIF',
        currentRank: '-',
        nia: null
      }
    });
  } catch (error: any) {
    console.error('[MemberController] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, phoneNumber, gender, birthDate, nik } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: No user ID found' });
    }

    console.log(`[UpdateProfile] Starting update for user: ${userId}`);

    // Fetch current data to see what changed
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const userData: any = {};
    if (fullName && fullName !== currentUser.fullName) userData.fullName = fullName;
    
    // Only update phoneNumber if it's provided and different
    if (phoneNumber && phoneNumber !== currentUser.phoneNumber) {
      userData.phoneNumber = phoneNumber;
    }

    // 1. Update User table if there are changes
    let updatedUser = currentUser;
    if (Object.keys(userData).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userData
      });
      console.log(`[UpdateProfile] User table updated`);
    }

    // 2. Check and update Member table
    const member = await prisma.member.findUnique({ where: { userId } });
    if (member) {
      const memberData: any = {};
      if (fullName && fullName !== member.fullName) memberData.fullName = fullName;
      if (gender) memberData.gender = gender;
      if (birthDate) memberData.birthDate = new Date(birthDate);
      if (nik) memberData.nik = nik;

      if (Object.keys(memberData).length > 0) {
        await prisma.member.update({
          where: { userId },
          data: memberData
        });
        console.log(`[UpdateProfile] Member table updated`);
      }
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber
      }
    });
  } catch (error: any) {
    console.error('[UpdateProfile] FATAL ERROR:', error);
    
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'data';
      return res.status(400).json({ 
        status: 'error', 
        message: `${field === 'nik' ? 'NIK' : 'Nomor WhatsApp'} ini sudah terdaftar di akun lain.` 
      });
    }

    res.status(500).json({ 
      status: 'error', 
      message: 'Gagal memperbarui profil: ' + (error.message || 'Unknown error') 
    });
  }
};

export const getMemberDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        dojo: { 
          include: { 
            branch: { 
              include: { 
                province: true 
              } 
            } 
          } 
        },
        user: {
          select: {
            email: true,
            photoUrl: true,
            phoneNumber: true
          }
        },
        ranks: { orderBy: { date: 'desc' } },
        attendances: { take: 10, orderBy: { checkInAt: 'desc' } }
      }
    });

    if (!member) {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }

    res.json({ status: 'success', data: member });
  } catch (error: any) {
    console.error('[MemberController] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', dojoId, status } = req.query;
    const pageNum = Number(page);
    const pageSafe =
      typeof pageNum === 'number' && Number.isFinite(pageNum) && pageNum > 0
        ? Math.floor(pageNum)
        : 1;
    const take = Math.min(Math.max(Number(limit) || 10, 1), 500);
    const skip = (pageSafe - 1) * take;

    const where: any = {
      isDeleted: false,
      OR: [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { nia: { contains: String(search), mode: 'insensitive' } },
        { nik: { contains: String(search), mode: 'insensitive' } },
        { user: { email: { contains: String(search), mode: 'insensitive' } } }
      ]
    };

    if (dojoId) {
      where.dojoId = String(dojoId);
    }

    if (status) {
      where.status = String(status);
    }

    // Regional Scoping — dojo lebih spesifik dari cabang/provinsi
    if (req.user) {
      if (req.user.managedDojoId) {
        where.dojoId = String(req.user.managedDojoId);
      } else if (req.user.managedProvinceId) {
        where.dojo = {
          branch: {
            provinceId: req.user.managedProvinceId,
          },
        };
      } else if (req.user.managedBranchId) {
        where.dojo = {
          branchId: req.user.managedBranchId,
        };
      }
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        dojo: { 
          include: { 
            branch: { 
              include: { 
                province: true 
              } 
            } 
          } 
        },
        user: {
          select: {
            email: true
          }
        }
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.member.count({ where });

    res.json({
      status: 'success',
      data: members,
      meta: {
        total,
        page: pageSafe,
        limit: take
      }
    });
  } catch (error: any) {
    console.error('[MemberController] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let member = await prisma.member.findFirst({
      where: {
        OR: [
          { id: id },
          { nia: id }
        ]
      },
      include: {
        dojo: { include: { branch: { include: { province: true } } } },
        user: { include: { roles: true } }
      }
    });

    if (!member) {
      // Check if it's a User ID instead
      const user = await prisma.user.findUnique({
        where: { id: id },
        include: {
          roles: true,
          managedProvince: { select: { name: true } },
          managedBranch: { select: { name: true } }
        }
      });

      if (user) {
        const isAdmin = user.roles.some(r => r.name.includes('ADMIN'));
        if (isAdmin) {
          return res.json({
            status: 'success',
            data: {
              fullName: user.fullName,
              nia: null,
              currentRank: '-',
              status: 'AKTIF',
              dojoName: user.managedBranch?.name || user.managedProvince?.name || 'Pusat (Administrator)',
              branchName: user.managedBranch?.name || 'Administrator',
              provinceName: user.managedProvince?.name || 'Administrator',
              photoUrl: user.photoUrl,
              joinedAt: user.createdAt,
              isAdmin: true
            }
          });
        }
      }

      return res.status(404).json({ status: 'error', message: 'Anggota tidak ditemukan.' });
    }

    res.json({
      status: 'success',
      data: {
        fullName: member.fullName,
        nia: member.nia,
        currentRank: member.currentRank,
        status: member.status,
        dojoName: member.dojo.name,
        branchName: member.dojo.branch.name,
        provinceName: member.dojo.branch.province.name,
        photoUrl: member.user?.photoUrl,
        joinedAt: member.createdAt,
        isAdmin: member.user?.roles.some(r => r.name.includes('ADMIN')) || false
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
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
    console.error('[MemberController] Error:', error);
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
    console.error('[MemberController] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createMember = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      fullName, 
      dojoId, 
      gender, 
      birthDate, 
      currentRank, 
      nia,
      email,
      password,
      status = 'Active'
    } = req.body;

    const adminRoles = jwtRoleNames(req.user);

    // Check if required fields are present
    if (!fullName || !dojoId) {
      return res.status(400).json({ message: 'Full Name and Dojo are required' });
    }

    let effectiveRank = currentRank || 'Putih';

    // Convert empty NIA to null for uniqueness
    let finalNia = nia && nia.trim() !== '' ? nia.trim() : null;

    if (!canSetMemberNiaAndRank(adminRoles)) {
      finalNia = null;
      effectiveRank = 'Putih (Kyu 10)';
    }

    // Check if NIA already exists if provided
    if (finalNia) {
      const existingMember = await prisma.member.findUnique({ where: { nia: finalNia } });
      if (existingMember) {
        return res.status(400).json({ message: 'NIA sudah digunakan oleh anggota lain' });
      }
    }

    const newMember = await prisma.$transaction(async (tx) => {
      let userId = undefined;
      
      if (email) {
        // Check if user already exists
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error('Email sudah terdaftar');
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 12);
        const user = await tx.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            fullName,
            roles: {
              connectOrCreate: {
                where: { name: 'MEMBER' },
                create: { name: 'MEMBER' }
              }
            }
          }
        });
        userId = user.id;
      }

      return await tx.member.create({
        data: {
          fullName,
          dojoId,
          gender,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          currentRank: effectiveRank,
          nia: finalNia,
          status,
          userId
        },
        include: {
          dojo: {
            include: {
              branch: {
                include: {
                  province: true
                }
              }
            }
          },
          user: {
            select: {
              email: true
            }
          }
        }
      });
    });

    // Notify admins
    await notifyAdmins({
      title: 'Anggota Baru Terdaftar',
      content: `${newMember.fullName} telah terdaftar di Dojo ${newMember.dojo.name}`,
      type: 'SUCCESS',
      role: 'ADMIN_BRANCH',
      branchId: newMember.dojo.branchId
    });

    res.status(201).json({ status: 'success', data: newMember });
  } catch (error: any) {
    console.error('[MemberController] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      fullName, 
      dojoId, 
      gender, 
      birthDate, 
      currentRank, 
      nia,
      email,
      password,
      status
    } = req.body;

    const adminRoles = jwtRoleNames(req.user);
    if (!canSetMemberNiaAndRank(adminRoles)) {
      if (Object.prototype.hasOwnProperty.call(req.body, 'nia') ||
          Object.prototype.hasOwnProperty.call(req.body, 'currentRank')) {
        return res.status(403).json({
          message:
            'Hanya pengurus cabang ke atas atau pusat yang dapat mengubah NIA atau sabuk/Kyu.'
        });
      }
    }

    if (nia !== undefined) {
      const finalNia = nia && String(nia).trim() !== '' ? String(nia).trim() : null;
      if (finalNia) {
        const existingMember = await prisma.member.findFirst({ 
          where: { 
            nia: finalNia,
            NOT: { id } 
          } 
        });
        if (existingMember) {
          return res.status(400).json({ message: 'NIA sudah digunakan oleh anggota lain' });
        }
      }
    }

    let priorForNotify: {
      nia: string | null;
      currentRank: string | null;
    } | null = null;

    const updatedMember = await prisma.$transaction(async (tx) => {
      const currentMember = await tx.member.findUnique({ 
        where: { id },
        include: { user: true }
      });

      if (!currentMember) throw new Error('Member not found');

      priorForNotify = {
        nia: currentMember.nia ?? null,
        currentRank: currentMember.currentRank ?? null,
      };

      let userId = currentMember.userId;

      if (email || password) {
        if (userId) {
          // Update existing user
          const userData: any = {};
          if (email && email !== currentMember.user?.email) {
            // Check if email is already taken by ANOTHER user
            const existingUser = await tx.user.findUnique({ where: { email } });
            if (existingUser && existingUser.id !== userId) throw new Error('Email sudah terdaftar di akun lain');
            userData.email = email;
          }
          if (password) userData.passwordHash = await bcrypt.hash(password, 12);
          
          if (Object.keys(userData).length > 0) {
            await tx.user.update({
              where: { id: userId },
              data: userData
            });
          }
        } else if (email) {
          // Create new user if email provided but no user exists
          const existingUser = await tx.user.findUnique({ where: { email } });
          if (existingUser) throw new Error('Email sudah terdaftar');

          const hashedPassword = await bcrypt.hash(password || '123456', 12);
          const user = await tx.user.create({
            data: {
              email,
              passwordHash: hashedPassword,
              fullName,
              roles: {
                connectOrCreate: {
                  where: { name: 'MEMBER' },
                  create: { name: 'MEMBER' }
                }
              }
            }
          });
          userId = user.id;
        }
      }

      const memberUpdateData: Record<string, unknown> = {};
      if (fullName !== undefined) memberUpdateData.fullName = fullName;
      if (dojoId !== undefined) memberUpdateData.dojoId = dojoId;
      if (gender !== undefined) memberUpdateData.gender = gender;
      if (birthDate !== undefined) {
        if (birthDate) {
          const d = new Date(birthDate);
          memberUpdateData.birthDate = !isNaN(d.getTime()) ? d : null;
        } else {
          memberUpdateData.birthDate = null;
        }
      }
      if (currentRank !== undefined) memberUpdateData.currentRank = currentRank;
      if (status !== undefined) memberUpdateData.status = status;
      if (nia !== undefined) {
        memberUpdateData.nia =
          nia && String(nia).trim() !== '' ? String(nia).trim() : null;
      }
      if (userId !== currentMember.userId) memberUpdateData.userId = userId;

      return await tx.member.update({
        where: { id },
        data: memberUpdateData,
        include: {
          dojo: {
            include: {
              branch: {
                include: {
                  province: true
                }
              }
            }
          },
          user: {
            select: {
              email: true
            }
          }
        }
      });
    });

    type UpdatedMemberLite = {
      nia?: string | null;
      currentRank?: string | null;
      userId?: string | null;
    };
    const out = updatedMember as UpdatedMemberLite;
    const priorSnap = priorForNotify as {
      nia: string | null;
      currentRank: string | null;
    } | null;

    if (priorSnap && out.userId) {
      const normalizeNia = (v: unknown) =>
        typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
      const normalizeRankLabel = (v: unknown) =>
        typeof v === 'string' && v.trim() !== '' ? v.trim() : '';

      const prevN = normalizeNia(priorSnap.nia);
      const nextN = normalizeNia(out.nia);
      const prevR = normalizeRankLabel(priorSnap.currentRank);
      const nextR = normalizeRankLabel(out.currentRank ?? '');

      const niaChanged = prevN !== nextN;
      const rankChanged = prevR !== nextR;

      if (niaChanged || rankChanged) {
        const parts: string[] = [];
        if (niaChanged) {
          parts.push(
            out.nia && String(out.nia).trim() !== ''
              ? `NIA Anda diperbarui menjadi ${String(out.nia).trim()}.`
              : 'NIA Anda telah dihapus/dikosongkan oleh pengurus.'
          );
        }
        if (rankChanged) {
          parts.push(
            `Sabuk/Kyu Anda diperbarui menjadi ${normalizeRankLabel(out.currentRank) || '—'}.`
          );
        }

        await createNotification({
          userId: out.userId,
          title: 'Data keanggotaan diperbarui',
          content: parts.join(' '),
          type: 'SUCCESS',
        });
      }
    }

    res.json({ status: 'success', data: updatedMember });
  } catch (error: any) {
    console.error('Update Member Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldName } = req.body;
    const userId = req.user.userId;

    console.log(`[Upload] User ${userId} is uploading for field ${fieldName}`);
    
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    // 1. Prepare file info
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${fieldName}-${Date.now()}${fileExt}`;
    const filePath = `documents/${userId}/${fileName}`;

    // 2. Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      throw new Error('Supabase Upload Error: ' + uploadError.message);
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const fileUrl = publicUrl;
    
    const updateData: any = {};
    if (fieldName === 'akte_lahir') {
      updateData.birthCertificateUrl = fileUrl;
    } else if (fieldName === 'bpjs') {
      updateData.bpjsCardUrl = fileUrl;

      const rawNum = req.body?.bpjsCardNumber;
      if (rawNum != null && String(rawNum).trim() !== '') {
        updateData.bpjsCardNumber = String(rawNum).replace(/\s+/g, '').trim();
      }

      const rawOcr = req.body?.bpjsOcrExtracted;
      if (rawOcr != null && String(rawOcr).trim() !== '') {
        try {
          const parsed = typeof rawOcr === 'string' ? JSON.parse(rawOcr) : rawOcr;
          if (parsed && typeof parsed === 'object') {
            updateData.bpjsOcrExtracted = parsed;
          }
        } catch {
          console.warn('[Upload] Invalid bpjsOcrExtracted JSON, skipping');
        }
      }
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid field name: ' + fieldName });
    }

    // Ensure member exists
    let member = await prisma.member.findUnique({ where: { userId } });
    if (!member) {
      console.log(`[Upload] Member record not found for user ${userId}. Creating one...`);
      
      // Try to find a relevant dojo
      const defaultDojo = await prisma.dojo.findFirst({
        where: req.user.managedBranchId ? { branchId: req.user.managedBranchId } : {}
      });

      if (!defaultDojo) {
        return res.status(400).json({ status: 'error', message: 'Tidak ada Dojo yang tersedia untuk menautkan profil anggota Anda.' });
      }

      // Find user to get full name if possible
      const user = await prisma.user.findUnique({ where: { id: userId } });

      member = await prisma.member.create({
        data: {
          userId,
          fullName: user?.fullName || user?.email.split('@')[0] || "Anggota",
          dojoId: defaultDojo.id,
          status: 'Active'
        }
      });
      console.log(`[Upload] Created member record ${member.id}`);
    }

    const updatedMember = await prisma.member.update({
      where: { userId },
      data: updateData
    });

    console.log(`[Upload] Success! File saved at ${fileUrl}`);

    res.json({ 
      status: 'success', 
      data: updatedMember,
      fileUrl 
    });
  } catch (error: any) {
    console.error('[Upload] Server Error:', error);
    res.status(500).json({ status: 'error', message: 'Server Error: ' + error.message });
  }
};


export const bulkCreateMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { members } = req.body;

    if (!Array.isArray(members)) {
      return res.status(400).json({ status: 'error', message: 'Data members harus berupa array' });
    }

    const adminRoles = jwtRoleNames(req.user);
    const canSetRankNia = canSetMemberNiaAndRank(adminRoles);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // We process sequentially or in small chunks to avoid overloading and handle errors per item
    for (const m of members) {
      try {
        const { 
          fullName, 
          dojoId, 
          gender, 
          birthDate, 
          currentRank, 
          nia,
          email,
          password,
          status = 'Active'
        } = m;

        if (!fullName || !dojoId) {
          throw new Error('Nama Lengkap dan Dojo wajib diisi');
        }

        let finalNia = nia && String(nia).trim() !== '' ? String(nia).trim() : null;

        let currentRankStored: string =
          typeof currentRank === 'string' && currentRank.trim() !== ''
            ? currentRank.trim()
            : 'Putih';

        if (!canSetRankNia) {
          finalNia = null;
          currentRankStored = 'Putih (Kyu 10)';
        }

        if (finalNia) {
          const existingMember = await prisma.member.findUnique({ where: { nia: finalNia } });
          if (existingMember) {
            throw new Error(`NIA ${finalNia} sudah digunakan`);
          }
        }

        await prisma.$transaction(async (tx) => {
          let userId = undefined;
          
          if (email) {
            const existingUser = await tx.user.findUnique({ where: { email } });
            if (existingUser) {
              throw new Error(`Email ${email} sudah terdaftar`);
            }

            const hashedPassword = await bcrypt.hash(password || '123456', 12);
            const user = await tx.user.create({
              data: {
                email,
                passwordHash: hashedPassword,
                fullName,
                roles: {
                  connectOrCreate: {
                    where: { name: 'MEMBER' },
                    create: { name: 'MEMBER' }
                  }
                }
              }
            });
            userId = user.id;
          }

          await tx.member.create({
            data: {
              fullName: fullName.toUpperCase(),
              dojoId,
              gender,
              birthDate: birthDate ? new Date(birthDate) : undefined,
              currentRank: canSetRankNia
                ? currentRankStored.toUpperCase()
                : currentRankStored,
              nia: finalNia,
              status,
              userId
            }
          });
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          member: m.fullName || 'Unknown',
          error: error.message
        });
      }
    }

    res.json({
      status: 'success',
      message: `Berhasil mengimpor ${results.success} anggota. Gagal: ${results.failed}`,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Admin corrects a single MemberRank row (tingkat, tanggal, lokasi, verifikasi).
 * Memperbarui currentRank anggota ke entri terverifikasi terbaru (berdasarkan tanggal).
 */
export const updateMemberRank = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, rankId } = req.params;
    const { rank, date, location, isVerified } = req.body ?? {};

    const adminRoles = jwtRoleNames(req.user);
    if (!canSetMemberNiaAndRank(adminRoles)) {
      return res.status(403).json({
        status: 'error',
        message:
          'Hanya pengurus cabang ke atas atau pusat yang dapat menyunting riwayat sabuk/Kyu.',
      });
    }

    const row = await prisma.memberRank.findFirst({
      where: { id: rankId, memberId },
    });

    if (!row) {
      return res.status(404).json({
        status: 'error',
        message: 'Riwayat tingkat tidak ditemukan',
      });
    }

    const data: Record<string, unknown> = {};

    if (rank !== undefined) {
      const t = String(rank).trim();
      if (!t) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama tingkatan tidak boleh kosong',
        });
      }
      data.rank = t;
    }

    if (date !== undefined) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({
          status: 'error',
          message: 'Format tanggal tidak valid',
        });
      }
      data.date = d;
    }

    if (location !== undefined) {
      if (location === null || location === '') {
        data.location = null;
      } else {
        data.location = String(location).trim() || null;
      }
    }

    if (isVerified !== undefined) {
      data.isVerified = Boolean(isVerified);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Tidak ada data yang diubah',
      });
    }

    await prisma.memberRank.update({
      where: { id: rankId },
      data: data as any,
    });

    const newestVerified = await prisma.memberRank.findFirst({
      where: { memberId, isVerified: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    if (newestVerified) {
      await prisma.member.update({
        where: { id: memberId },
        data: { currentRank: newestVerified.rank },
      });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        dojo: {
          include: {
            branch: {
              include: { province: true },
            },
          },
        },
        user: {
          select: {
            email: true,
            photoUrl: true,
            phoneNumber: true,
          },
        },
        ranks: { orderBy: { date: 'desc' } },
        attendances: { take: 10, orderBy: { checkInAt: 'desc' } },
      },
    });

    res.json({ status: 'success', data: member });
  } catch (error: any) {
    console.error('[updateMemberRank]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error',
    });
  }
};

/** Admin: buat akun User (password default 123456) untuk Member yang belum punya userId. */
export const provisionMemberLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminRoles = jwtRoleNames(req.user);
    if (!canProvisionMemberLogin(adminRoles)) {
      return res.status(403).json({
        status: 'error',
        message: 'Tidak ada wewenang untuk membuat akun login anggota.',
      });
    }

    const member = await prisma.member.findFirst({
      where: { id, isDeleted: false },
      include: {
        dojo: { include: { branch: true } },
      },
    });

    if (!member) {
      return res.status(404).json({ status: 'error', message: 'Anggota tidak ditemukan.' });
    }

    if (!adminScopedToMember(req.user, member)) {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak untuk anggota di luar wilayah Anda.',
      });
    }

    if (member.userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Anggota ini sudah memiliki akun login.',
      });
    }

    const email = syntheticLoginEmailForMember(member);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message:
          `Email ${email} sudah terpakai. Ubah NIA anggota atau hubungi admin (bentrok dengan akun lain).`,
      });
    }

    const hashedPassword = await bcrypt.hash('123456', 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          fullName: member.fullName,
          roles: {
            connectOrCreate: {
              where: { name: 'MEMBER' },
              create: { name: 'MEMBER' },
            },
          },
        },
      });
      await tx.member.update({
        where: { id: member.id },
        data: { userId: u.id },
      });
      return u;
    });

    res.json({
      status: 'success',
      message:
        'Akun login berhasil dibuat. Default password: 123456 — minta anggota segera mengganti sandi.',
      data: {
        memberId: member.id,
        userId: user.id,
        email: user.email,
        defaultPassword: '123456',
      },
    });
  } catch (error: any) {
    console.error('[provisionMemberLogin]', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    await prisma.member.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.json({ status: 'success', message: 'Member deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
