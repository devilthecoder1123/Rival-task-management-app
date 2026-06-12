'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { TaskCard } from '@/components/TaskCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FiltersBar } from '@/components/FiltersBar';
import { Pagination } from '@/components/Pagination';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/States';
import type {
  Pagination as PaginationData,
  SortField,
  SortOrder,
  Task,
  TaskStatus,
} from '@/types';

const DEFAULT_PAGE_SIZE = 10;

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Auth gate - redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // --- Filters state (drives the query) ---
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  // --- Data state ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tasks currently being optimistically mutated (for visual pending state).
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const queryKey = useMemo(
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

  // Reset to page 1 whenever filters change (so we don't end up on an empty page).
  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, sortBy, sortOrder]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listTasks(queryKey);
      setTasks(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to load tasks.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  // --- Optimistic toggle-complete ---
  const handleToggleComplete = useCallback(
    async (task: Task) => {
      const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const previous = tasks;

      // Optimistically apply
      setTasks((current) =>
        current.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
      );
      setPendingIds((s) => new Set(s).add(task.id));

      try {
        await api.updateTask(task.id, { status: newStatus });
      } catch (err) {
        // Roll back
        setTasks(previous);
        const msg = err instanceof ApiClientError ? err.message : 'Could not update task.';
        setError(msg);
      } finally {
        setPendingIds((s) => {
          const next = new Set(s);
          next.delete(task.id);
          return next;
        });
      }
    },
    [tasks],
  );

  // --- Optimistic delete ---
  const handleDeleteRequest = useCallback((task: Task) => {
    setDeletingTask(task);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingTask) return;

    const task = deletingTask;
    setDeletingTask(null);

    const previous = tasks;
    const previousPagination = pagination;

    // Remove locally first
    setTasks((current) => current.filter((t) => t.id !== task.id));
    setPagination((p) => (p ? { ...p, total: Math.max(0, p.total - 1) } : p));
    setPendingIds((s) => new Set(s).add(task.id));

    try {
      await api.deleteTask(task.id);
      // If this empties the current page (and there's a previous page), step back.
      if (previous.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        // Refetch so pagination + ordering stay correct after deletion.
        await fetchTasks();
      }
    } catch (err) {
      setTasks(previous);
      setPagination(previousPagination);
      const msg = err instanceof ApiClientError ? err.message : 'Could not delete task.';
      setError(msg);
    } finally {
      setPendingIds((s) => {
        const next = new Set(s);
        next.delete(task.id);
        return next;
      });
    }
  }, [tasks, pagination, page, fetchTasks, deletingTask]);

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your tasks</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total} total` : ' '}
          </p>
        </div>
        <Link href="/tasks/new" className="btn btn-primary">
          + New task
        </Link>
      </div>

      <FiltersBar
        status={status}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
        onSortChange={(by, order) => {
          setSortBy(by);
          setSortOrder(order);
        }}
      />

      {loading ? (
        <LoadingSpinner label="Loading tasks…" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTasks} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={
            debouncedSearch || status
              ? 'Try adjusting your search or filters.'
              : "You're all caught up. Create your first task to get started."
          }
          action={
            !debouncedSearch && !status ? (
              <Link href="/tasks/new" className="btn btn-primary">
                Create task
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3" data-testid="task-list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteRequest}
              pending={pendingIds.has(task.id)}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingTask)}
        title="Delete task?"
        description={
          deletingTask
            ? `Are you sure you want to delete “${deletingTask.title}”? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
}
