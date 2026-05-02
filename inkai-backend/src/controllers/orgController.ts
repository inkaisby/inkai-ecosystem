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

