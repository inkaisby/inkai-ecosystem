import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { notifyAdmins } from '../utils/notification';

interface AuthRequest extends Request {
  user?: any;
}

export const getProvinces = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.user) {
      if (req.user.managedProvinceId) {
        where.id = req.user.managedProvinceId;
      } else if (req.user.managedBranchId) {
        where.branches = { some: { id: req.user.managedBranchId } };
      }
    }

    const provinces = await prisma.province.findMany({
      where,
      include: {
        _count: { select: { branches: true } },
        admins: { select: { email: true } },
        branches: {
          include: {
            _count: { select: { dojos: true } },
            dojos: {
              include: {
                _count: { select: { members: true } }
              }
            }
          }
        }
      }
    });
    res.json({ status: 'success', data: provinces });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};


export const getBranches = async (req: AuthRequest, res: Response) => {
  try {
    const { provinceId } = req.params;
    const where: any = { provinceId };
    
    if (req.user) {
      if (req.user.managedBranchId) {
        where.id = req.user.managedBranchId;
      }
    }

    const branches = await prisma.branch.findMany({
      where,
      include: { 
        _count: { select: { dojos: true } },
        admins: { select: { email: true } }
      }
    });
    res.json({ status: 'success', data: branches });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDojos = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.params;
    const where: any = { branchId };

    const dojos = await prisma.dojo.findMany({
      where,
      include: { _count: { select: { members: true } } }
    });
    res.json({ status: 'success', data: dojos });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getDojo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dojo = await prisma.dojo.findUnique({
      where: { id },
      include: { 
        branch: { include: { province: true } },
        _count: { select: { members: true } }
      }
    });
    res.json({ status: 'success', data: dojo });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const searchDojos = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const dojos = await prisma.dojo.findMany({
      where: {
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { address: { contains: q as string, mode: 'insensitive' } }
        ]
      },
      include: { branch: { include: { province: true } } }
    });
    res.json({ status: 'success', data: dojos });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createProvince = async (req: Request, res: Response) => {
  try {
    const { name, headName } = req.body;
    const province = await prisma.province.create({
      data: { name, headName }
    });

    // Notify PP INKAI
    await notifyAdmins({
      title: 'PENGPROV Baru',
      content: `Provinsi ${province.name} telah didaftarkan dalam sistem.`,
      type: 'SUCCESS',
      role: 'ADMIN_PUSAT'
    });

    res.json({ status: 'success', data: province });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, headName, provinceId } = req.body;
    const branch = await prisma.branch.create({
      data: { name, headName, provinceId },
      include: { province: true }
    });

    // Notify PENGPROV
    await notifyAdmins({
      title: 'PENGCAB Baru',
      content: `Cabang ${branch.name} telah didaftarkan di ${branch.province.name}.`,
      type: 'SUCCESS',
      role: 'ADMIN_PROVINCE',
      provinceId: branch.provinceId
    });

    res.json({ status: 'success', data: branch });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createDojo = async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, address, kecamatan, tempatLatihan, phoneNumber, schedule, branchId } = req.body;
    const dojo = await prisma.dojo.create({
      data: { name, contactPerson, address, kecamatan, tempatLatihan, phoneNumber, schedule, branchId },
      include: { branch: true }
    });

    // Notify PENGCAB
    await notifyAdmins({
      title: 'Dojo Baru',
      content: `Dojo ${dojo.name} telah didaftarkan di ${dojo.branch.name}.`,
      type: 'SUCCESS',
      role: 'ADMIN_BRANCH',
      branchId: dojo.branchId
    });

    res.json({ status: 'success', data: dojo });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateProvince = async (req: Request, res: Response) => {
  try {

    const { id } = req.params;
    const { name, headName, adminEmail, adminPassword } = req.body;
    
    const province = await prisma.province.update({
      where: { id },
      data: { name, headName }
    });

    if (adminEmail) {
      const passwordHash = adminPassword ? await bcrypt.hash(adminPassword, 12) : undefined;
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          ...(passwordHash && { passwordHash }),
          managedProvinceId: id,
          roles: {
            connectOrCreate: {
              where: { name: 'ADMIN_PROVINCE' },
              create: { name: 'ADMIN_PROVINCE' }
            }
          }
        },
        create: {
          email: adminEmail,
          passwordHash: passwordHash || (await bcrypt.hash('123456', 12)),
          managedProvinceId: id,
          roles: {
            connectOrCreate: {
              where: { name: 'ADMIN_PROVINCE' },
              create: { name: 'ADMIN_PROVINCE' }
            }
          }
        }
      });
    }

    res.json({ status: 'success', data: province });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {

    const { id } = req.params;
    const { name, headName, adminEmail, adminPassword } = req.body;
    
    const branch = await prisma.branch.update({
      where: { id },
      data: { name, headName }
    });

    if (adminEmail) {
      const passwordHash = adminPassword ? await bcrypt.hash(adminPassword, 12) : undefined;
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          ...(passwordHash && { passwordHash }),
          managedBranchId: id,
          roles: {
            connectOrCreate: {
              where: { name: 'ADMIN_BRANCH' },
              create: { name: 'ADMIN_BRANCH' }
            }
          }
        },
        create: {
          email: adminEmail,
          passwordHash: passwordHash || (await bcrypt.hash('123456', 12)),
          managedBranchId: id,
          roles: {
            connectOrCreate: {
              where: { name: 'ADMIN_BRANCH' },
              create: { name: 'ADMIN_BRANCH' }
            }
          }
        }
      });
    }

    res.json({ status: 'success', data: branch });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateDojo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, address, kecamatan, tempatLatihan, phoneNumber, schedule } = req.body;
    const dojo = await prisma.dojo.update({
      where: { id },
      data: { name, contactPerson, address, kecamatan, tempatLatihan, phoneNumber, schedule }
    });
    res.json({ status: 'success', data: dojo });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
