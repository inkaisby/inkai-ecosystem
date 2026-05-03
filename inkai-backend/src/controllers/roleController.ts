import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ status: 'success', data: roles });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ status: 'success', data: permissions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body; // Array of permission IDs

    // Use a transaction to update permissions
    await prisma.$transaction([
      // 1. Remove all existing permissions for this role
      prisma.rolePermission.deleteMany({
        where: { roleId }
      }),
      // 2. Add new permissions
      prisma.rolePermission.createMany({
        data: permissionIds.map((pId: string) => ({
          roleId,
          permissionId: pId
        }))
      })
    ]);

    res.json({ status: 'success', message: 'Hak akses role berhasil diperbarui' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
