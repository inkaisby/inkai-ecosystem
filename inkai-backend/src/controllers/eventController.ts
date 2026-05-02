import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        categories: true,
        _count: {
          select: { registrations: true }
        }
      }
    });
    res.json({ status: 'success', data: events });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        categories: true,
        registrations: {
          include: {
            member: true
          }
        }
      }
    });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ status: 'success', data: event });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, startDate, endDate, location, categories } = req.body;
    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        categories: {
          create: categories // Array of { name, fee }
        }
      },
      include: { categories: true }
    });
    res.status(201).json({ status: 'success', data: event });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const { eventId, memberId } = req.body;
    
    // Check if already registered
    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, memberId }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        memberId,
        status: 'PENDING'
      }
    });

    res.status(201).json({ status: 'success', data: registration });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
