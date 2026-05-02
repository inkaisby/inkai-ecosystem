import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getProvinces = async (req: Request, res: Response) => {
  const provinces = await prisma.province.findMany({
    include: {
      _count: { select: { branches: true } },
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
};


export const getBranches = async (req: Request, res: Response) => {
  const { provinceId } = req.params;
  const branches = await prisma.branch.findMany({
    where: { provinceId },
    include: { _count: { select: { dojos: true } } }
  });
  res.json({ status: 'success', data: branches });
};

export const getDojos = async (req: Request, res: Response) => {
  const { branchId } = req.params;
  const dojos = await prisma.dojo.findMany({
    where: { branchId },
    include: { _count: { select: { members: true } } }
  });
  res.json({ status: 'success', data: dojos });
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
    res.json({ status: 'success', data: province });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, headName, provinceId } = req.body;
    const branch = await prisma.branch.create({
      data: { name, headName, provinceId }
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
      data: { name, contactPerson, address, kecamatan, tempatLatihan, phoneNumber, schedule, branchId }
    });
    res.json({ status: 'success', data: dojo });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateProvince = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, headName } = req.body;
    const province = await prisma.province.update({
      where: { id },
      data: { name, headName }
    });
    res.json({ status: 'success', data: province });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, headName } = req.body;
    const branch = await prisma.branch.update({
      where: { id },
      data: { name, headName }
    });
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
