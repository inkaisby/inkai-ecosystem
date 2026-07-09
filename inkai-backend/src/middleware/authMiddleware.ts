import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';

interface AuthRequest extends Request {
  user?: any;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'secret' || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong secret (min 32 characters)');
  }
  return secret;
}

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next();
  }
  try {
    if (await isTokenBlacklisted(token)) {
      req.user = undefined;
      return next();
    }
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded as any;
  } catch {
    req.user = undefined;
  }
  next();
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }

    next();
  };
};
