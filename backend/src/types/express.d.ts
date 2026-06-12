import type { JwtPayload } from '../utils/jwt';

// Augment Express's Request so handlers can read `req.user` after the auth middleware runs.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
