import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

/**
 * Requires a valid JWT. Token can come from an httpOnly cookie ("token")
 * or an Authorization: Bearer header (useful for API clients / tests).
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const cookieToken = req.cookies?.token as string | undefined;
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;

    const token = cookieToken ?? headerToken;
    if (!token) throw new UnauthorizedError('Authentication required');

    req.user = verifyToken(token);
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

/** Requires the authenticated user to have the ADMIN role. */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(new UnauthorizedError());
  if (req.user.role !== 'ADMIN') return next(new ForbiddenError('Admin access required'));
  next();
};
