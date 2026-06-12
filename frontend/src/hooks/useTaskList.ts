import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { api, ApiClientError } from '@/lib/api';
import type { Pagination, SortField, SortOrder, Task, TaskStatus } from '@/types';

const DEFAULT_PAGE_SIZE = 10;

export function useTaskList(user: unknown) {
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useMemo(
    () => ({
      status: status || undefined,
      search: debouncedSearch.trim() || undefined,
      sortBy,
      sortOrder,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    [status, debouncedSearch, sortBy, sortOrder, page],
  );

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.listTasks(query);
      setTasks(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to load tasks.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  const toggleTaskComplete = useCallback(
    async (task: Task) => {
      const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const previous = tasks;

      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, status: newStatus } : item)),
      );
      setPendingIds((set) => new Set(set).add(task.id));

      try {
        await api.updateTask(task.id, { status: newStatus });
      } catch (err) {
        setTasks(previous);
        const msg = err instanceof ApiClientError ? err.message : 'Could not update task.';
        setError(msg);
      } finally {
        setPendingIds((set) => {
          const next = new Set(set);
          next.delete(task.id);
          return next;
        });
      }
    },
    [tasks],
  );

  const requestDelete = useCallback((task: Task) => {
    setDeletingTask(task);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingTask) return;

    const task = deletingTask;
    setDeletingTask(null);

    const previous = tasks;
    const previousPagination = pagination;

    setTasks((current) => current.filter((item) => item.id !== task.id));
    setPagination((pageData) => (pageData ? { ...pageData, total: Math.max(0, pageData.total - 1) } : pageData));
    setPendingIds((set) => new Set(set).add(task.id));

    try {
      await api.deleteTask(task.id);
      if (previous.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchTasks();
      }
    } catch (err) {
      setTasks(previous);
      setPagination(previousPagination);
      const msg = err instanceof ApiClientError ? err.message : 'Could not delete task.';
      setError(msg);
    } finally {
      setPendingIds((set) => {
        const next = new Set(set);
        next.delete(task.id);
        return next;
      });
    }
  }, [deletingTask, tasks, pagination, page, fetchTasks]);

  const cancelDelete = useCallback(() => {
    setDeletingTask(null);
  }, []);

  return {
    status,
    setStatus,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    tasks,
    pagination,
    loading,
    error,
    pendingIds,
    deletingTask,
    setDeletingTask,
    requestDelete,
    confirmDelete,
    cancelDelete,
    fetchTasks,
    toggleTaskComplete,
  };
}
