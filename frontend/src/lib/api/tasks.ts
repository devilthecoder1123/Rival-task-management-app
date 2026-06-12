import { request } from './client';
import type { Task, TaskListQuery, TaskListResponse, TaskPriority, TaskStatus } from '@/types';

export function listTasks(query: TaskListQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return request<TaskListResponse>(`/tasks${params.toString() ? `?${params.toString()}` : ''}`);
}

export function getTask(id: string) {
  return request<{ task: Task }>(`/tasks/${id}`);
}

export function createTask(input: {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}) {
  return request<{ task: Task }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
  }>,
) {
  return request<{ task: Task }>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTask(id: string) {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}
