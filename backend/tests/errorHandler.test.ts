import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../src/utils/errors';

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  it('maps BadRequestError to a 400 with details', () => {
    const res = mockResponse();
    const err = new BadRequestError('bad', [{ path: 'title', message: 'required' }]);
    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'BAD_REQUEST',
        message: 'bad',
        details: [{ path: 'title', message: 'required' }],
      },
    });
  });

  it('maps UnauthorizedError to 401', () => {
    const res = mockResponse();
    errorHandler(new UnauthorizedError(), {} as Request, res, vi.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('maps NotFoundError to 404', () => {
    const res = mockResponse();
    errorHandler(new NotFoundError(), {} as Request, res, vi.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('falls back to 500 for unknown errors', () => {
    const res = mockResponse();
    // Suppress console.error spam during this assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(new Error('boom'), {} as Request, res, vi.fn() as NextFunction);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});

describe('notFoundHandler', () => {
  it('returns a 404 JSON envelope', () => {
    const res = mockResponse();
    notFoundHandler({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });
});
