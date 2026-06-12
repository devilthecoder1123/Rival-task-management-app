import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';




const PrismaKnownError = (Prisma as unknown as { PrismaClientKnownRequestError?: Function })
  ?.PrismaClientKnownRequestError;



export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  
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


export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
};
