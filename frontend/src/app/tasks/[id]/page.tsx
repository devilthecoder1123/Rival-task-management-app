'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRedirectIfUnauthenticated } from '@/hooks/useAuthGuard';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner, ErrorState } from '@/components/States';
import { formatDate, isOverdue } from '@/lib/date';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  useRedirectIfUnauthenticated(user, loading);

  const { task, loading: taskLoading, error, fetchTask } = useTaskDetail(params.id, user);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!task) return;
    setShowConfirmDelete(false);

    try {
      await api.deleteTask(task.id);
      router.push('/tasks');
    } catch (err) {
      setPageError(err instanceof ApiClientError ? err.message : 'Could not delete task.');
    }
  };

  if (loading || taskLoading) return <LoadingSpinner />;
  if (error || pageError) return <ErrorState message={error ?? pageError ?? 'Failed to load task.'} onRetry={fetchTask} />;
  if (!task) return null;

  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/tasks" className="btn btn-secondary">
          ← Back
        </Link>
        <div className="flex gap-2">
          <Link href={`/tasks/${task.id}/edit`} className="btn btn-primary">
            Edit
          </Link>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmDelete}
        title="Delete task?"
        description={`Are you sure you want to delete “${task.title}”? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      <article className="card space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className={`text-sm ${overdue ? 'text-danger font-medium' : 'text-muted-foreground'}`}>
              {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
              {overdue && ' (overdue)'}
            </span>
          </div>
        </div>

        {task.description && (
          <div>
            <h2 className="label">Description</h2>
            <p className="whitespace-pre-wrap text-sm">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <div>
            <span className="block font-medium text-foreground">Created</span>
            {formatDate(task.createdAt)}
          </div>
          <div>
            <span className="block font-medium text-foreground">Last updated</span>
            {formatDate(task.updatedAt)}
          </div>
        </div>
      </article>
    </div>
  );
}
