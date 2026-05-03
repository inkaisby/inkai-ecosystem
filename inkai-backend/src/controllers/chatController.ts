import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId }
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ status: 'success', data: conversations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    res.json({ status: 'success', data: messages });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.userId;

    if (!participantId) {
        return res.status(400).json({ message: 'Participant ID is required' });
    }

    // Check if conversation already exists (for 1v1)
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: participantId } } }
        ]
      },
      include: {
        participants: {
            select: { id: true, fullName: true, email: true }
        }
      }
    });

    if (existing) {
      return res.json({ status: 'success', data: existing });
    }

    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [
            { id: userId },
            { id: participantId }
          ]
        }
      },
      include: {
        participants: {
            select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.status(201).json({ status: 'success', data: newConversation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
