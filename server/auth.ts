import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { type Request, type Response, type NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Environment variables for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'production-tracker-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface TokenPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Authentication middleware
 */
export async function authenticateToken(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      res.status(401).json({ 
        message: 'Token de acesso requerido',
        error: 'NO_TOKEN'
      });
      return;
    }

    const payload = verifyToken(token);
    const user = await storage.getUser(payload.userId);

    if (!user) {
      res.status(401).json({ 
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND'
      });
      return;
    }

    // SECURITY: Check if user is still approved - CRITICAL VALIDATION
    if (user.status !== 'approved') {
      let message = "Acesso negado - status da conta alterado";
      let error = "ACCESS_DENIED";
      
      if (user.status === 'pending') {
        message = "Sua conta está aguardando aprovação do administrador";
        error = "PENDING_APPROVAL";
      } else if (user.status === 'rejected') {
        message = "Sua conta foi rejeitada pelo administrador";
        error = "ACCOUNT_REJECTED";
      }
      
      res.status(403).json({ message, error });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        message: 'Token inválido',
        error: 'INVALID_TOKEN'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        message: 'Token expirado',
        error: 'TOKEN_EXPIRED'
      });
      return;
    }

    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Authorization middleware factory
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        message: 'Acesso não autorizado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        message: 'Permissão insuficiente',
        error: 'INSUFFICIENT_PERMISSION',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
}

/**
 * Role hierarchy for granular control
 */
export const ROLE_HIERARCHY = {
  admin: 3,
  supervisor: 2,
  operator: 1,
} as const;

/**
 * Check if user has minimum role level
 */
export function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 999;
  return userLevel >= requiredLevel;
}

/**
 * Minimum role middleware factory
 */
export function requireMinimumRole(requiredRole: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        message: 'Acesso não autorizado',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!hasMinimumRole(req.user.role, requiredRole)) {
      res.status(403).json({ 
        message: 'Nível de acesso insuficiente',
        error: 'INSUFFICIENT_LEVEL',
        required: requiredRole,
        current: req.user.role
      });
      return;
    }

    next();
  };
} 