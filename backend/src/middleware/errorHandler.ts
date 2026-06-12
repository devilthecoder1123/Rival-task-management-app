import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';

// Cache the constructor reference once at module load. If Prisma's client isn't
// available (e.g. in a unit test without the generated client), this stays undefined
// and we skip the Prisma-specific branch instead of crashing on `instanceof`.
const PrismaKnownError = (Prisma as unknown as { PrismaClientKnownRequestError?: Function })
  ?.PrismaClientKnownRequestError;

/**
 * Centralized error handler. Maps Prisma errors and our AppError class
 * to a consistent JSON shape: { error: { code, message, details? } }.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  // Our own typed errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Prisma: unique constraint violation / record not found
  if (PrismaKnownError && err instanceof PrismaKnownError) {
    const prismaErr = err as Prisma.PrismaClientKnownRequestError;
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'A resource with these details already exists' },
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
      return;
    }
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : String(err),
    },
  });
};

/** 404 handler for unmatched routes. */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};
