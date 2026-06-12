import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

/**
 * Returns middleware that validates a request section against a Zod schema.
 * On success, the parsed (and type-coerced) data replaces the original.
 */
export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace the validated section with the parsed result (handles coercion/defaults).
      // Express's query is readonly in newer types, so we cast.
      (req as unknown as Record<Source, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return next(new BadRequestError('Validation failed', details));
      }
      next(err);
    }
  };
