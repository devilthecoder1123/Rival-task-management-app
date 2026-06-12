import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '@/lib/api';
import type { Task } from '@/types';

export function useTaskDetail(taskId: string | undefined, user: unknown) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.getTask(taskId);
      setTask(result.task);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load task.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (user && taskId) fetchTask();
  }, [user, taskId, fetchTask]);

  return { task, loading, error, fetchTask };
}
