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
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.payment.create({
        data: {
          billingId,
          paymentMethod,
          externalId,
          paidAt: new Date()
        }
      });

      // 2. Update billing status
      await tx.billing.update({
        where: { id: billingId },
        data: { status: 'PAID' }
      });

      return payment;
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

