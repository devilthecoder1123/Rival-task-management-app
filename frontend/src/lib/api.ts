import type {
  Task,
  TaskListResponse,
  TaskListQuery,
  User,
  TaskStatus,
  TaskPriority,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Array<{ path: string; message: string }>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // send cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  // Some endpoints return 204 No Content (logout, delete).
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = (data as { error?: { code: string; message: string; details?: unknown } }).error;
    throw new ApiClientError(
      res.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Request failed',
      error?.details as Array<{ path: string; message: string }> | undefined,
    );
  }

  return data as T;
}

// --- Auth ---
export const api = {
  signup: (input: { email: string; password: string; name: string }) =>
    request<{ user: User; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  me: () => request<{ user: User }>('/auth/me'),

  // --- Tasks ---
  listTasks: (query: TaskListQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return request<TaskListResponse>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  getTask: (id: string) => request<{ task: Task }>(`/tasks/${id}`),

  createTask: (input: {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
  }) =>
    request<{ task: Task }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateTask: (
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: string | null;
    }>,
  ) =>
    request<{ task: Task }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
