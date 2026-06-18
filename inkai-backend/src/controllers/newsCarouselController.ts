import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllCarouselItems = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const where = all === 'true' ? {} : { isActive: true };
    const items = await prisma.newsCarousel.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    res.json({ status: 'success', data: items });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getCarouselItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.newsCarousel.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Carousel item not found' });
    }
    res.json({ status: 'success', data: item });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createCarouselItem = async (req: Request, res: Response) => {
  try {
    const { title, imageUrl, targetUrl, order, isActive } = req.body;
    const item = await prisma.newsCarousel.create({
      data: {
        title,
        imageUrl,
        targetUrl,
        order: Number(order) || 0,
        isActive: isActive !== false,
      },
    });
    res.status(201).json({ status: 'success', data: item });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateCarouselItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, targetUrl, order, isActive } = req.body;
    const item = await prisma.newsCarousel.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(targetUrl !== undefined && { targetUrl }),
        ...(order !== undefined && { order: Number(order) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ status: 'success', data: item });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteCarouselItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.newsCarousel.delete({ where: { id } });
    res.json({ status: 'success', message: 'Carousel item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
