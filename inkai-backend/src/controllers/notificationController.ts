import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMyNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ status: 'success', data: notifications });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const markAsRead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ status: 'success', message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const broadcastNotification = async (req: Request, res: Response) => {
  try {
    const { title, content, type } = req.body;
    
    // For simplicity, broadcast creates a notification for all users
    // In a real app, you might use a separate Broadcast model or a message queue
    const users = await prisma.user.findMany({ select: { id: true } });
    
    await prisma.notification.createMany({
      data: users.map(user => ({
        title,
        content,
        type,
        userId: user.id
      }))
    });

    res.json({ status: 'success', message: 'Broadcast sent successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
