import { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { supabase } from '../utils/supabase';
import path from 'path';

/** Payload ringkas untuk session (login / GET /auth/me) — selaras bentuk `/members/me` tanpa ranks/attendance/registrations besar */
const sessionUserInclude = {
  member: {
    include: {
      dojo: {
        include: {
          branch: {
            include: { province: { select: { name: true } } },
          },
        },
      },
    },
  },
  managedProvince: { select: { name: true } },
  managedBranch: { select: { name: true } },
  managedDojo: { select: { name: true } },
  roles: {
    select: {
      name: true,
      permissions: {
        select: {
          permission: { select: { slug: true } },
        },
      },
    },
  },
};

/** Email: huruf kecil penuh (HP sering kapital otomatis di awal). NIA: tanpa spasi + varian tanpa titik jika berbeda. */
function parseLoginIdentifier(raw: string): { type: 'email'; value: string } | { type: 'nia'; values: string[] } {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    return { type: 'email', value: trimmed.toLowerCase() };
  }
  const compact = trimmed.replace(/\s+/g, '');
  const variants = new Set<string>();
  if (compact) variants.add(compact);
  const noDots = compact.replace(/\./g, '');
  if (noDots && noDots !== compact) variants.add(noDots);
  const values = Array.from(variants);
  return { type: 'nia', values: values.length ? values : ['__impossible_nia__'] };
}

function userWhereForLoginIdentifier(
  parsed: ReturnType<typeof parseLoginIdentifier>,
): Prisma.UserWhereInput {
  if (parsed.type === 'email') {
    return { email: { equals: parsed.value, mode: 'insensitive' } };
  }
  return {
    OR: parsed.values.map((v) => ({
      member: { nia: { equals: v, mode: 'insensitive' } },
    })),
  };
}

function collectPermissionSlugs(
  roles: Array<{ permissions: Array<{ permission: { slug: string } | null }> }>,
): string[] {
  const slugs = roles.flatMap((role) =>
    role.permissions.map((rp) => rp.permission?.slug).filter(Boolean),
  );
  return Array.from(new Set(slugs as string[]));
}

