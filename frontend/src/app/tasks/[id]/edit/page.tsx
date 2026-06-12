'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { LoadingSpinner, ErrorState } from '@/components/States';
import type { Task } from '@/types';

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (values: TaskFormValues) => {
    if (!task) return;
    try {
      await api.updateTask(task.id, {
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      });
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError ? err.message : 'Could not update task.',
      );
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchTask} />;
  if (!task) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit task</h1>
        <Link href={`/tasks/${task.id}`} className="btn btn-secondary">
          ← Back
        </Link>
      </div>
      <div className="card">
        <TaskForm
          initial={task}
          submitLabel="Save changes"
          onSubmit={onSubmit}
          onCancel={() => router.push(`/tasks/${task.id}`)}
        />
      </div>
    </div>
  );
}
