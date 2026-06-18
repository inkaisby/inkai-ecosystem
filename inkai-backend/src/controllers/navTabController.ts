import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllTabs = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const where = all === 'true' ? {} : { isActive: true };
    const tabs = await prisma.navTab.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    res.json({ status: 'success', data: tabs });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getTabBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const tab = await prisma.navTab.findUnique({
      where: { slug },
    });
    if (!tab) {
      return res.status(404).json({ status: 'error', message: 'Tab not found' });
    }
    res.json({ status: 'success', data: tab });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createTab = async (req: Request, res: Response) => {
  try {
    const { name, slug, content, order, isActive } = req.body;
    
    // Check if slug is already taken
    const existing = await prisma.navTab.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Slug already exists' });
    }

    const tab = await prisma.navTab.create({
      data: {
        name,
        slug,
        content,
        order: Number(order) || 0,
        isActive: isActive !== false,
      },
    });
    res.status(201).json({ status: 'success', data: tab });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateTab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, content, order, isActive } = req.body;

    if (slug) {
      const existing = await prisma.navTab.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ status: 'error', message: 'Slug already exists' });
      }
    }

    const tab = await prisma.navTab.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order: Number(order) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ status: 'success', data: tab });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteTab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.navTab.delete({ where: { id } });
    res.json({ status: 'success', message: 'Tab deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
