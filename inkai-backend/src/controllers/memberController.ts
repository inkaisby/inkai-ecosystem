import { Request, Response } from 'express';
import prisma from '../utils/prisma';
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

    const member = await prisma.member.findUnique({ where: { userId } });

    if (member) {
      const updatedMember = await prisma.member.update({
        where: { userId },
        data: {
          fullName,
          gender,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          user: {
            update: { phoneNumber, fullName }
          }
        }
      });
      return res.json({ status: 'success', data: updatedMember });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        phoneNumber
      }
    });

    res.json({
      status: 'success',
      data: {
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        status: 'AKTIF'
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      OR: [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { nia: { contains: String(search), mode: 'insensitive' } }
      ]
    };

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

    const newMember = await prisma.member.create({
      data: {
        fullName,
        dojoId,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        currentRank: currentRank || 'Putih',
        nia,
        status
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
        }
      }
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

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        fullName,
        dojoId,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        currentRank,
        nia,
        status
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
        }
      }
    });

    res.json({ status: 'success', data: updatedMember });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

