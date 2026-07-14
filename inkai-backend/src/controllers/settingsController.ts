import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: { userId?: string; roles?: string[] };
}

export const getSettingsByPrefix = async (req: AuthRequest, res: Response) => {
  try {
    const prefix = String(req.query.prefix ?? '').trim();
    if (!prefix) {
      return res.status(400).json({ status: 'error', message: 'prefix wajib' });
    }

    const settings = await prisma.appSetting.findMany({
      where: { key: { startsWith: prefix } },
    });

    return res.json({ status: 'success', data: settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ status: 'error', message });
  }
};

export const getSetting = async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    if (!setting) {
      return res.status(404).json({ status: 'error', message: 'Setting tidak ditemukan' });
    }
    return res.json({ status: 'success', data: setting });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ status: 'error', message });
  }
};

export const upsertSetting = async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body as { value?: unknown };
    if (value === undefined) {
      return res.status(400).json({ status: 'error', message: 'value wajib' });
    }

    const setting = await prisma.appSetting.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object },
    });

    return res.json({ status: 'success', data: setting });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ status: 'error', message });
  }
};
