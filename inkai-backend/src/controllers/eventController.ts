import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { notifyAdmins, createNotification } from '../utils/notification';

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

export const getMyEvents = async (req: any, res: Response) => {
  try {
    const memberId = req.user.memberId;
    if (!memberId) {
      return res.json({ status: 'success', data: [] });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { 
        memberId,
        event: {
          endDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      include: {
        event: {
          include: { categories: true }
        },
        category: true
      },
      orderBy: { event: { startDate: 'desc' } }
    });

    const events = registrations.map(reg => ({
      ...reg.event,
      registrationStatus: reg.status,
      selectedCategory: reg.category
    }));

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
            member: {
              include: {
                dojo: {
                  include: { branch: true }
                },
                billings: {
                  where: { type: 'EVENT_FEE' }
                }
              }
            },
            category: true
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

export const createEvent = async (req: any, res: Response) => {
  try {
    const { title, description, startDate, endDate, location, categories } = req.body;
    const userId = req.user?.id;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        createdById: userId,
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
    const { eventId, memberId, categoryId } = req.body;
    
    // Check if already registered
    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, memberId }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event. Use update instead.' });
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        memberId,
        categoryId,
        status: 'PENDING'
      },
      include: {
        member: {
          include: {
            dojo: {
              include: { branch: true }
            }
          }
        },
        event: true,
        category: true
      }
    });

    // Create Billing record if category has fee
    if (registration.category && registration.category.fee > 0) {
      await prisma.billing.create({
        data: {
          memberId: registration.memberId,
          registrationId: registration.id,
          type: 'EVENT_FEE',
          amount: registration.category.fee,
          description: `Biaya pendaftaran ${registration.event.title} - ${registration.category.name}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'PENDING'
        }
      });

      // Notify Member
      if (registration.member.userId) {
        await createNotification({
          userId: registration.member.userId,
          title: 'Tagihan Pendaftaran Event',
          content: `Silakan lanjut pembayaran untuk ${registration.event.title} kategori ${registration.category.name} sebesar Rp ${registration.category.fee.toLocaleString('id-ID')}`,
          type: 'INFO'
        });
      }
    }

    // Notify Branch Admin
    if (registration.member.dojo.branchId) {
      await notifyAdmins({
        title: 'Pendaftaran Event Baru',
        content: `Anggota ${registration.member.fullName} mendaftar ke ${registration.event.title}${registration.category ? ` (Kategori: ${registration.category.name})` : ''}`,
        branchId: registration.member.dojo.branchId,
        type: 'SUCCESS'
      });
    }

    res.status(201).json({ status: 'success', data: registration });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Registration ID
    const { categoryId } = req.body;

    const registration = await prisma.eventRegistration.update({
      where: { id },
      data: { categoryId },
      include: {
        member: {
          include: {
            dojo: {
              include: { branch: true }
            }
          }
        },
        event: true,
        category: true
      }
    });

    // Update/Create Billing record if category has fee
    if (registration.category && registration.category.fee > 0) {
      // Find existing billing for this member and type (simplified logic: check recent pending ones)
      const existingBilling = await prisma.billing.findFirst({
        where: { 
          memberId: registration.memberId,
          registrationId: registration.id,
          type: 'EVENT_FEE',
          status: 'PENDING'
        }
      });

      if (existingBilling) {
        await prisma.billing.update({
          where: { id: existingBilling.id },
          data: { 
            amount: registration.category.fee,
            description: `Biaya pendaftaran ${registration.event.title} - ${registration.category.name}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      } else {
        await prisma.billing.create({
          data: {
            memberId: registration.memberId,
            registrationId: registration.id,
            type: 'EVENT_FEE',
            amount: registration.category.fee,
            description: `Biaya pendaftaran ${registration.event.title} - ${registration.category.name}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'PENDING'
          }
        });
      }

      // Notify Member
      if (registration.member.userId) {
        await createNotification({
          userId: registration.member.userId,
          title: 'Pendaftaran Event Diperbarui',
          content: `Pendaftaran Anda untuk ${registration.event.title} telah diperbarui ke kategori ${registration.category.name}. Silakan cek tagihan Anda.`,
          type: 'INFO'
        });
      }
    }

    // Notify Branch Admin about update
    if (registration.member.dojo.branchId) {
      await notifyAdmins({
        title: 'Pendaftaran Event Diperbarui',
        content: `Anggota ${registration.member.fullName} memperbarui pendaftaran ke ${registration.event.title}${registration.category ? ` (Kategori Baru: ${registration.category.name})` : ''}`,
        branchId: registration.member.dojo.branchId,
        type: 'INFO'
      });
    }

    res.json({ status: 'success', data: registration });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateEvent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, location, categories } = req.body;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    // Check ownership or admin role
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

    const isAdmin = userRoles.some((role: string) => ['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH'].includes(role));
    const isOwner = existingEvent.createdById === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to update this event' });
    }

    // Use transaction to update event and categories
    const event = await prisma.$transaction(async (tx) => {
      // 1. Update basic info
      const updatedEvent = await tx.event.update({
        where: { id },
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
        },
      });

      // 2. If categories are provided, replace them
      if (categories && Array.isArray(categories)) {
        // Delete existing categories
        await tx.eventCategory.deleteMany({
          where: { eventId: id }
        });

        // Create new ones
        await tx.event.update({
          where: { id },
          data: {
            categories: {
              create: categories.map((c: any) => ({
                name: c.name,
                fee: parseFloat(c.fee)
              }))
            }
          }
        });
      }

      return tx.event.findUnique({
        where: { id },
        include: { categories: true }
      });
    });

    res.json({ status: 'success', data: event });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteEvent = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    // Check ownership or admin role
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

    const isAdmin = userRoles.some((role: string) => ['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH'].includes(role));
    const isOwner = existingEvent.createdById === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to delete this event' });
    }
    
    // Use transaction to ensure all related data is deleted
    await prisma.$transaction([
      prisma.eventCategory.deleteMany({ where: { eventId: id } }),
      prisma.eventRegistration.deleteMany({ where: { eventId: id } }),
      prisma.verification.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } })
    ]);

    res.json({ status: 'success', message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
