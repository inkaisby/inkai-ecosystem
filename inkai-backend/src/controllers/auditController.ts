import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const actionFilter = (req.query.action as string) || '';

    const whereClause: any = {};

    if (actionFilter) {
      whereClause.action = actionFilter;
    }

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { ip: { contains: search, mode: 'insensitive' } },
        { userAgent: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
            ]
          }
        }
      ];
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    res.json({
      status: 'success',
      data: {
        logs,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createAuditLog = async (req: AuthRequest, res: Response) => {
  try {
    const { action, details, ip, userAgent } = req.body as {
      action?: string;
      details?: string;
      ip?: string;
      userAgent?: string;
    };
    if (!action?.trim()) {
      return res.status(400).json({ status: 'error', message: 'action wajib' });
    }

    const log = await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        email: req.user?.email,
        action: action.trim(),
        details: details?.trim() || undefined,
        ip: ip?.trim() || undefined,
        userAgent: userAgent?.trim() || undefined,
      },
    });

    return res.status(201).json({ status: 'success', data: log });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ status: 'error', message });
  }
};
