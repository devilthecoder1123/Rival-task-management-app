import { request } from './client';
import type { User } from '@/types';

export function signup(input: { email: string; password: string; name: string }) {
  return request<{ user: User; token: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return request<{ user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' });
}

export function me() {
  return request<{ user: User }>('/auth/me');
}
