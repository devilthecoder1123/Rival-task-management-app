import type { Request, Response } from 'express';
import * as authService from '../services/authService';
import { config } from '../lib/config';
import { UnauthorizedError } from '../utils/errors';

const COOKIE_NAME = 'token';

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SECURE ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    path: '/',
  });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { user, token } = await authService.signup(req.body);
  setAuthCookie(res, token);
  res.status(201).json({ user, token });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { user, token } = await authService.login(req.body);
  setAuthCookie(res, token);
  res.status(200).json({ user, token });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).end();
};

export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const user = await authService.getMe(req.user.userId);
  res.json({ user });
};
