'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate, isOverdue } from '@/lib/date';
import { LoadingSpinner, ErrorState } from '@/components/States';
import type { Task } from '@/types';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const fetchTask = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { task } = await api.getTask(params.id);
      setTask(task);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load task.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (user) fetchTask();
  }, [user, fetchTask]);

  const handleDelete = async () => {
    if (!task) return;
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!task) return;
    setShowConfirmDelete(false);

    try {
      await api.deleteTask(task.id);
      router.push('/tasks');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not delete task.');
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchTask} />;
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
        description={task ? `Are you sure you want to delete “${task.title}”? This cannot be undone.` : ''}
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
            <span
              className={`text-sm ${overdue ? 'text-danger font-medium' : 'text-muted-foreground'}`}
            >
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
