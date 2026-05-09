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

    if (product.stock < 5) {
      await notifyAdmins({
        title: '⚠️ Stok Menipis!',
        content: `Stok produk "${product.name}" tersisa ${product.stock} unit. Segera lakukan restock.`,
        type: 'WARNING'
      });
    }

    res.json({ status: 'success', data: product });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ status: 'success', message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
