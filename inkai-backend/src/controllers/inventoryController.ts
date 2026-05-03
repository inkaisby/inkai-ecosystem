import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { notifyAdmins } from '../utils/notification';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json({ status: 'success', data: products });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ status: 'success', data: product });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;
    const product = await prisma.product.create({
      data: { name, description, price, stock, imageUrl }
    });

    // Notify all admins about new products
    await notifyAdmins({
      title: 'Stok Produk Baru',
      content: `Produk "${product.name}" telah ditambahkan ke katalog.`,
      type: 'INFO'
    });

    res.status(201).json({ status: 'success', data: product });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const product = await prisma.product.update({
      where: { id },
      data
    });
    res.json({ status: 'success', data: product });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
