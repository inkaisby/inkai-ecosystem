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
    const billing = await prisma.billing.create({
      data: {
        memberId,
        type,
        amount,
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
    const { billingId, paymentMethod, externalId } = req.body;
    const status = paymentMethod === 'CASH' ? 'WAITING_VERIFICATION' : 'PAID';
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.payment.create({
        data: {
          billingId,
          paymentMethod,
          externalId,
          paidAt: status === 'PAID' ? new Date() : null
        }
      });

      // 2. Update billing status
      const updatedBilling = await tx.billing.update({
        where: { id: billingId },
        data: { status }
      });

      // 3. If PAID and has registrationId, update registration status
      if (status === 'PAID' && updatedBilling.registrationId) {
        await tx.eventRegistration.update({
          where: { id: updatedBilling.registrationId },
          data: { status: 'PAID' }
        });
      }

      return payment;
    });

    res.json({ status: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { billingId, adminNotes } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update billing status
      const billing = await tx.billing.update({
        where: { id: billingId },
        data: { status: 'PAID' }
      });

      // 2. Update payment record (set paidAt)
      await tx.payment.updateMany({
        where: { billingId: billingId },
        data: { 
          paidAt: new Date()
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

