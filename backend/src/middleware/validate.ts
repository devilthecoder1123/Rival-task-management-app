import type { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

type ValidationErrorDetail = {
  path: string;
  message: string;
};

type ValidationSchema<T> = {
  parse(input: unknown): T;
};


export const validate =
  (schema: ValidationSchema<unknown>, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      (req as unknown as Record<Source, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof Error && Array.isArray((err as any).details)) {
        return next(new BadRequestError('Validation failed', (err as any).details));
      }
      next(err);
    }
  };
