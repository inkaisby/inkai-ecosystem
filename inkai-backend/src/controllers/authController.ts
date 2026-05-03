import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phoneNumber, dojoId } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User and (optionally) Member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          phoneNumber,
          fullName,
          // If no dojoId, assume it's a PARENT role
          roles: !dojoId ? {
            connectOrCreate: {
              where: { name: 'PARENT' },
              create: { name: 'PARENT' }
            }
          } : undefined,
        },
      });

      if (dojoId) {
        const member = await tx.member.create({
          data: {
            userId: user.id,
            fullName,
            dojoId,
            status: 'PENDING',
          },
        });
        return { user, member };
      }

      return { user, member: null };
    });

    res.status(201).json({
      status: 'success',
      message: dojoId ? 'Registrasi Anggota berhasil' : 'Registrasi Orang Tua berhasil',
      data: {
        userId: result.user.id,
        memberId: result.member?.id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or NIA

    console.log(`Login attempt for: ${identifier}`);

    // Find user by email or NIA
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { member: { nia: identifier } }
        ]
      },
      include: { 
        member: true,
        managedProvince: { select: { name: true } },
        managedBranch: { select: { name: true } },
        roles: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log(`User NOT found: ${identifier}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`User found: ${user.email}. Checking password...`);
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log(`Password INVALID for user: ${user.email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`Password valid for user: ${user.email}`);

    // Flatten permissions
    const permissions = user.roles.flatMap(role => 
      role.permissions.map(rp => rp.permission.slug)
    );
    const uniquePermissions = Array.from(new Set(permissions));

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        memberId: user.member?.id,
        roles: user.roles.map(r => r.name),
        permissions: uniquePermissions,
        managedProvinceId: user.managedProvinceId,
        managedBranchId: user.managedBranchId,
        managedProvinceName: user.managedProvince?.name,
        managedBranchName: user.managedBranch?.name
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );


    res.json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.member?.fullName || user.fullName,
          nia: user.member?.nia,
          roles: user.roles.map(r => r.name),
          permissions: uniquePermissions,
          managedProvinceId: user.managedProvinceId,
          managedBranchId: user.managedBranchId,
          managedProvinceName: user.managedProvince?.name,
          managedBranchName: user.managedBranch?.name
        }
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ status: 'error', message: 'Kata sandi lama tidak sesuai' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });

    res.json({ status: 'success', message: 'Kata sandi berhasil diperbarui' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const uploadProfilePhoto = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    await prisma.user.update({
      where: { id: userId },
      data: { photoUrl: fileUrl }
    });

    res.json({ 
      status: 'success', 
      message: 'Foto profil berhasil diperbarui',
      photoUrl: fileUrl 
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { member: { nia: identifier } }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    });

    const resetLink = `inkai://reset-password?token=${token}`;
    console.log(`\n📧 [RESET PASSWORD] Link untuk ${user.email}:\n${resetLink}\n`);

    res.json({
      status: 'success',
      message: 'Instruksi pemulihan telah dikirim ke email Anda'
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Token tidak valid atau sudah kadaluarsa' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({
      status: 'success',
      message: 'Kata sandi berhasil diperbarui'
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
