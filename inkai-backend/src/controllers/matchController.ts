import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { eventId, tatamiNumber, status, categoryId } = req.query;
    const where: any = {};

    if (eventId) where.eventId = String(eventId);
    if (tatamiNumber) where.tatamiNumber = Number(tatamiNumber);
    if (status) where.status = String(status);
    if (categoryId) where.categoryId = String(categoryId);

    const matches = await prisma.match.findMany({
      where,
      orderBy: [
        { tatamiNumber: 'asc' },
        { matchNumber: 'asc' }
      ],
      include: {
        category: true,
        event: {
          select: { id: true, title: true, location: true }
        }
      }
    });

    res.json({
      status: 'success',
      data: matches
    });
  } catch (err: any) {
    console.error('[MatchController] getMatches error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const getMatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: { category: true, event: true }
    });

    if (!match) {
      return res.status(404).json({ status: 'error', message: 'Match not found' });
    }

    res.json({ status: 'success', data: match });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const updateMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      akaScore,
      aoScore,
      akaSenshu,
      aoSenshu,
      akaPenalties,
      aoPenalties,
      status,
      winnerName,
      round,
      tatamiNumber,
      matchNumber,
      estTime
    } = req.body;

    const data: any = {};
    if (typeof akaScore === 'number') data.akaScore = akaScore;
    if (typeof aoScore === 'number') data.aoScore = aoScore;
    if (typeof akaSenshu === 'boolean') data.akaSenshu = akaSenshu;
    if (typeof aoSenshu === 'boolean') data.aoSenshu = aoSenshu;
    if (typeof akaPenalties === 'number') data.akaPenalties = akaPenalties;
    if (typeof aoPenalties === 'number') data.aoPenalties = aoPenalties;
    if (status) data.status = status;
    if (winnerName !== undefined) data.winnerName = winnerName;
    if (round) data.round = round;
    if (tatamiNumber) data.tatamiNumber = Number(tatamiNumber);
    if (matchNumber) data.matchNumber = Number(matchNumber);
    if (estTime) data.estTime = estTime;

    const updated = await prisma.match.update({
      where: { id },
      data,
      include: { category: true }
    });

    res.json({
      status: 'success',
      data: updated
    });
  } catch (err: any) {
    console.error('[MatchController] updateMatch error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

export const createMatch = async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      categoryId,
      round,
      matchNumber,
      tatamiNumber,
      status,
      akaName,
      akaDojoName,
      akaMemberId,
      aoName,
      aoDojoName,
      aoMemberId,
      estTime
    } = req.body;

    if (!eventId || !akaName || !aoName) {
      return res.status(400).json({
        status: 'error',
        message: 'eventId, akaName, and aoName are required'
      });
    }

    const created = await prisma.match.create({
      data: {
        eventId,
        categoryId: categoryId || null,
        round: round || 'Babak 1',
        matchNumber: Number(matchNumber) || 1,
        tatamiNumber: Number(tatamiNumber) || 1,
        status: status || 'SCHEDULED',
        akaName,
        akaDojoName: akaDojoName || 'Dojo Kontingen',
        akaMemberId: akaMemberId || null,
        aoName,
        aoDojoName: aoDojoName || 'Dojo Kontingen',
        aoMemberId: aoMemberId || null,
        estTime: estTime || 'TBA'
      },
      include: { category: true }
    });

    res.status(201).json({
      status: 'success',
      data: created
    });
  } catch (err: any) {
    console.error('[MatchController] createMatch error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};
