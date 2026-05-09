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
      } else if (req.user.managedDojoId) {
        where.branches = { some: { dojos: { some: { id: req.user.managedDojoId } } } };
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
    const where: any = {};
    if (provinceId && provinceId !== 'all') {
      where.provinceId = provinceId;
    }
    
    if (req.user) {
      if (req.user.managedBranchId) {
        where.id = req.user.managedBranchId;
      } else if (req.user.managedDojoId) {
        where.dojos = { some: { id: req.user.managedDojoId } };
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
    const where: any = {};
    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }

    if (req.user && req.user.managedDojoId) {
      where.id = req.user.managedDojoId;
    }

    const dojos = await prisma.dojo.findMany({
      where,
      include: { 
        _count: { select: { members: true } },
        admins: { select: { email: true } }
      }
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
    const { name, headName, adminEmail, adminPassword } = req.body;

    if (!adminEmail) {
      return res.status(400).json({ status: 'error', message: 'Email Admin wilayah wajib diisi' });
    }

    const province = await prisma.province.create({
      data: { name, headName }
    });

    // Create Admin User
    const passwordHash = adminPassword ? await bcrypt.hash(adminPassword, 12) : await bcrypt.hash('123456', 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        managedProvinceId: province.id,
        roles: {
          connectOrCreate: {
            where: { name: 'ADMIN_PROVINCE' },
            create: { name: 'ADMIN_PROVINCE' }
          }
        }
      },
      create: {
        email: adminEmail,
        passwordHash,
        managedProvinceId: province.id,
        roles: {
          connectOrCreate: {
            where: { name: 'ADMIN_PROVINCE' },
            create: { name: 'ADMIN_PROVINCE' }
          }
        }
      }
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
    const { name, headName, provinceId, adminEmail, adminPassword } = req.body;

    if (!adminEmail) {
      return res.status(400).json({ status: 'error', message: 'Email Admin cabang wajib diisi' });
    }

    const branch = await prisma.branch.create({
      data: { name, headName, provinceId },
      include: { province: true }
    });

    // Create Admin User
    const passwordHash = adminPassword ? await bcrypt.hash(adminPassword, 12) : await bcrypt.hash('123456', 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        managedBranchId: branch.id,
        roles: {
          connectOrCreate: {
            where: { name: 'ADMIN_BRANCH' },
            create: { name: 'ADMIN_BRANCH' }
          }
        }
      },
      create: {
        email: adminEmail,
        passwordHash,
        managedBranchId: branch.id,
        roles: {
          connectOrCreate: {
            where: { name: 'ADMIN_BRANCH' },
            create: { name: 'ADMIN_BRANCH' }
          }
        }
      }
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
    const { name, contactPerson, headName, address, kecamatan, tempatLatihan, phoneNumber, schedule, branchId, adminEmail, adminPassword } = req.body;
    
    if (!adminEmail) {
      return res.status(400).json({ status: 'error', message: 'Email Admin dojo wajib diisi' });
    }

    const dojo = await prisma.dojo.create({
      data: { name, contactPerson, headName: headName || contactPerson, address, kecamatan, tempatLatihan, phoneNumber, schedule, branchId },
      include: { branch: true }
    });

    const passwordHash = adminPassword ? await bcrypt.hash(adminPassword, 12) : await bcrypt.hash('123456', 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        managedDojoId: dojo.id,
        roles: {
          connectOrCreate: {
            where: { name: 'ADMIN_DOJO' },
            create: { name: 'ADMIN_DOJO' }
          }
        }
      },
      create: {
        email: adminEmail,
        passwordHash,
        managedDojoId: dojo.id,
        roles: {
          connectOrCreate: {
            where: { name: 'ADMIN_DOJO' },
            create: { name: 'ADMIN_DOJO' }
          }
        }
      }
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
      // Unlink existing admins for this province
      await prisma.user.updateMany({
        where: { managedProvinceId: id },
        data: { managedProvinceId: null }
      });

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
    console.error('Update Province Error:', error);
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
      // Unlink existing admins for this branch
      await prisma.user.updateMany({
        where: { managedBranchId: id },
        data: { managedBranchId: null }
      });

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
    console.error('Update Branch Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateDojo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, headName, address, kecamatan, tempatLatihan, phoneNumber, schedule, adminEmail, adminPassword } = req.body;
    const dojo = await prisma.dojo.update({
      where: { id },
      data: { name, contactPerson, headName: headName || contactPerson, address, kecamatan, tempatLatihan, phoneNumber, schedule }
    });

    if (adminEmail) {
      // Unlink existing admins for this dojo
      await prisma.user.updateMany({
        where: { managedDojoId: id },
        data: { managedDojoId: null }
      });

      const passwordHash = adminPassword ? await bcrypt.hash(adminPassword, 12) : undefined;
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          ...(passwordHash && { passwordHash }),
          managedDojoId: id,
          roles: {
            connectOrCreate: {
              where: { name: 'ADMIN_DOJO' },
              create: { name: 'ADMIN_DOJO' }
            }
          }
        },
        create: {
          email: adminEmail,
          passwordHash: passwordHash || (await bcrypt.hash('123456', 12)),
          managedDojoId: id,
          roles: {
            connectOrCreate: {
              where: { name: 'ADMIN_DOJO' },
              create: { name: 'ADMIN_DOJO' }
            }
          }
        }
      });
    }

    res.json({ status: 'success', data: dojo });
  } catch (error: any) {
    console.error('Update Dojo Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