function buildSessionUserResponse(user: any, permissionSlugs: string[]) {
  if (user.member) {
    const m = user.member;
    return {
      ...m,
      email: user.email,
      photoUrl: user.photoUrl,
      phoneNumber: user.phoneNumber,
      nik: m.nik,
      roles: user.roles.map((r: any) => r.name),
      permissions: permissionSlugs,
      managedProvinceId: user.managedProvinceId,
      managedBranchId: user.managedBranchId,
      managedDojoId: user.managedDojoId,
      managedProvinceName: user.managedProvince?.name ?? null,
      managedBranchName: user.managedBranch?.name ?? null,
      managedDojoName: user.managedDojo?.name ?? null,
    };
  }

  return {
    fullName: user.fullName,
    email: user.email,
    photoUrl: user.photoUrl,
    phoneNumber: user.phoneNumber,
    roles: user.roles.map((r: any) => r.name),
    permissions: permissionSlugs,
    managedProvinceId: user.managedProvinceId,
    managedBranchId: user.managedBranchId,
    managedDojoId: user.managedDojoId,
    managedProvinceName: user.managedProvince?.name ?? null,
    managedBranchName: user.managedBranch?.name ?? null,
    managedDojoName: user.managedDojo?.name ?? null,
    status: 'AKTIF',
    currentRank: '-',
    nia: null,
  };
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email: emailBody, password, fullName, phoneNumber, dojoId, isParent } = req.body;
    const email =
      typeof emailBody === 'string' ? emailBody.trim().toLowerCase() : emailBody;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User and (optionally) Member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const roleName = isParent ? 'PARENT' : 'MEMBER';
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          phoneNumber,
          fullName,
          roles: {
            connectOrCreate: {
              where: { name: roleName },
              create: { name: roleName }
            }
          },
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
    const identifier =
      typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email/NIA dan kata sandi wajib diisi',
      });
    }

    const parsedId = parseLoginIdentifier(identifier);
    console.log(`Login attempt for: ${identifier}`);

    // Find user by email or NIA
    let user = await prisma.user.findFirst({
      where: userWhereForLoginIdentifier(parsedId),
      include: sessionUserInclude,
    });

    if (!user) {
      console.log(`User NOT found: ${identifier}`);
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    if (!user.isActive) {
      console.log(`User DEACTIVATED: ${user.email}`);
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.' });
    }

    console.log(`User found: ${user.email}. Checking password...`);
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log(`Password INVALID for user: ${user.email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`Password valid for user: ${user.email}`);

    const uniquePermissions = collectPermissionSlugs(user.roles);

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        memberId: user.member?.id,
        memberBranchId: user.member?.dojo?.branchId ?? null,
        roles: user.roles.map(r => r.name),
        permissions: uniquePermissions,
        managedProvinceId: user.managedProvinceId,
        managedBranchId: user.managedBranchId,
        managedDojoId: user.managedDojoId,
        managedProvinceName: user.managedProvince?.name,
        managedBranchName: user.managedBranch?.name,
        managedDojoName: user.managedDojo?.name
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const sessionUser = buildSessionUserResponse(user, uniquePermissions);

    res.json({
      status: 'success',
      token,
      data: {
        user: sessionUser,
      }
    });
  } catch (error: any) {
    console.error('[Login Error Detail]:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat login',
      debug:
        process.env.NODE_ENV === 'development' || process.env.INKAI_LOGIN_DEBUG === '1'
          ? error.message
          : undefined,
    });
  }
};

/** Profil sesi ringkas untuk bootstrap app (tanpa ranks/attendance/registrations besar) */
export const getSession = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: sessionUserInclude,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.' });
    }

    const permissionSlugs = collectPermissionSlugs(user.roles);

    res.json({
      status: 'success',
      data: buildSessionUserResponse(user, permissionSlugs),
    });
  } catch (error: any) {
    console.error('[getSession]', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const identifier =
      typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan kata sandi wajib diisi',
      });
    }

    const parsedId = parseLoginIdentifier(identifier);

    let user = await prisma.user.findFirst({
      where: userWhereForLoginIdentifier(parsedId),
      include: { 
        member: {
          include: {
            dojo: { select: { branchId: true } },
          },
        },
        managedProvince: { select: { name: true } },
        managedBranch: { select: { name: true } },
        managedDojo: { select: { name: true } },
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
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Akses Ditolak: Akun administrator Anda telah dinonaktifkan.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    // Validate Admin Roles and Managed Territories
    const userRoleNames = user.roles.map(r => r.name);
    
    const isSuperAdmin = userRoleNames.includes('ADMINISTRATOR') || userRoleNames.includes('ADMIN_PUSAT');
    const isProvinceAdmin = userRoleNames.includes('ADMIN_PROVINCE') && user.managedProvinceId;
    const isBranchAdmin = userRoleNames.includes('ADMIN_BRANCH') && user.managedBranchId;
    const isDojoAdmin = userRoleNames.includes('ADMIN_DOJO') && user.managedDojoId;

    if (!isSuperAdmin && !isProvinceAdmin && !isBranchAdmin && !isDojoAdmin) {
      return res.status(403).json({ 
        message: 'Akses Ditolak: Akun Anda tidak memiliki wewenang administratif yang valid pada wilayah manapun.' 
      });
    }

    const permissions = user.roles.flatMap(role => 
      role.permissions.map(rp => rp.permission?.slug).filter(Boolean)
    );
    const uniquePermissions = Array.from(new Set(permissions as string[]));

    const token = jwt.sign(
      { 
        userId: user.id, 
        memberId: user.member?.id,
        memberBranchId: user.member?.dojo?.branchId ?? null,
        roles: userRoleNames,
        permissions: uniquePermissions,
        managedProvinceId: user.managedProvinceId,
        managedBranchId: user.managedBranchId,
        managedDojoId: user.managedDojoId,
        managedProvinceName: user.managedProvince?.name,
        managedBranchName: user.managedBranch?.name,
        managedDojoName: user.managedDojo?.name
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
          phoneNumber: user.phoneNumber,
          photoUrl: user.photoUrl,
          nia: user.member?.nia,
          roles: userRoleNames,
          permissions: uniquePermissions,
          managedProvinceId: user.managedProvinceId,
          managedBranchId: user.managedBranchId,
          managedDojoId: user.managedDojoId,
          managedProvinceName: user.managedProvince?.name,
          managedBranchName: user.managedBranch?.name,
          managedDojoName: user.managedDojo?.name,
          memberBranchId: user.member?.dojo?.branchId ?? null
        }
      }
    });
  } catch (error: any) {
    console.error('[AdminLogin Error Detail]:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat login admin',
      debug:
        process.env.NODE_ENV === 'development' || process.env.INKAI_LOGIN_DEBUG === '1'
          ? error.message
          : undefined,
    });
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

    const fileExt = path.extname(req.file.originalname);
    const fileName = `avatar-${Date.now()}${fileExt}`;
    const filePath = `avatars/${userId}/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      throw new Error('Supabase Upload Error: ' + uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const fileUrl = publicUrl;
    
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

export const uploadFile = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const fileExt = path.extname(req.file.originalname);
    const fileName = `file-${Date.now()}${fileExt}`;
    const filePath = `misc/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      throw new Error('Supabase Upload Error: ' + uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    res.json({ 
      status: 'success', 
      message: 'File berhasil diunggah',
      fileUrl: publicUrl 
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const raw =
      typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
    if (!raw) {
      return res.status(400).json({ status: 'error', message: 'Email atau NIA wajib diisi' });
    }
    const parsedId = parseLoginIdentifier(raw);

    const user = await prisma.user.findFirst({
      where: userWhereForLoginIdentifier(parsedId),
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

    if (user.phoneNumber) {
      try {
        const fonnteToken = process.env.FONNTE_TOKEN || "mXTpegz69aVwQkDx3y2s";
        await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            Authorization: fonnteToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: user.phoneNumber,
            message: `Halo ${user.fullName || 'Anggota'},\n\nAnda baru saja meminta pemulihan kata sandi untuk akun Sistem Informasi INKAI.\n\nSilakan gunakan tautan berikut untuk mengatur ulang kata sandi Anda:\n${resetLink}\n\nJika Anda tidak merasa memintanya, abaikan pesan ini.\n\nSalam,\nSistem Informasi INKAI`
          })
        });
      } catch (err) {
        console.error("Gagal mengirim WhatsApp Fonnte:", err);
      }
    }

    res.json({
      status: 'success',
      message: 'Instruksi pemulihan telah dikirim ke WhatsApp Anda'
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

    const passwordHash = await bcrypt.hash(newPassword, 12);

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

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { fullName, phoneNumber, gender, birthPlace, birthDate, address, birthCertificateUrl, bpjsCardUrl, dojoId, nik } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { member: true }
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    console.log('[UpdateProfile] Body:', req.body);

    // 1. Update User and Member in a single transaction for speed and consistency
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          fullName: (fullName !== undefined && fullName !== '') ? fullName : user.fullName,
          phoneNumber: (phoneNumber !== undefined && phoneNumber !== '') ? phoneNumber : user.phoneNumber
        }
      });

      let finalBirthDate: Date | undefined | null = undefined;
      if (birthDate === '' || birthDate === null) {
        finalBirthDate = null;
      } else if (birthDate) {
        const d = new Date(birthDate);
        if (!isNaN(d.getTime())) {
          finalBirthDate = d;
        }
      }

      let memberRecord;
      if (user.member) {
        memberRecord = await tx.member.update({
          where: { id: user.member.id },
          data: {
            fullName: (fullName !== undefined && fullName !== '') ? fullName : user.member.fullName,
            gender: gender !== undefined ? gender : user.member.gender,
            birthPlace: birthPlace !== undefined ? birthPlace : user.member.birthPlace,
            birthDate: finalBirthDate !== undefined ? finalBirthDate : user.member.birthDate,
            address: address !== undefined ? address : user.member.address,
            birthCertificateUrl: birthCertificateUrl !== undefined ? birthCertificateUrl : user.member.birthCertificateUrl,
            bpjsCardUrl: bpjsCardUrl !== undefined ? bpjsCardUrl : user.member.bpjsCardUrl,
            dojoId: (dojoId !== undefined && dojoId !== '') ? dojoId : user.member.dojoId,
            nik: nik !== undefined ? nik : user.member.nik
          },
          include: { dojo: true }
        });
      } else if (dojoId && dojoId !== '') {
        memberRecord = await tx.member.create({
          data: {
            userId: user.id,
            dojoId: dojoId,
            fullName: (fullName !== undefined && fullName !== '') ? fullName : user.fullName || 'Anggota',
            gender: gender || 'MALE',
            birthPlace: birthPlace,
            birthDate: finalBirthDate || undefined,
            address: address,
            birthCertificateUrl: birthCertificateUrl,
            bpjsCardUrl: bpjsCardUrl,
            nik: nik,
            status: 'PENDING'
          },
          include: { dojo: true }
        });
      }
      return memberRecord;
    });

    // 2. Background Notification (Await for Vercel stability)
    if (result && result.dojo) {
      try {
        const { notifyAdmins } = require('../utils/notification');
        await notifyAdmins({
          title: 'Profil Anggota Diperbarui',
          content: `${result.fullName} telah memperbarui profil di Dojo ${result.dojo.name}`,
          type: 'INFO',
          branchId: result.dojo.branchId
        });
      } catch (err) {
        console.error('Notification failed:', err);
      }
    }

    res.json({
      status: 'success',
      message: 'Profil berhasil diperbarui'
    });
  } catch (error: any) {
    console.error('[UpdateProfile] FATAL ERROR:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'data';
      return res.status(400).json({ 
        status: 'error', 
        message: `${field === 'nik' ? 'NIK' : 'Nomor WhatsApp'} sudah digunakan oleh akun lain` 
      });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
};
