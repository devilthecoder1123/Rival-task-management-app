'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRedirectIfUnauthenticated } from '@/hooks/useAuthGuard';
import { useTaskList } from '@/hooks/useTaskList';
import { TaskCard } from '@/components/TaskCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FiltersBar } from '@/components/FiltersBar';
import { Pagination } from '@/components/Pagination';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/States';

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  useRedirectIfUnauthenticated(user, authLoading);

  const {
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
    requestDelete,
    cancelDelete,
    confirmDelete,
    fetchTasks,
    toggleTaskComplete,
  } = useTaskList(user);

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
            search || status
              ? 'Try adjusting your search or filters.'
              : "You're all caught up. Create your first task to get started."
          }
          action={
            !search && !status ? (
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
              onToggleComplete={toggleTaskComplete}
              onDelete={requestDelete}
              pending={pendingIds.has(task.id)}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pt-4">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
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
        onCancel={cancelDelete}
      />
    </div>
  );
}
