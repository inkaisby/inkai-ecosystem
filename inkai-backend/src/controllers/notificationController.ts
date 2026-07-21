import { Request, Response } from 'express';
import prisma from '../utils/prisma';

const MAX_LIMIT = 100;

export const getMyNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const rawLimit = Number(req.query?.limit);
    const take =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
        : MAX_LIMIT;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        audience: true,
        userId: true,
        isRead: true,
        createdAt: true,
      },
    });
    res.json({ status: 'success', data: notifications });
  } catch (error: any) {
    console.error('[NotificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const markAsRead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.userId },
      data: { isRead: true },
    });
    res.json({ status: 'success', message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('[NotificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const markAllAsRead = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('[NotificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const clearReadNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });
    res.json({ status: 'success', message: 'Read notifications cleared' });
  } catch (error: any) {
    console.error('[NotificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createNotification = async (req: any, res: Response) => {
  try {
    const { userId, title, content, type, audience } = req.body as {
      userId?: string;
      title?: string;
      content?: string;
      type?: string;
      audience?: string;
    };
    if (!userId || !title?.trim() || !content?.trim()) {
      return res.status(400).json({ status: 'error', message: 'userId, title, dan content wajib' });
    }

    const audienceNorm =
      audience === 'ADMIN' || audience === 'BROADCAST' || audience === 'MEMBER'
        ? audience
        : 'MEMBER';

    const notification = await prisma.notification.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        type: type || 'INFO',
        audience: audienceNorm,
      },
    });

    return res.status(201).json({ status: 'success', data: notification });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ status: 'error', message });
  }
};

export const broadcastNotification = async (req: any, res: Response) => {
  try {
    const { title, content, type, targetRole, dojoId, branchId } = req.body;
    const admin = req.user;

    // Build filter for recipients — always scoped; never all users.
    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // 1. Apply Regional Constraints from the Sender (Security Policy)
    if (admin.managedProvinceId) {
      where.member = { dojo: { branch: { provinceId: admin.managedProvinceId } } };
    } else if (admin.managedBranchId) {
      where.member = { dojo: { branchId: admin.managedBranchId } };
    } else if (admin.managedDojoId) {
      where.member = { dojoId: admin.managedDojoId };
    } else if (!targetRole && !dojoId && !branchId) {
      return res.status(400).json({
        status: 'error',
        message: 'Broadcast wajib punya scope wilayah atau targetRole',
      });
    }

    // 2. Apply optional filters from Request Body (if within scope)
    if (targetRole) {
      where.roles = { some: { name: targetRole } };
    }
    if (dojoId && !admin.managedBranchId && !admin.managedProvinceId) {
      where.member = { dojoId };
    }
    if (branchId && !admin.managedProvinceId) {
      where.member = { ...(where.member || {}), dojo: { branchId } };
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
      take: 5000,
    });

    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Tidak ada target user yang ditemukan untuk filter ini.' });
    }

    await prisma.notification.createMany({
      data: users.map((user) => ({
        title,
        content,
        type: type || 'INFO',
        userId: user.id,
        audience: 'BROADCAST',
      })),
    });

    res.json({
      status: 'success',
      message: `Broadcast berhasil dikirim ke ${users.length} pengguna.`,
    });
  } catch (error: any) {
    console.error('[NotificationController] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
