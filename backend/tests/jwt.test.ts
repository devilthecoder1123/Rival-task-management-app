import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../src/utils/jwt';

describe('jwt utility', () => {
  it('signs and verifies a token round-trip', () => {
    const payload = { userId: 'user-1', email: 'a@b.com', role: 'USER' as const };
    const token = signToken(payload);
    expect(token).toEqual(expect.any(String));
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('user-1');
    expect(decoded.email).toBe('a@b.com');
    expect(decoded.role).toBe('USER');
  });

  it('throws on a tampered token', () => {
    const token = signToken({ userId: 'u', email: 'a@b.com', role: 'USER' });
    const tampered = token.slice(0, -2) + 'XX';
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('throws on a garbage token', () => {
    expect(() => verifyToken('not.a.jwt')).toThrow();
  });
});
