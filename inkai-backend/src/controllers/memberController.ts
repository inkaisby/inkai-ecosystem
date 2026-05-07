import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { notifyAdmins } from '../utils/notification';

interface AuthRequest extends Request {
  user?: any;
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
        roles: user.roles.map(r => r.name),
        managedProvinceName: user.managedProvince?.name,
        managedBranchName: user.managedBranch?.name,
        status: 'AKTIF',
        currentRank: '-',
        nia: null
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, phoneNumber, gender, birthDate } = req.body;
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
      return res.status(400).json({ 
        status: 'error', 
        message: 'Nomor WhatsApp ini sudah terdaftar di akun lain.' 
      });
    }

    res.status(500).json({ 
      status: 'error', 
      message: 'Gagal memperbarui profil: ' + (error.message || 'Unknown error') 
    });
  }
};

export const getAllMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', dojoId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      OR: [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { nia: { contains: String(search), mode: 'insensitive' } }
      ]
    };

    if (dojoId) {
      where.dojoId = String(dojoId);
    }

    // Regional Scoping
    if (req.user) {
      if (req.user.managedProvinceId) {
        where.dojo = {
          branch: {
            provinceId: req.user.managedProvinceId
          }
        };
      } else if (req.user.managedBranchId) {
        where.dojo = {
          branchId: req.user.managedBranchId
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
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.member.count({ where });

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

export const createMember = async (req: Request, res: Response) => {
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

    // Check if required fields are present
    if (!fullName || !dojoId) {
      return res.status(400).json({ message: 'Full Name and Dojo are required' });
    }

    // Check if NIA already exists if provided
    if (nia) {
      const existingMember = await prisma.member.findUnique({ where: { nia } });
      if (existingMember) {
        return res.status(400).json({ message: 'NIA already exists' });
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
          currentRank: currentRank || 'Putih',
          nia,
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
    res.status(500).json({ message: error.message });
  }
};

export const updateMember = async (req: Request, res: Response) => {
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

    if (nia) {
      const existingMember = await prisma.member.findFirst({ 
        where: { 
          nia,
          NOT: { id }
        } 
      });
      if (existingMember) {
        return res.status(400).json({ message: 'NIA already exists' });
      }
    }

    const updatedMember = await prisma.$transaction(async (tx) => {
      const currentMember = await tx.member.findUnique({ 
        where: { id },
        include: { user: true }
      });

      if (!currentMember) throw new Error('Member not found');

      let userId = currentMember.userId;

      if (email || password) {
        if (userId) {
          // Update existing user
          const userData: any = {};
          if (email) userData.email = email;
          if (password) userData.passwordHash = await bcrypt.hash(password, 12);
          
          await tx.user.update({
            where: { id: userId },
            data: userData
          });
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

      return await tx.member.update({
        where: { id },
        data: {
          fullName,
          dojoId,
          gender,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          currentRank,
          nia,
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

    res.json({ status: 'success', data: updatedMember });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

    const fileUrl = `/uploads/${req.file.filename}`;
    
    const updateData: any = {};
    if (fieldName === 'akte_lahir') {
      updateData.birthCertificateUrl = fileUrl;
    } else if (fieldName === 'bpjs') {
      updateData.bpjsCardUrl = fileUrl;
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

