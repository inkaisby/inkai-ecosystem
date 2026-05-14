import { Request, Response } from 'express';

import prisma from '../utils/prisma';

export const MEMBER_MOBILE_WELCOME_KEY = 'member_mobile_welcome';

interface AuthRequest extends Request {
  user?: { roles?: string[] };
}

function isValidGuidePayload(body: unknown): body is Record<string, unknown> {
  if (!body || typeof body !== 'object') return false;
  const o = body as Record<string, unknown>;
  if (typeof o.version !== 'string' || !o.version.trim()) return false;
  if (typeof o.title !== 'string') return false;
  if (!Array.isArray(o.items)) return false;
  for (const item of o.items) {
    if (!item || typeof item !== 'object') return false;
    const i = item as Record<string, unknown>;
    if (typeof i.heading !== 'string' || typeof i.text !== 'string') return false;
  }
  return true;
}

/** Public: no auth — text panduan untuk app anggota */
export const getPublicMemberGuide = async (_req: Request, res: Response) => {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: MEMBER_MOBILE_WELCOME_KEY },
    });
    return res.json({
      status: 'success',
      data: row?.value ?? null,
    });
  } catch (e) {
    console.error('[memberGuide] getPublic', e);
    return res.status(500).json({ status: 'error', message: 'Failed to load guide' });
  }
};

/** Admin: simpan / timpa JSON panduan */
export const putAdminMemberGuide = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidGuidePayload(req.body)) {
      return res.status(400).json({
        status: 'error',
        message:
          'Invalid payload: need version (string), title (string), items[{heading,text}, ...]',
      });
    }

    const row = await prisma.appSetting.upsert({
      where: { key: MEMBER_MOBILE_WELCOME_KEY },
      create: {
        key: MEMBER_MOBILE_WELCOME_KEY,
        value: req.body as object,
      },
      update: {
        value: req.body as object,
      },
    });

    return res.json({ status: 'success', data: row.value });
  } catch (e) {
    console.error('[memberGuide] putAdmin', e);
    return res.status(500).json({ status: 'error', message: 'Failed to save guide' });
  }
};
