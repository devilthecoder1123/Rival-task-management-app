import { describe, expect, it } from 'vitest';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from '../src/validators/task';
import { signupSchema, loginSchema } from '../src/validators/auth';

describe('task validators', () => {
  describe('createTaskSchema', () => {
    it('accepts a minimal valid task', () => {
      const result = createTaskSchema.parse({ title: 'Write report' });
      expect(result.title).toBe('Write report');
      expect(result.status).toBe('PENDING');
      expect(result.priority).toBe('MEDIUM');
    });

    it('rejects an empty title', () => {
      expect(() => createTaskSchema.parse({ title: '' })).toThrow();
    });

    it('rejects an invalid status', () => {
      expect(() => createTaskSchema.parse({ title: 'x', status: 'NOPE' })).toThrow();
    });

    it('coerces an ISO due date to a Date object', () => {
      const result = createTaskSchema.parse({
        title: 'x',
        dueDate: '2025-12-31T00:00:00Z',
      });
      expect(result.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('updateTaskSchema', () => {
    it('rejects an empty update', () => {
      expect(() => updateTaskSchema.parse({})).toThrow(/At least one field/);
    });

    it('accepts a single field update', () => {
      const result = updateTaskSchema.parse({ status: 'COMPLETED' });
      expect(result.status).toBe('COMPLETED');
    });

    it('allows clearing the due date with null', () => {
      const result = updateTaskSchema.parse({ dueDate: null });
      expect(result.dueDate).toBeNull();
    });
  });

  describe('listTasksQuerySchema', () => {
    it('applies defaults when query is empty', () => {
      const result = listTasksQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('coerces page and pageSize from strings (query params)', () => {
      const result = listTasksQuerySchema.parse({ page: '3', pageSize: '25' });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(25);
    });

    it('caps pageSize at 100', () => {
      expect(() => listTasksQuerySchema.parse({ pageSize: '1000' })).toThrow();
    });
  });
});

describe('auth validators', () => {
  it('signupSchema requires an 8+ char password', () => {
    expect(() =>
      signupSchema.parse({ email: 'a@b.com', password: 'short', name: 'A' }),
    ).toThrow();
  });

  it('signupSchema accepts valid input', () => {
    const out = signupSchema.parse({ email: 'a@b.com', password: '12345678', name: 'Aftab' });
    expect(out.email).toBe('a@b.com');
  });

  it('loginSchema rejects an invalid email', () => {
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow();
  });
});
