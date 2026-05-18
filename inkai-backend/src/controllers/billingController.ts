import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMemberBillings = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const billings = await prisma.billing.findMany({
      where: { memberId },
      include: { payment: true },
      orderBy: { dueDate: 'desc' }
    });
    res.json({ status: 'success', data: billings });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createBilling = async (req: Request, res: Response) => {
  try {
    const { memberId, type, amount, dueDate } = req.body;
    
    let finalAmount = amount;
    if (type === 'MONTHLY_IURAN' && (amount === undefined || amount === null)) {
      const member = await prisma.member.findUnique({
        where: { id: memberId }
      });
      if (member) {
        finalAmount = member.monthlyDuesAmount;
      } else {
        finalAmount = 50000;
      }
    } else if (amount === undefined || amount === null) {
      finalAmount = 50000;
    }

    const billing = await prisma.billing.create({
      data: {
        memberId,
        type,
        amount: finalAmount,
        dueDate: new Date(dueDate),
        status: 'PENDING'
      }
    });
    res.status(201).json({ status: 'success', data: billing });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { billingId, paymentMethod, externalId, proofUrl } = req.body as {
      billingId?: string;
      paymentMethod?: string;
      externalId?: string;
      proofUrl?: string;
    };

    if (!billingId || typeof billingId !== 'string' || !paymentMethod || typeof paymentMethod !== 'string') {
      return res.status(400).json({ status: 'error', message: 'billingId dan paymentMethod wajib.' });
    }

    /** QRIS statis = nominal manual di e-wallet → menunggu verifikasi; VA = simulasi lunas */
    const WAITING_VERIFICATION_METHODS = new Set(['CASH', 'TRANSFER', 'QRIS']);
    const status = WAITING_VERIFICATION_METHODS.has(paymentMethod) ? 'WAITING_VERIFICATION' : 'PAID';

    const proofTrimmed =
      typeof proofUrl === 'string' && proofUrl.trim() !== '' ? proofUrl.trim() : null;

    if (paymentMethod === 'TRANSFER' && !proofTrimmed) {
      return res.status(400).json({
        status: 'error',
        message: 'Unggah bukti pembayaran (gambar atau PDF) terlebih dahulu.',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          billingId,
          paymentMethod,
          externalId: externalId ?? null,
          proofUrl: proofTrimmed,
          paidAt: status === 'PAID' ? new Date() : null,
        },
      });

      const updatedBilling = await tx.billing.update({
        where: { id: billingId },
        data: { status },
      });

      if (status === 'PAID' && updatedBilling.registrationId) {
        await tx.eventRegistration.update({
          where: { id: updatedBilling.registrationId },
          data: { status: 'PAID' },
        });
      }

      return payment;
    });

    res.json({ status: 'success', data: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: 'error', message: msg });
  }
};

export const getAllBillings = async (req: any, res: Response) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Regional Scoping
    if (req.user) {
      if (req.user.managedProvinceId) {
        where.member = { dojo: { branch: { provinceId: req.user.managedProvinceId } } };
      } else if (req.user.managedBranchId) {
        where.member = { dojo: { branchId: req.user.managedBranchId } };
      } else if (req.user.managedDojoId) {
        where.member = { dojoId: req.user.managedDojoId };
      }
    }

    const billings = await prisma.billing.findMany({
      where,
      include: { 
        member: { select: { fullName: true, nia: true, dojo: { select: { name: true } } } },
        payment: true 
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.billing.count({ where });

    res.json({ status: 'success', data: billings, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const verifyPayment = async (req: any, res: Response) => {
  try {
    const { billingId, adminNotes } = req.body;
    const adminId = req.user.userId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update billing status
      const billing = await tx.billing.update({
        where: { id: billingId },
        data: { 
          status: 'PAID'
        }
      });

      // 2. Update payment record (set paidAt and record verifier)
      await tx.payment.updateMany({
        where: { billingId: billingId },
        data: { 
          paidAt: new Date(),
          // Note: Add metadata to notes for audit trail
          externalId: `Verified by Admin ${adminId}` 
        }
      });

      // 3. If has registrationId, update registration status
      if (billing.registrationId) {
        await tx.eventRegistration.update({
          where: { id: billing.registrationId },
          data: { status: 'PAID' }
        });
      }

      return billing;
    });

    res.json({ status: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteBilling = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the billing first to check for registrationId
      const billing = await tx.billing.findUnique({
        where: { id }
      });

      if (!billing) {
        throw new Error('Billing not found');
      }

      if (billing.status !== 'PENDING') {
        throw new Error('Only pending bills can be deleted');
      }

      // 2. If has registrationId, delete the registration first (due to FK if any, though usually we just want both gone)
      if (billing.registrationId) {
        await tx.eventRegistration.delete({
          where: { id: billing.registrationId }
        });
      }

      // 3. Delete billing
      return await tx.billing.delete({
        where: { id }
      });
    });

    res.json({ status: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getMyBillings = async (req: any, res: Response) => {
  try {
    const memberId = req.user.memberId;
    const billings = await prisma.billing.findMany({
      where: { memberId },
      include: { payment: true },
      orderBy: { dueDate: 'desc' }
    });
    res.json({ status: 'success', data: billings });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

